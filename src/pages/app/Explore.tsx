import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Droplets, Trash, Search, Navigation, Loader2, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MapContainer from "@/components/map/MapContainer";
import { useMapRoute } from "@/hooks/useMapRoute";
import { usePOIMarkers, POI } from "@/hooks/usePOIMarkers";
import maplibregl from "maplibre-gl";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
interface Walk {
  id: string;
  started_at: string;
  distance_m: number | null;
  duration_s: number | null;
  sniff_time_s: number | null;
  dogs: {
    id: string;
    name: string;
    avatar_url: string | null;
  } | null;
}

interface WalkWithDogs extends Walk {
  walkDogs: Array<{
    id: string;
    name: string;
    avatar_url: string | null;
  }>;
}

interface TrackPoint {
  lat: number;
  lon: number;
}

type POIFilter = "all" | "water" | "bin" | "dog_park" | "barking";

const Explore = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<POIFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWalk, setSelectedWalk] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [walks, setWalks] = useState<WalkWithDogs[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [stopCounts, setStopCounts] = useState<Record<string, number>>({});
  const [showLocationUpdate, setShowLocationUpdate] = useState(false);
  const usedCachedRef = useRef(false);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const { setMap: setRouteMap, drawRoute, clearRoute } = useMapRoute();
  const { setMap: setPOIMap, addPOIs } = usePOIMarkers();

  const filters: { key: POIFilter; icon: React.ReactNode; label: string; color: string }[] = [
    { key: "all", icon: <MapPin className="w-4 h-4" />, label: "All", color: "bg-muted" },
    { key: "water", icon: <Droplets className="w-4 h-4" />, label: "Water", color: "bg-accent/20" },
    { key: "bin", icon: <Trash className="w-4 h-4" />, label: "Bins", color: "bg-forest-100" },
    { key: "dog_park", icon: <span className="text-sm">🐕</span>, label: "Parks", color: "bg-amber-100" },
    { key: "barking", icon: <span className="text-sm">🔊</span>, label: "Barking", color: "bg-destructive/10" },
  ];

  // Get user location on mount - use cached profile location first, then update with GPS
  useEffect(() => {
    const loadLocation = async () => {
      // Load cached location first for instant map render
      const { data: profile } = await supabase
        .from('profiles')
        .select('cached_lat, cached_lon')
        .single();
      
      if (profile?.cached_lat && profile?.cached_lon) {
        setMapCenter([profile.cached_lon, profile.cached_lat]);
        usedCachedRef.current = true;
      }
      
      // Then get actual GPS location (will update map center when available)
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setMapCenter([pos.coords.longitude, pos.coords.latitude]);
            // Show subtle indicator if we updated from cached location
            if (usedCachedRef.current) {
              setShowLocationUpdate(true);
              setTimeout(() => setShowLocationUpdate(false), 2000);
            }
          },
          () => {},
          { timeout: 5000, maximumAge: 60000 }
        );
      }
    };
    loadLocation();
  }, []);

  // Fetch walks on mount
  useEffect(() => {
    const fetchWalks = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: walksData } = await supabase
        .from("walks")
        .select("id, started_at, distance_m, duration_s, sniff_time_s, dogs(id, name, avatar_url)")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false })
        .limit(50);

      if (walksData) {
        // Fetch walk_dogs for all walks to show multiple dogs
        const walkIds = walksData.map(w => w.id);
        const { data: walkDogsData } = await supabase
          .from("walk_dogs")
          .select("walk_id, dogs(id, name, avatar_url)")
          .in("walk_id", walkIds);

        // Group walk_dogs by walk_id
        const walkDogsMap: Record<string, Array<{ id: string; name: string; avatar_url: string | null }>> = {};
        if (walkDogsData) {
          walkDogsData.forEach((wd) => {
            const dog = wd.dogs as unknown as { id: string; name: string; avatar_url: string | null } | null;
            if (dog) {
              if (!walkDogsMap[wd.walk_id]) {
                walkDogsMap[wd.walk_id] = [];
              }
              walkDogsMap[wd.walk_id].push(dog);
            }
          });
        }

        // Merge walkDogs into walks, falling back to legacy single dog
        const walksWithDogs: WalkWithDogs[] = walksData.map(walk => ({
          ...walk,
          walkDogs: walkDogsMap[walk.id] || (walk.dogs ? [walk.dogs] : []),
        }));
        setWalks(walksWithDogs);

        // Fetch stop counts for each walk (reuse walkIds from above)
        if (walkIds.length > 0) {
          const { data: stopsData } = await supabase
            .from("stop_events")
            .select("walk_id")
            .in("walk_id", walkIds);

          if (stopsData) {
            const counts: Record<string, number> = {};
            stopsData.forEach(stop => {
              counts[stop.walk_id] = (counts[stop.walk_id] || 0) + 1;
            });
            setStopCounts(counts);
          }
        }
      }

      setLoading(false);
    };

    fetchWalks();
  }, []);

  const handleMapLoad = useCallback((map: maplibregl.Map) => {
    mapRef.current = map;
    setRouteMap(map);
    setPOIMap(map);
  }, [setRouteMap, setPOIMap]);

  const handleWalkSelect = async (walkId: string) => {
    if (selectedWalk === walkId) {
      setSelectedWalk(null);
      clearRoute();
      return;
    }

    setSelectedWalk(walkId);
    setLoadingRoute(true);

    // Fetch track points for the selected walk
    const { data: points } = await supabase
      .rpc("get_walk_track_points", { p_walk_id: walkId });

    if (points && points.length > 0 && mapRef.current) {
      const route: TrackPoint[] = points.map((p: { lat: number; lon: number }) => ({
        lat: p.lat,
        lon: p.lon,
      }));
      drawRoute(route, true);

      // Also fetch and show stop events as POIs
      const { data: stops } = await supabase
        .from("stop_events")
        .select("id, lat, lon, label")
        .eq("walk_id", walkId);

      if (stops && stops.length > 0) {
        const pois: POI[] = stops.map(stop => ({
          id: stop.id,
          type: (stop.label || "sniff") as POI["type"],
          name: stop.label || "Sniff Stop",
          lat: stop.lat,
          lon: stop.lon,
        }));
        addPOIs(pois);
      }
    }

    setLoadingRoute(false);
  };

  const handleWalkDoubleClick = (walkId: string) => {
    navigate(`/app/walk/${walkId}`);
  };

  const handleCenterOnLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const center: [number, number] = [pos.coords.longitude, pos.coords.latitude];
          setMapCenter(center);
          mapRef.current?.flyTo({ center, zoom: 15 });
        },
        () => {}
      );
    }
  };

  const formatDistance = (meters: number | null) => {
    if (!meters) return "0 m";
    return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0 min";
    return `${Math.round(seconds / 60)} min`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 pt-6 md:pt-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Explore</h1>
          
          {/* Search and Filters - responsive layout */}
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search locations..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
              {filters.map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                    activeFilter === filter.key
                      ? "bg-primary text-primary-foreground shadow-md"
                      : `${filter.color} text-foreground hover:shadow-sm`
                  }`}
                >
                  {filter.icon}
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main content - side by side on desktop */}
      <div className="max-w-7xl mx-auto md:flex md:gap-6 md:p-6">
        {/* Map area */}
        <div className="h-[40vh] md:h-[calc(100vh-200px)] md:flex-1 md:rounded-xl md:overflow-hidden md:shadow-card relative">
          {mapCenter ? (
            <MapContainer
              className="h-full w-full"
              center={mapCenter}
              zoom={14}
              onMapLoad={handleMapLoad}
            />
          ) : (
            <div className="h-full w-full bg-muted flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Loading overlay */}
          {loadingRoute && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Center on location button */}
          <Button
            onClick={handleCenterOnLocation}
            size="icon"
            variant="secondary"
            className="absolute bottom-4 right-4 z-10 shadow-lg"
          >
            <Navigation className="w-5 h-5" />
          </Button>

          {/* GPS update indicator */}
          <AnimatePresence>
            {showLocationUpdate && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-card/95 backdrop-blur rounded-full px-4 py-2 shadow-lg flex items-center gap-2 text-sm"
              >
                <MapPinned className="w-4 h-4 text-primary" />
                <span>Location updated</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur rounded-xl shadow-card p-3 z-10">
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-accent" />
                <span>Water</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-muted" />
                <span>Bin</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span>Sniff</span>
              </div>
            </div>
          </div>
        </div>

        {/* Walk history */}
        <div className="p-4 md:p-0 md:w-80 lg:w-96 md:shrink-0">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Walk History
          </h2>

          <div className="space-y-3 md:max-h-[calc(100vh-280px)] md:overflow-y-auto md:pr-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : walks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No walks yet.</p>
                <p className="text-sm">Start recording to see your walk history!</p>
              </div>
            ) : (
              walks.map((walk) => (
                <motion.button
                  key={walk.id}
                  onClick={() => handleWalkSelect(walk.id)}
                  onDoubleClick={() => handleWalkDoubleClick(walk.id)}
                  className={`w-full p-4 rounded-xl border transition-all text-left ${
                    selectedWalk === walk.id
                      ? "bg-primary/5 border-primary shadow-md"
                      : "bg-card border-border hover:shadow-card"
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {walk.walkDogs.length > 0 ? (
                      <div className="flex -space-x-1 shrink-0">
                        {walk.walkDogs.slice(0, 2).map((dog) => (
                          <div
                            key={dog.id}
                            className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center overflow-hidden border-2 border-background"
                          >
                            {dog.avatar_url ? (
                              <img src={dog.avatar_url} alt={dog.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm">🐕</span>
                            )}
                          </div>
                        ))}
                        {walk.walkDogs.length > 2 && (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                            +{walk.walkDogs.length - 2}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <span className="text-sm">🐕</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">
                          {format(new Date(walk.started_at), "MMM d, yyyy")}
                        </span>
                        <span className="text-primary font-semibold text-sm">
                          {stopCounts[walk.id] || 0} sniffs
                        </span>
                      </div>
                      {walk.walkDogs.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {walk.walkDogs.length === 1
                            ? walk.walkDogs[0].name
                            : walk.walkDogs.map(d => d.name).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground pl-11">
                    <span>{formatDistance(walk.distance_m)}</span>
                    <span>{formatDuration(walk.duration_s)}</span>
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Explore;
