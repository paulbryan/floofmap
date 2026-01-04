import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrackPoint {
  id: string;
  ts: string;
  lat: number;
  lon: number;
  accuracy_m: number | null;
  speed_mps: number | null;
}

interface DetectedStop {
  walk_id: string;
  ts_start: string;
  ts_end: string;
  lat: number;
  lon: number;
  radius_m: number;
  label: string;
  confidence: number;
  score: number;
}

// Configuration thresholds
const CONFIG = {
  MIN_STOP_DURATION_S: 3,        // Minimum seconds to consider a stop
  MAX_SPEED_MPS: 0.5,            // Max speed to consider "stopped" (m/s)
  HIGH_JITTER_THRESHOLD: 30,     // Heading change in degrees indicating sniffing
  MIN_POINTS_FOR_STOP: 2,        // Minimum points to form a stop
  ACCURACY_THRESHOLD: 30,        // Ignore points with accuracy > this (meters)
};

// Calculate bearing between two points
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);

  return ((θ * 180 / Math.PI) + 360) % 360;
}

// Calculate heading change (smallest angle between two bearings)
function headingChange(bearing1: number, bearing2: number): number {
  let diff = Math.abs(bearing1 - bearing2);
  if (diff > 180) diff = 360 - diff;
  return diff;
}

// Calculate average position of points
function calculateCentroid(points: TrackPoint[]): { lat: number; lon: number } {
  const sum = points.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lon: acc.lon + p.lon }),
    { lat: 0, lon: 0 }
  );
  return {
    lat: sum.lat / points.length,
    lon: sum.lon / points.length,
  };
}

// Calculate radius (max distance from centroid)
function calculateRadius(points: TrackPoint[], centroid: { lat: number; lon: number }): number {
  const R = 6371e3; // Earth's radius in meters
  let maxDist = 0;

  for (const p of points) {
    const φ1 = centroid.lat * Math.PI / 180;
    const φ2 = p.lat * Math.PI / 180;
    const Δφ = (p.lat - centroid.lat) * Math.PI / 180;
    const Δλ = (p.lon - centroid.lon) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;

    if (dist > maxDist) maxDist = dist;
  }

  return maxDist;
}

// Calculate heading jitter (variance in direction changes)
function calculateHeadingJitter(points: TrackPoint[]): number {
  if (points.length < 3) return 0;

  const headingChanges: number[] = [];
  for (let i = 1; i < points.length - 1; i++) {
    const bearing1 = calculateBearing(
      points[i - 1].lat, points[i - 1].lon,
      points[i].lat, points[i].lon
    );
    const bearing2 = calculateBearing(
      points[i].lat, points[i].lon,
      points[i + 1].lat, points[i + 1].lon
    );
    headingChanges.push(headingChange(bearing1, bearing2));
  }

  if (headingChanges.length === 0) return 0;

  // Return average heading change
  return headingChanges.reduce((a, b) => a + b, 0) / headingChanges.length;
}

// Determine stop label based on behavior
function classifyStop(
  durationS: number,
  avgSpeed: number,
  headingJitter: number
): { label: string; confidence: number } {
  // High jitter + low speed = sniffing behavior
  if (headingJitter > CONFIG.HIGH_JITTER_THRESHOLD && avgSpeed < CONFIG.MAX_SPEED_MPS) {
    return { label: 'sniff', confidence: Math.min(0.9, 0.5 + headingJitter / 100) };
  }

  // Very low movement for extended time = waiting
  if (avgSpeed < 0.1 && durationS > 10) {
    return { label: 'wait', confidence: 0.7 };
  }

  // Default to sniff for any detected stop
  return { label: 'sniff', confidence: 0.5 };
}

// Main detection algorithm
function detectStops(points: TrackPoint[], walkId: string): DetectedStop[] {
  const stops: DetectedStop[] = [];

  // Filter out low-accuracy points
  const validPoints = points.filter(
    p => !p.accuracy_m || p.accuracy_m <= CONFIG.ACCURACY_THRESHOLD
  );

  if (validPoints.length < CONFIG.MIN_POINTS_FOR_STOP) {
    console.log('Not enough valid points for detection');
    return stops;
  }

  let stopStartIdx: number | null = null;
  let stopPoints: TrackPoint[] = [];

  for (let i = 0; i < validPoints.length; i++) {
    const point = validPoints[i];
    const speed = point.speed_mps ?? 0;
    const isLowSpeed = speed <= CONFIG.MAX_SPEED_MPS;

    if (isLowSpeed) {
      // Start or continue a stop
      if (stopStartIdx === null) {
        stopStartIdx = i;
        stopPoints = [point];
      } else {
        stopPoints.push(point);
      }
    } else {
      // End of a potential stop
      if (stopStartIdx !== null && stopPoints.length >= CONFIG.MIN_POINTS_FOR_STOP) {
        const startTime = new Date(stopPoints[0].ts);
        const endTime = new Date(stopPoints[stopPoints.length - 1].ts);
        const durationS = (endTime.getTime() - startTime.getTime()) / 1000;

        if (durationS >= CONFIG.MIN_STOP_DURATION_S) {
          const centroid = calculateCentroid(stopPoints);
          const radius = calculateRadius(stopPoints, centroid);
          const headingJitter = calculateHeadingJitter(stopPoints);
          const avgSpeed = stopPoints.reduce((sum, p) => sum + (p.speed_mps ?? 0), 0) / stopPoints.length;
          const { label, confidence } = classifyStop(durationS, avgSpeed, headingJitter);

          // Score based on duration and jitter
          const score = (durationS / 60) * (1 + headingJitter / 90);

          stops.push({
            walk_id: walkId,
            ts_start: stopPoints[0].ts,
            ts_end: stopPoints[stopPoints.length - 1].ts,
            lat: centroid.lat,
            lon: centroid.lon,
            radius_m: Math.max(radius, 2), // Minimum 2m radius
            label,
            confidence,
            score,
          });

          console.log(`Detected ${label}: ${durationS.toFixed(1)}s, jitter: ${headingJitter.toFixed(1)}°`);
        }
      }

      // Reset
      stopStartIdx = null;
      stopPoints = [];
    }
  }

  // Handle stop at end of walk
  if (stopStartIdx !== null && stopPoints.length >= CONFIG.MIN_POINTS_FOR_STOP) {
    const startTime = new Date(stopPoints[0].ts);
    const endTime = new Date(stopPoints[stopPoints.length - 1].ts);
    const durationS = (endTime.getTime() - startTime.getTime()) / 1000;

    if (durationS >= CONFIG.MIN_STOP_DURATION_S) {
      const centroid = calculateCentroid(stopPoints);
      const radius = calculateRadius(stopPoints, centroid);
      const headingJitter = calculateHeadingJitter(stopPoints);
      const avgSpeed = stopPoints.reduce((sum, p) => sum + (p.speed_mps ?? 0), 0) / stopPoints.length;
      const { label, confidence } = classifyStop(durationS, avgSpeed, headingJitter);
      const score = (durationS / 60) * (1 + headingJitter / 90);

      stops.push({
        walk_id: walkId,
        ts_start: stopPoints[0].ts,
        ts_end: stopPoints[stopPoints.length - 1].ts,
        lat: centroid.lat,
        lon: centroid.lon,
        radius_m: Math.max(radius, 2),
        label,
        confidence,
        score,
      });
    }
  }

  return stops;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify user with anon key
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    const { walk_id } = await req.json();
    if (!walk_id || typeof walk_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'walk_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Detecting stops for walk: ${walk_id}, user: ${user.id}`);

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify walk ownership
    const { data: walk, error: walkError } = await supabase
      .from('walks')
      .select('id, user_id, dog_id')
      .eq('id', walk_id)
      .single();

    if (walkError || !walk) {
      console.error('Walk not found:', walkError?.message);
      return new Response(
        JSON.stringify({ error: 'Walk not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user owns this walk or has walker access
    if (walk.user_id !== user.id) {
      // Check walker access if dog_id exists
      if (!walk.dog_id) {
        return new Response(
          JSON.stringify({ error: 'Access denied' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: hasAccess } = await supabase
        .rpc('has_walker_access', { p_dog_id: walk.dog_id, p_user_id: user.id });

      if (!hasAccess) {
        return new Response(
          JSON.stringify({ error: 'Access denied' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fetch track points
    const { data: trackPoints, error: pointsError } = await supabase
      .from('track_points')
      .select('id, ts, lat, lon, accuracy_m, speed_mps')
      .eq('walk_id', walk_id)
      .order('ts', { ascending: true });

    if (pointsError) {
      console.error('Error fetching track points:', pointsError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch track points' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!trackPoints || trackPoints.length < 2) {
      console.log('Not enough track points for detection');
      return new Response(
        JSON.stringify({ success: true, stops_detected: 0, message: 'Not enough track points' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing ${trackPoints.length} track points`);

    // Detect stops
    const detectedStops = detectStops(trackPoints as TrackPoint[], walk_id);

    if (detectedStops.length === 0) {
      console.log('No stops detected');
      return new Response(
        JSON.stringify({ success: true, stops_detected: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete existing auto-detected stops (keep user-labeled ones)
    await supabase
      .from('stop_events')
      .delete()
      .eq('walk_id', walk_id)
      .lt('confidence', 1); // User labels have confidence = 1

    // Insert detected stops
    const { error: insertError } = await supabase
      .from('stop_events')
      .insert(detectedStops);

    if (insertError) {
      console.error('Error inserting stops:', insertError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to save detected stops' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate total sniff time
    const totalSniffTimeS = detectedStops.reduce((sum, stop) => {
      const start = new Date(stop.ts_start).getTime();
      const end = new Date(stop.ts_end).getTime();
      return sum + (end - start) / 1000;
    }, 0);

    // Update walk with sniff time
    const { error: updateError } = await supabase
      .from('walks')
      .update({ sniff_time_s: Math.round(totalSniffTimeS) })
      .eq('id', walk_id);

    if (updateError) {
      console.error('Error updating walk:', updateError.message);
    }

    console.log(`Detected ${detectedStops.length} stops, total sniff time: ${totalSniffTimeS.toFixed(1)}s`);

    return new Response(
      JSON.stringify({
        success: true,
        stops_detected: detectedStops.length,
        sniff_time_s: Math.round(totalSniffTimeS),
        stops: detectedStops.map(s => ({
          label: s.label,
          confidence: s.confidence,
          duration_s: (new Date(s.ts_end).getTime() - new Date(s.ts_start).getTime()) / 1000,
        })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in detect-stops:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
