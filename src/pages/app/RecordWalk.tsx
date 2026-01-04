import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Square, Pause, MapPin, Timer, Route, Activity, AlertTriangle, Navigation, Loader2, Dog, PlusCircle, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import MapContainer from "@/components/map/MapContainer";
import { useMapRoute } from "@/hooks/useMapRoute";
import maplibregl from "maplibre-gl";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TrackPoint {
  lat: number;
  lon: number;
  timestamp: number;
  accuracy: number;
  speed: number | null;
}

interface DogOption {
  id: string;
  name: string;
  avatar_url: string | null;
  isShared: boolean;
}

const RecordWalk = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<"prompt" | "granted" | "denied">("prompt");
  const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | null>(null);
  const [trackPoints, setTrackPoints] = useState<TrackPoint[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-0.09, 51.505]);
  const [dogs, setDogs] = useState<DogOption[]>([]);
  const [selectedDog, setSelectedDog] = useState<DogOption | null>(null);
  const [loadingDogs, setLoadingDogs] = useState(true);

  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const { setMap, addPoint, updateCurrentPosition, clearRoute } = useMapRoute();

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Format time as MM:SS or HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Format distance
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(2)}km`;
  };

  // Check location permission, get initial location, and fetch dogs
  useEffect(() => {
    // Get initial location - use cached profile first, then geolocation
    const loadInitialLocation = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('cached_lat, cached_lon')
        .single();
      
      if (profile?.cached_lat && profile?.cached_lon) {
        setMapCenter([profile.cached_lon, profile.cached_lat]);
      }
      
      // Always try geolocation for current position (for recording)
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setMapCenter([pos.coords.longitude, pos.coords.latitude]);
            setCurrentPosition(pos);
          },
          () => {},
          { timeout: 5000, maximumAge: 60000, enableHighAccuracy: true }
        );
      }
    };
    loadInitialLocation();

    if ("permissions" in navigator) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        setPermissionStatus(result.state as "prompt" | "granted" | "denied");
        result.onchange = () => {
          setPermissionStatus(result.state as "prompt" | "granted" | "denied");
        };
      });
    }

    // Fetch owned and shared dogs
    const fetchDogs = async () => {
      setLoadingDogs(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingDogs(false);
        return;
      }

      // Fetch owned dogs
      const { data: ownedDogs } = await supabase
        .from("dogs")
        .select("id, name, avatar_url")
        .eq("user_id", user.id);

      // Fetch shared dogs (via dog_walkers)
      const { data: sharedAccess } = await supabase
        .from("dog_walkers")
        .select("dog_id, dogs(id, name, avatar_url)")
        .eq("walker_user_id", user.id)
        .eq("status", "active");

      const allDogs: DogOption[] = [];

      // Add owned dogs
      if (ownedDogs) {
        ownedDogs.forEach(dog => {
          allDogs.push({
            id: dog.id,
            name: dog.name,
            avatar_url: dog.avatar_url,
            isShared: false,
          });
        });
      }

      // Add shared dogs
      if (sharedAccess) {
        sharedAccess.forEach(access => {
          const dog = access.dogs as unknown as { id: string; name: string; avatar_url: string | null } | null;
          if (dog && !allDogs.find(d => d.id === dog.id)) {
            allDogs.push({
              id: dog.id,
              name: dog.name,
              avatar_url: dog.avatar_url,
              isShared: true,
            });
          }
        });
      }

      setDogs(allDogs);
      // Auto-select first dog if only one
      if (allDogs.length === 1) {
        setSelectedDog(allDogs[0]);
      }
      setLoadingDogs(false);
    };

    fetchDogs();
  }, []);

  // Handle position updates
  const handlePositionUpdate = useCallback((position: GeolocationPosition) => {
    setCurrentPosition(position);
    const { latitude: lat, longitude: lon } = position.coords;
    
    // Update map center on first position
    setMapCenter([lon, lat]);
    
    // Update current position marker on map
    updateCurrentPosition({ lat, lon });
    
    if (isRecording && !isPaused) {
      const newPoint: TrackPoint = {
        lat,
        lon,
        timestamp: position.timestamp,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed,
      };

      // Add point to route on map
      if (newPoint.accuracy < 30) {
        addPoint({ lat, lon });
      }

      setTrackPoints((prev) => {
        const updated = [...prev, newPoint];
        
        // Calculate distance from last point
        if (prev.length > 0) {
          const lastPoint = prev[prev.length - 1];
          const dist = calculateDistance(
            lastPoint.lat,
            lastPoint.lon,
            newPoint.lat,
            newPoint.lon
          );
          // Only add distance if accuracy is reasonable and movement is significant
          if (newPoint.accuracy < 30 && dist > 2 && dist < 100) {
            setDistance((d) => d + dist);
          }
        }
        
        return updated;
      });
    }
  }, [isRecording, isPaused, updateCurrentPosition, addPoint]);

  // Handle position errors
  const handlePositionError = useCallback((error: GeolocationPositionError) => {
    console.error("Geolocation error:", error);
    toast({
      title: "Location Error",
      description: error.code === 1 
        ? "Please enable location access in your browser settings."
        : "Could not get your location. Please try again.",
      variant: "destructive",
    });
  }, [toast]);

  // Start location tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "Not Supported",
        description: "Your browser doesn't support GPS tracking.",
        variant: "destructive",
      });
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handlePositionError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [handlePositionUpdate, handlePositionError, toast]);

  // Stop location tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // Handle map load
  const handleMapLoad = useCallback((map: maplibregl.Map) => {
    mapRef.current = map;
    setMap(map);
    
    // Initialize route source
    map.addSource('walk-route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: [] },
      },
    });
    
    map.addLayer({
      id: 'walk-route-layer',
      type: 'line',
      source: 'walk-route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#F97316',
        'line-width': 5,
        'line-opacity': 0.9,
      },
    });
  }, [setMap]);

  // Center map on current position
  const handleCenterMap = () => {
    if (mapRef.current && currentPosition) {
      mapRef.current.flyTo({
        center: [currentPosition.coords.longitude, currentPosition.coords.latitude],
        zoom: 17,
        duration: 500,
      });
    }
  };

  // Start recording
  const handleStart = () => {
    setIsRecording(true);
    setIsPaused(false);
    setElapsedTime(0);
    setDistance(0);
    setTrackPoints([]);
    clearRoute();
    startTracking();

    timerRef.current = setInterval(() => {
      setElapsedTime((t) => t + 1);
    }, 1000);

    toast({
      title: "Recording Started! 🐾",
      description: "GPS tracking is now active. Enjoy your walk!",
    });
  };

  // Pause recording
  const handlePause = () => {
    setIsPaused(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Resume recording
  const handleResume = () => {
    setIsPaused(false);
    timerRef.current = setInterval(() => {
      setElapsedTime((t) => t + 1);
    }, 1000);
  };

  // Stop recording and save walk
  const handleStop = async () => {
    setIsRecording(false);
    setIsPaused(false);
    stopTracking();
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Need at least 2 points to save
    if (trackPoints.length < 2) {
      toast({
        title: "Walk too short",
        description: "Record a bit longer to save your walk.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Not signed in",
          description: "Please sign in to save your walks.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      // Create walk record
      const { data: walk, error: walkError } = await supabase
        .from("walks")
        .insert({
          user_id: user.id,
          dog_id: selectedDog?.id || null,
          started_at: new Date(trackPoints[0].timestamp).toISOString(),
          ended_at: new Date(trackPoints[trackPoints.length - 1].timestamp).toISOString(),
          distance_m: Math.round(distance),
          duration_s: elapsedTime,
        })
        .select()
        .single();

      if (walkError) throw walkError;

      // Insert track points
      const pointsToInsert = trackPoints.map(p => ({
        walk_id: walk.id,
        ts: new Date(p.timestamp).toISOString(),
        lat: p.lat,
        lon: p.lon,
        accuracy_m: p.accuracy,
        speed_mps: p.speed,
      }));

      const { error: pointsError } = await supabase
        .from("track_points")
        .insert(pointsToInsert);

      if (pointsError) throw pointsError;

      // Trigger sniff detection in background
      supabase.functions.invoke("detect-stops", {
        body: { walk_id: walk.id },
      }).then(({ data, error }) => {
        if (error) {
          console.error("Stop detection error:", error);
        } else {
          console.log("Stop detection complete:", data);
        }
      });

      toast({
        title: "Walk Saved! 🎉",
        description: `You walked ${formatDistance(distance)} in ${formatTime(elapsedTime)}. Analyzing sniff stops...`,
      });

      // Navigate to walk detail
      navigate(`/app/walk/${walk.id}`);
    } catch (error) {
      console.error("Error saving walk:", error);
      toast({
        title: "Failed to save",
        description: "There was an error saving your walk. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [stopTracking]);

  // Calculate current pace
  const pace = elapsedTime > 0 && distance > 0
    ? (elapsedTime / 60) / (distance / 1000) // min/km
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop layout wrapper */}
      <div className="md:flex md:h-screen">
        {/* Map */}
        <div className="h-[50vh] md:h-full md:flex-1 relative overflow-hidden">
          <MapContainer
            className="h-full w-full"
            center={mapCenter}
            zoom={16}
            onMapLoad={handleMapLoad}
          />

          {/* Center on location button */}
          {currentPosition && (
            <Button
              onClick={handleCenterMap}
              size="icon"
              variant="secondary"
              className="absolute bottom-4 right-4 z-10 shadow-lg"
            >
              <Navigation className="w-5 h-5" />
            </Button>
          )}

          {/* Status overlay */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-4 right-14 md:max-w-sm bg-card/95 backdrop-blur rounded-xl shadow-card p-3 z-10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isPaused ? "bg-amber-500" : "bg-destructive animate-pulse"}`} />
                    <span className="font-semibold text-sm">
                      {isPaused ? "Paused" : "Recording"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{trackPoints.length} pts</span>
                    {currentPosition && (
                      <span>±{Math.round(currentPosition.coords.accuracy)}m</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Permission warning */}
          {permissionStatus === "denied" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-background/90 flex items-center justify-center p-4 z-20"
            >
              <div className="bg-card rounded-xl shadow-xl p-6 max-w-sm text-center">
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">Location Access Required</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  FloofMap needs location access to record your walks. Please enable it in your browser settings.
                </p>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Stats panel */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-card border-t md:border-t-0 md:border-l border-border rounded-t-3xl md:rounded-none -mt-6 md:mt-0 relative z-10 shadow-xl md:shadow-none md:w-80 lg:w-96 md:flex md:flex-col md:justify-center"
        >
          <div className="p-6 md:p-8">
            {/* Main stats */}
            <div className="grid grid-cols-3 gap-4 mb-6 md:mb-8">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Timer className="w-4 h-4" />
                  <span className="text-xs">Duration</span>
                </div>
                <p className="text-2xl md:text-3xl font-bold">{formatTime(elapsedTime)}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Route className="w-4 h-4" />
                  <span className="text-xs">Distance</span>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-primary">{formatDistance(distance)}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Activity className="w-4 h-4" />
                  <span className="text-xs">Pace</span>
                </div>
                <p className="text-2xl md:text-3xl font-bold">
                  {pace > 0 ? `${pace.toFixed(1)}` : "--"}
                  <span className="text-sm text-muted-foreground">/km</span>
                </p>
              </div>
            </div>

            {/* Control buttons */}
            <div className="flex flex-col items-center gap-4">
              {!isRecording ? (
                loadingDogs ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading dogs...</span>
                  </div>
                ) : dogs.length === 0 ? (
                  <div className="w-full max-w-xs text-center">
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
                      <Dog className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                      <p className="text-sm font-medium mb-1">No dogs yet!</p>
                      <p className="text-xs text-muted-foreground">
                        Add your furry friend before starting a walk
                      </p>
                    </div>
                    <Button variant="hero" size="lg" className="w-full" asChild>
                      <Link to="/app/dogs">
                        <PlusCircle className="w-5 h-5" />
                        Add Your Dog
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="w-full max-w-xs space-y-3">
                    {/* Dog selector */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-sm">
                              {selectedDog?.avatar_url ? (
                                <img src={selectedDog.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                              ) : (
                                "🐕"
                              )}
                            </div>
                            <span>
                              {selectedDog ? selectedDog.name : "Select a dog"}
                              {selectedDog?.isShared && (
                                <span className="text-xs text-muted-foreground ml-1">(shared)</span>
                              )}
                            </span>
                          </div>
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center" className="w-56">
                        {dogs.map((dog) => (
                          <DropdownMenuItem
                            key={dog.id}
                            onClick={() => setSelectedDog(dog)}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-sm">
                                {dog.avatar_url ? (
                                  <img src={dog.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                                ) : (
                                  "🐕"
                                )}
                              </div>
                              <span>{dog.name}</span>
                              {dog.isShared && (
                                <span className="text-xs text-muted-foreground">(shared)</span>
                              )}
                            </div>
                            {selectedDog?.id === dog.id && (
                              <Check className="w-4 h-4 text-primary" />
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      onClick={handleStart}
                      variant="hero"
                      size="xl"
                      className="w-full"
                      disabled={!selectedDog}
                    >
                      <Play className="w-6 h-6" />
                      Start Walk
                    </Button>
                  </div>
                )
              ) : (
                <>
                  <Button
                    onClick={isPaused ? handleResume : handlePause}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                  >
                    {isPaused ? (
                      <>
                        <Play className="w-5 h-5" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="w-5 h-5" />
                        Pause
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleStop}
                    variant="destructive"
                    size="lg"
                    className="flex-1"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Square className="w-5 h-5" />
                        Stop
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>

            {/* iOS warning */}
            <p className="text-xs text-center text-muted-foreground mt-4">
              📱 For best results on iOS, keep the app open during your walk.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RecordWalk;
