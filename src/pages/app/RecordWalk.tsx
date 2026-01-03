import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Square, Pause, MapPin, Timer, Route, Activity, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface TrackPoint {
  lat: number;
  lon: number;
  timestamp: number;
  accuracy: number;
  speed: number | null;
}

const RecordWalk = () => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<"prompt" | "granted" | "denied">("prompt");
  const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | null>(null);
  const [trackPoints, setTrackPoints] = useState<TrackPoint[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [distance, setDistance] = useState(0);

  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Check location permission
  useEffect(() => {
    if ("permissions" in navigator) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        setPermissionStatus(result.state as "prompt" | "granted" | "denied");
        result.onchange = () => {
          setPermissionStatus(result.state as "prompt" | "granted" | "denied");
        };
      });
    }
  }, []);

  // Handle position updates
  const handlePositionUpdate = useCallback((position: GeolocationPosition) => {
    setCurrentPosition(position);
    
    if (isRecording && !isPaused) {
      const newPoint: TrackPoint = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        timestamp: position.timestamp,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed,
      };

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
  }, [isRecording, isPaused]);

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

  // Start recording
  const handleStart = () => {
    setIsRecording(true);
    setIsPaused(false);
    setElapsedTime(0);
    setDistance(0);
    setTrackPoints([]);
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

  // Stop recording
  const handleStop = () => {
    setIsRecording(false);
    setIsPaused(false);
    stopTracking();
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    toast({
      title: "Walk Saved! 🎉",
      description: `You walked ${formatDistance(distance)} in ${formatTime(elapsedTime)}.`,
    });
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
      {/* Map placeholder */}
      <div className="h-[50vh] bg-forest-100 relative overflow-hidden">
        {/* Simplified map visualization */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
              className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                isRecording ? "bg-primary shadow-glow" : "bg-muted"
              }`}
            >
              <MapPin className={`w-10 h-10 ${isRecording ? "text-primary-foreground" : "text-muted-foreground"}`} />
            </motion.div>
            <p className="text-muted-foreground">
              {currentPosition 
                ? `${currentPosition.coords.latitude.toFixed(5)}, ${currentPosition.coords.longitude.toFixed(5)}`
                : "Waiting for GPS..."}
            </p>
            {currentPosition && (
              <p className="text-xs text-muted-foreground mt-1">
                Accuracy: ±{Math.round(currentPosition.coords.accuracy)}m
              </p>
            )}
          </div>
        </div>

        {/* Status overlay */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-4 right-4 bg-card/95 backdrop-blur rounded-xl shadow-card p-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isPaused ? "bg-amber-500" : "bg-destructive animate-pulse"}`} />
                  <span className="font-semibold text-sm">
                    {isPaused ? "Paused" : "Recording"}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {trackPoints.length} points
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Permission warning */}
        {permissionStatus === "denied" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-background/90 flex items-center justify-center p-4"
          >
            <div className="bg-card rounded-xl shadow-xl p-6 max-w-sm text-center">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Location Access Required</h3>
              <p className="text-sm text-muted-foreground mb-4">
                SniffMap needs location access to record your walks. Please enable it in your browser settings.
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
        className="bg-card border-t border-border rounded-t-3xl -mt-6 relative z-10 shadow-xl"
      >
        <div className="p-6">
          {/* Main stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Timer className="w-4 h-4" />
                <span className="text-xs">Duration</span>
              </div>
              <p className="text-2xl font-bold">{formatTime(elapsedTime)}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Route className="w-4 h-4" />
                <span className="text-xs">Distance</span>
              </div>
              <p className="text-2xl font-bold text-primary">{formatDistance(distance)}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Activity className="w-4 h-4" />
                <span className="text-xs">Pace</span>
              </div>
              <p className="text-2xl font-bold">
                {pace > 0 ? `${pace.toFixed(1)}` : "--"}
                <span className="text-sm text-muted-foreground">/km</span>
              </p>
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-center gap-4">
            {!isRecording ? (
              <Button
                onClick={handleStart}
                variant="hero"
                size="xl"
                className="w-full max-w-xs"
              >
                <Play className="w-6 h-6" />
                Start Walk
              </Button>
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
                >
                  <Square className="w-5 h-5" />
                  Stop
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
  );
};

export default RecordWalk;
