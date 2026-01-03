import { openDB, IDBPDatabase } from "idb";
import { supabase } from "@/integrations/supabase/client";

interface TrackPointOffline {
  id: string;
  walk_id: string;
  lat: number;
  lon: number;
  ts: string;
  accuracy_m: number | null;
  speed_mps: number | null;
  synced: boolean;
}

interface WalkOffline {
  id: string;
  user_id: string;
  dog_id: string | null;
  started_at: string;
  ended_at: string | null;
  distance_m: number | null;
  duration_s: number | null;
  sniff_time_s: number | null;
  synced: boolean;
}

const DB_NAME = "floofmap-offline";
const DB_VERSION = 1;

let db: IDBPDatabase | null = null;

export async function initDB(): Promise<IDBPDatabase> {
  if (db) return db;

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      // Walks store
      if (!database.objectStoreNames.contains("walks")) {
        const walksStore = database.createObjectStore("walks", { keyPath: "id" });
        walksStore.createIndex("synced", "synced");
      }

      // Track points store
      if (!database.objectStoreNames.contains("trackPoints")) {
        const pointsStore = database.createObjectStore("trackPoints", { keyPath: "id" });
        pointsStore.createIndex("walk_id", "walk_id");
        pointsStore.createIndex("synced", "synced");
      }

      // Pending sync queue
      if (!database.objectStoreNames.contains("pendingSync")) {
        database.createObjectStore("pendingSync", { keyPath: "id" });
      }
    },
  });

  return db;
}

export async function saveWalkOffline(walk: WalkOffline): Promise<void> {
  const database = await initDB();
  await database.put("walks", { ...walk, synced: false });
  await database.put("pendingSync", {
    type: "walk",
    id: walk.id,
    timestamp: Date.now(),
  });
}

export async function saveTrackPointOffline(point: TrackPointOffline): Promise<void> {
  const database = await initDB();
  await database.put("trackPoints", { ...point, synced: false });
  await database.put("pendingSync", {
    type: "trackPoint",
    id: point.id,
    timestamp: Date.now(),
  });
}

export async function saveTrackPointsBatch(points: TrackPointOffline[]): Promise<void> {
  const database = await initDB();
  const tx = database.transaction(["trackPoints", "pendingSync"], "readwrite");

  for (const point of points) {
    await tx.objectStore("trackPoints").put({ ...point, synced: false });
    await tx.objectStore("pendingSync").put({
      type: "trackPoint",
      id: point.id,
      timestamp: Date.now(),
    });
  }

  await tx.done;
}

export async function getUnsyncedWalks(): Promise<WalkOffline[]> {
  const database = await initDB();
  const allWalks = await database.getAll("walks");
  return allWalks.filter(w => !w.synced) as WalkOffline[];
}

export async function getUnsyncedTrackPoints(): Promise<TrackPointOffline[]> {
  const database = await initDB();
  const allPoints = await database.getAll("trackPoints");
  return allPoints.filter(p => !p.synced) as TrackPointOffline[];
}

export async function getTrackPointsForWalk(walkId: string): Promise<TrackPointOffline[]> {
  const database = await initDB();
  const allPoints = await database.getAll("trackPoints");
  return allPoints.filter(p => p.walk_id === walkId) as TrackPointOffline[];
}

export async function markWalkSynced(walkId: string): Promise<void> {
  const database = await initDB();
  const walk = await database.get("walks", walkId);
  if (walk) {
    await database.put("walks", { ...walk, synced: true });
    await database.delete("pendingSync", walkId);
  }
}

export async function markTrackPointSynced(pointId: string): Promise<void> {
  const database = await initDB();
  const point = await database.get("trackPoints", pointId);
  if (point) {
    await database.put("trackPoints", { ...point, synced: true });
    await database.delete("pendingSync", pointId);
  }
}

export async function syncToSupabase(): Promise<{ synced: number; failed: number }> {
  let synced = 0;
  let failed = 0;

  try {
    // Check if online
    if (!navigator.onLine) {
      console.log("Offline - skipping sync");
      return { synced, failed };
    }

    // Sync walks first
    const unsyncedWalks = await getUnsyncedWalks();
    for (const walk of unsyncedWalks) {
      try {
        const { error } = await supabase.from("walks").upsert({
          id: walk.id,
          user_id: walk.user_id,
          dog_id: walk.dog_id,
          started_at: walk.started_at,
          ended_at: walk.ended_at,
          distance_m: walk.distance_m,
          duration_s: walk.duration_s,
          sniff_time_s: walk.sniff_time_s,
        });

        if (error) {
          console.error("Failed to sync walk:", error);
          failed++;
        } else {
          await markWalkSynced(walk.id);
          synced++;
        }
      } catch (e) {
        console.error("Walk sync error:", e);
        failed++;
      }
    }

    // Sync track points in batches
    const unsyncedPoints = await getUnsyncedTrackPoints();
    const batchSize = 100;

    for (let i = 0; i < unsyncedPoints.length; i += batchSize) {
      const batch = unsyncedPoints.slice(i, i + batchSize);
      
      try {
        const { error } = await supabase.from("track_points").upsert(
          batch.map(p => ({
            id: p.id,
            walk_id: p.walk_id,
            lat: p.lat,
            lon: p.lon,
            ts: p.ts,
            accuracy_m: p.accuracy_m,
            speed_mps: p.speed_mps,
          }))
        );

        if (error) {
          console.error("Failed to sync track points batch:", error);
          failed += batch.length;
        } else {
          for (const point of batch) {
            await markTrackPointSynced(point.id);
          }
          synced += batch.length;
        }
      } catch (e) {
        console.error("Track points sync error:", e);
        failed += batch.length;
      }
    }
  } catch (e) {
    console.error("Sync error:", e);
  }

  return { synced, failed };
}

export async function clearSyncedData(): Promise<void> {
  const database = await initDB();
  
  // Get and delete synced walks
  const allWalks = await database.getAll("walks");
  for (const walk of allWalks) {
    if (walk.synced) {
      await database.delete("walks", walk.id);
    }
  }

  // Get and delete synced track points
  const allPoints = await database.getAll("trackPoints");
  for (const point of allPoints) {
    if (point.synced) {
      await database.delete("trackPoints", point.id);
    }
  }
}

export async function getPendingSyncCount(): Promise<number> {
  const database = await initDB();
  const count = await database.count("pendingSync");
  return count;
}

// Auto-sync when coming back online
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    console.log("Back online - triggering sync");
    syncToSupabase().then(result => {
      console.log(`Sync complete: ${result.synced} synced, ${result.failed} failed`);
    });
  });
}
