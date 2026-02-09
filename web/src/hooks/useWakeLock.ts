import { useState, useEffect, useCallback, useRef } from "react";

interface WakeLockState {
  isSupported: boolean;
  isActive: boolean;
  error: string | null;
}

/**
 * Hook to prevent the screen from sleeping during walk recording.
 * Uses the Screen Wake Lock API with a video-based fallback for older browsers.
 */
export function useWakeLock() {
  const [state, setState] = useState<WakeLockState>({
    isSupported: false,
    isActive: false,
    error: null,
  });

  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Check if Wake Lock API is supported
  useEffect(() => {
    const isSupported = "wakeLock" in navigator;
    setState((prev) => ({ ...prev, isSupported }));

    // Cleanup on unmount
    return () => {
      release();
    };
  }, []);

  // Re-acquire wake lock when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && state.isActive) {
        // Try to re-acquire the wake lock
        if ("wakeLock" in navigator && !wakeLockRef.current) {
          try {
            wakeLockRef.current = await navigator.wakeLock.request("screen");
            console.log("Wake lock re-acquired after visibility change");
          } catch (err) {
            console.warn("Failed to re-acquire wake lock:", err);
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [state.isActive]);

  /**
   * Create a video element that plays a tiny video loop to prevent sleep.
   * This is a fallback for browsers without Wake Lock API support (e.g., older iOS Safari).
   */
  const createNoSleepVideo = useCallback(() => {
    if (videoRef.current) return videoRef.current;

    const video = document.createElement("video");
    video.setAttribute("playsinline", "");
    video.setAttribute("muted", "");
    video.setAttribute("loop", "");
    video.setAttribute("title", "Wake lock video");
    video.style.position = "absolute";
    video.style.left = "-9999px";
    video.style.top = "-9999px";
    video.style.width = "1px";
    video.style.height = "1px";

    // Tiny webm video data (1x1 transparent pixel, ~1 second)
    // This is a base64-encoded minimal webm file
    const webmData =
      "data:video/webm;base64,GkXfowEAAAAAAAAfQoaBAUL3gQFC8oEEQvOBCEKChHdlYm1Ch4EEQoWBAhhTgGcBAAAAAAAB9xFNm3RALE27i1OrhBVJqWZTrIHfTbuMU6uEFlSua1OsggEwTbuMU6uEHFO7a1OsggLuTbuMU6uEElTDZ1OsggEyTbuMU6uEIlPDZ1OsggE0TbuMU6uEI1O7a1OsggEsTbuMU6uEJFO7a1OsggFoTbuMU6uEJlS7a1OsggFwTbuMU6uEKFS7a1OsggGATbuMU6uEK1O7a1OsggFwTbuMU6uELFS7a1OsggF4TbuMU6uELVO7a1OsggEwTbuMU6uELlS7a1OsggEAAAAAAAAACgBBB9eBAXPFgIJjYWJpbmV0cwBZYWNsb3VkRAAAAUFNm3MRTZt0RU2bdFNFm3RTRZt0QEAAAAAAAABIYGFjbG91ZFNvdW5kQkBAgGhBdWRpb0FYQIA=";

    // Try to use a proper video source, fallback to data URI
    video.src = webmData;

    document.body.appendChild(video);
    videoRef.current = video;
    return video;
  }, []);

  /**
   * Request wake lock to prevent screen from sleeping.
   */
  const request = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, error: null }));

    // Try Wake Lock API first (supported in modern Chrome, Edge, and Safari 16.4+)
    if ("wakeLock" in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request("screen");

        wakeLockRef.current.addEventListener("release", () => {
          console.log("Wake lock was released");
          // Don't update state here - let the visibility handler re-acquire if needed
        });

        setState((prev) => ({ ...prev, isActive: true }));
        console.log("Wake lock acquired via API");
        return true;
      } catch (err: any) {
        console.warn("Wake Lock API failed:", err.message);
        // Fall through to video fallback
      }
    }

    // Fallback: Use video element to prevent sleep
    try {
      const video = createNoSleepVideo();
      await video.play();
      setState((prev) => ({ ...prev, isActive: true }));
      console.log("Wake lock acquired via video fallback");
      return true;
    } catch (err: any) {
      const errorMessage = "Could not prevent screen sleep. Keep the app visible during your walk.";
      setState((prev) => ({ ...prev, error: errorMessage }));
      console.error("All wake lock methods failed:", err);
      return false;
    }
  }, [createNoSleepVideo]);

  /**
   * Release the wake lock, allowing the screen to sleep normally.
   */
  const release = useCallback(async () => {
    // Release Wake Lock API
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log("Wake lock released via API");
      } catch (err) {
        console.warn("Error releasing wake lock:", err);
      }
    }

    // Stop and remove video element
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.remove();
      videoRef.current = null;
      console.log("Wake lock released via video");
    }

    setState((prev) => ({ ...prev, isActive: false, error: null }));
  }, []);

  return {
    ...state,
    request,
    release,
  };
}

// Wake Lock API types are now part of TypeScript's lib.dom.d.ts
// No custom type augmentation needed
