import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  MapPin,
  Timer,
  Route,
  ChevronRight,
  Download,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MapContainer from "@/components/map/MapContainer";
import maplibregl from "maplibre-gl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TrackPoint {
  id: string;
  lat: number;
  lon: number;
  ts: string;
  accuracy_m: number | null;
  speed_mps: number | null;
}

interface StopEvent {
  id: string;
  lat: number;
  lon: number;
  ts_start: string;
  ts_end: string;
  label: string | null;
  score: number | null;
}

interface Walk {
  id: string;
  started_at: string;
  ended_at: string | null;
  distance_m: number | null;
  duration_s: number | null;
  sniff_time_s: number | null;
  notes: string | null;
}

const WalkDetail = () => {
  const { walkId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const animationRef = useRef<number | null>(null);

  const [walk, setWalk] = useState<Walk | null>(null);
  const [trackPoints, setTrackPoints] = useState<TrackPoint[]>([]);
  const [stopEvents, setStopEvents] = useState<StopEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-0.09, 51.505]);

  // Fetch walk data
  useEffect(() => {
    const fetchWalkData = async () => {
      if (!walkId) return;

      try {
        const { data: walkData, error: walkError } = await supabase
          .from("walks")
          .select("*")
          .eq("id", walkId)
          .single();

        if (walkError) throw walkError;
        setWalk(walkData);

        const { data: pointsData, error: pointsError } = await supabase
          .from("track_points")
          .select("*")
          .eq("walk_id", walkId)
          .order("ts", { ascending: true });

        if (pointsError) throw pointsError;
        setTrackPoints(pointsData || []);

        if (pointsData && pointsData.length > 0) {
          setMapCenter([pointsData[0].lon, pointsData[0].lat]);
        }

        const { data: stopsData, error: stopsError } = await supabase
          .from("stop_events")
          .select("*")
          .eq("walk_id", walkId)
          .order("ts_start", { ascending: true });

        if (stopsError) throw stopsError;
        setStopEvents(stopsData || []);
      } catch (error) {
        console.error("Error fetching walk:", error);
        toast({
          title: "Error",
          description: "Could not load walk data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalkData();
  }, [walkId, toast]);

  // Handle map load
  const handleMapLoad = useCallback((map: maplibregl.Map) => {
    mapRef.current = map;

    // Add route source
    map.addSource("walk-route", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: [] },
      },
    });

    map.addLayer({
      id: "walk-route-layer",
      type: "line",
      source: "walk-route",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": "#F97316",
        "line-width": 5,
        "line-opacity": 0.9,
      },
    });

    // Add progress source (for animated portion)
    map.addSource("walk-progress", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: [] },
      },
    });

    map.addLayer({
      id: "walk-progress-layer",
      type: "line",
      source: "walk-progress",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": "#10B981",
        "line-width": 6,
        "line-opacity": 1,
      },
    });
  }, []);

  // Update map when track points change
  useEffect(() => {
    if (mapRef.current && trackPoints.length > 0) {
      const coordinates = trackPoints.map(p => [p.lon, p.lat] as [number, number]);

      // Update full route
      const source = mapRef.current.getSource("walk-route") as maplibregl.GeoJSONSource;
      if (source) {
        source.setData({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates },
        });
      }

      // Fit bounds to show full route
      if (coordinates.length > 1) {
        const bounds = coordinates.reduce(
          (b, c) => b.extend(c as [number, number]),
          new maplibregl.LngLatBounds(coordinates[0], coordinates[0])
        );
        mapRef.current.fitBounds(bounds, { padding: 50 });
      }

      // Add sniff stop markers
      stopEvents.forEach((stop, index) => {
        const el = document.createElement("div");
        el.className = "sniff-marker";
        el.innerHTML = getStopEmoji(stop.label);
        el.style.cssText = `
          width: 32px;
          height: 32px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          font-size: 16px;
        `;

        new maplibregl.Marker({ element: el })
          .setLngLat([stop.lon, stop.lat])
          .addTo(mapRef.current!);
      });
    }
  }, [trackPoints, stopEvents]);

  // Update progress line and marker
  useEffect(() => {
    if (!mapRef.current || trackPoints.length === 0) return;

    const coordinates = trackPoints
      .slice(0, currentIndex + 1)
      .map(p => [p.lon, p.lat] as [number, number]);

    const source = mapRef.current.getSource("walk-progress") as maplibregl.GeoJSONSource;
    if (source) {
      source.setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates },
      });
    }

    // Update or create position marker
    const currentPoint = trackPoints[currentIndex];
    if (currentPoint) {
      if (markerRef.current) {
        markerRef.current.setLngLat([currentPoint.lon, currentPoint.lat]);
      } else {
        const el = document.createElement("div");
        el.style.cssText = `
          width: 20px;
          height: 20px;
          background: #10B981;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `;
        markerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([currentPoint.lon, currentPoint.lat])
          .addTo(mapRef.current);
      }
    }
  }, [currentIndex, trackPoints]);

  // Playback animation
  useEffect(() => {
    if (isPlaying && currentIndex < trackPoints.length - 1) {
      animationRef.current = window.setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 100);
    } else if (currentIndex >= trackPoints.length - 1) {
      setIsPlaying(false);
    }

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [isPlaying, currentIndex, trackPoints.length]);

  const handlePlayPause = () => {
    if (currentIndex >= trackPoints.length - 1) {
      setCurrentIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
  };

  const handleSliderChange = (value: number[]) => {
    setIsPlaying(false);
    setCurrentIndex(value[0]);
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("walks")
        .delete()
        .eq("id", walkId);

      if (error) throw error;

      toast({
        title: "Walk Deleted",
        description: "Your walk has been permanently deleted.",
      });
      navigate("/app");
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Delete Failed",
        description: "Could not delete the walk.",
        variant: "destructive",
      });
    }
  };

  const handleExportGPX = () => {
    if (!walk || trackPoints.length === 0) return;

    const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="FloofMap">
  <trk>
    <name>Walk on ${new Date(walk.started_at).toLocaleDateString()}</name>
    <trkseg>
${trackPoints.map(p => `      <trkpt lat="${p.lat}" lon="${p.lon}">
        <time>${p.ts}</time>
      </trkpt>`).join("\n")}
    </trkseg>
  </trk>
</gpx>`;

    const blob = new Blob([gpxContent], { type: "application/gpx+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `floofmap-walk-${walkId?.slice(0, 8)}.gpx`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: "Walk exported to GPX format.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!walk) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Walk not found</p>
      </div>
    );
  }

  const currentTime = trackPoints[currentIndex]
    ? new Date(trackPoints[currentIndex].ts)
    : null;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/app")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold">Walk Replay</h1>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={handleExportGPX}>
                <Download className="w-5 h-5" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive">
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Walk?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this walk and all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="h-[40vh] relative">
        <MapContainer
          className="h-full w-full"
          center={mapCenter}
          zoom={15}
          onMapLoad={handleMapLoad}
        />
      </div>

      {/* Controls & Details */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-card border-t border-border rounded-t-3xl -mt-6 relative z-10 shadow-xl"
      >
        <div className="p-6">
          {/* Date & Dog */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">
                {new Date(walk.started_at).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </h2>
              <p className="text-sm text-muted-foreground">
                {new Date(walk.started_at).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center text-2xl">
              🐕
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="bg-muted rounded-xl p-3 text-center">
              <Route className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="font-bold">{formatDistance(walk.distance_m || 0)}</p>
              <p className="text-xs text-muted-foreground">Distance</p>
            </div>
            <div className="bg-muted rounded-xl p-3 text-center">
              <Timer className="w-5 h-5 mx-auto mb-1 text-secondary" />
              <p className="font-bold">{formatDuration(walk.duration_s || 0)}</p>
              <p className="text-xs text-muted-foreground">Duration</p>
            </div>
            <div className="bg-muted rounded-xl p-3 text-center">
              <MapPin className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="font-bold">{stopEvents.length}</p>
              <p className="text-xs text-muted-foreground">Sniffs</p>
            </div>
            <div className="bg-muted rounded-xl p-3 text-center">
              <span className="text-lg">🐾</span>
              <p className="font-bold">
                {walk.duration_s ? Math.round(((walk.sniff_time_s || 0) / walk.duration_s) * 100) : 0}%
              </p>
              <p className="text-xs text-muted-foreground">Sniff Time</p>
            </div>
          </div>

          {/* Timeline scrubber */}
          {trackPoints.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Timeline</span>
                {currentTime && (
                  <span className="text-sm font-medium">
                    {currentTime.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                )}
              </div>
              <Slider
                value={[currentIndex]}
                min={0}
                max={trackPoints.length - 1}
                step={1}
                onValueChange={handleSliderChange}
                className="mb-4"
              />
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleReset}
                  disabled={currentIndex === 0}
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
                <Button
                  variant="hero"
                  size="lg"
                  onClick={handlePlayPause}
                  className="px-8"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-5 h-5" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      {currentIndex >= trackPoints.length - 1 ? "Replay" : "Play"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Sniff stops list */}
          {stopEvents.length > 0 && (
            <>
              <h3 className="font-semibold mb-3">Sniff Stops</h3>
              <div className="space-y-2">
                {stopEvents.map((stop, i) => (
                  <motion.div
                    key={stop.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStopBgColor(stop.label)}`}>
                      <span className="text-lg">{getStopEmoji(stop.label)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{stop.label || "Sniff"}</p>
                      <p className="text-xs text-muted-foreground">
                        {getDuration(stop.ts_start, stop.ts_end)} •{" "}
                        {new Date(stop.ts_start).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// Helper functions
function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(2)}km`;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

function getDuration(start: string, end: string): string {
  const diff = (new Date(end).getTime() - new Date(start).getTime()) / 1000;
  return `${Math.round(diff)}s`;
}

function getStopEmoji(label: string | null): string {
  switch (label?.toLowerCase()) {
    case "poop": return "💩";
    case "pee": return "💧";
    case "wait": return "⏸️";
    default: return "🐾";
  }
}

function getStopBgColor(label: string | null): string {
  switch (label?.toLowerCase()) {
    case "poop": return "bg-amber-100";
    case "pee": return "bg-sky-100";
    case "wait": return "bg-gray-100";
    default: return "bg-primary/10";
  }
}

export default WalkDetail;
