import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import {
  startBackgroundLocation,
  stopBackgroundLocation,
  getLocationBuffer,
  clearLocationBuffer,
  isBackgroundLocationActive,
  LocationPoint,
} from '../services/backgroundLocation';
import { supabase } from '../config/supabase';

const RecordWalkScreen = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [trackPoints, setTrackPoints] = useState<LocationPoint[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [distance, setDistance] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording && !isPaused && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, isPaused, startTime]);

  // Get current location on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to record walks.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      setCurrentLocation(location);
    })();
  }, []);

  // Poll location buffer when recording
  useEffect(() => {
    if (!isRecording || isPaused) return;

    const interval = setInterval(() => {
      const buffer = getLocationBuffer();
      
      if (buffer.length > 0) {
        setTrackPoints((prev) => {
          const newPoints = [...prev, ...buffer];
          
          // Calculate distance
          if (prev.length > 0 && buffer.length > 0) {
            const lastPoint = prev[prev.length - 1];
            const newDist = buffer.reduce((acc, point) => {
              const d = calculateDistance(
                lastPoint.latitude,
                lastPoint.longitude,
                point.latitude,
                point.longitude
              );
              return acc + (d < 100 ? d : 0); // Ignore unrealistic jumps
            }, 0);
            setDistance((d) => d + newDist);
          }
          
          return newPoints;
        });
        
        clearLocationBuffer();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(2)}km`;
  };

  const handleStartRecording = async () => {
    try {
      await startBackgroundLocation();
      setIsRecording(true);
      setStartTime(Date.now());
      setTrackPoints([]);
      setDistance(0);
      setElapsedTime(0);
      clearLocationBuffer();
      Alert.alert('Recording Started', 'Walk recording has started. You can now lock your phone.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start recording');
    }
  };

  const handlePauseRecording = () => {
    setIsPaused(!isPaused);
  };

  const handleStopRecording = async () => {
    try {
      await stopBackgroundLocation();
      
      // Save walk to database
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && trackPoints.length > 0) {
        const route = trackPoints.map((p) => ({
          lat: p.latitude,
          lon: p.longitude,
          timestamp: p.timestamp,
        }));

        await supabase.from('walks').insert({
          user_id: user.id,
          route,
          distance,
          duration: elapsedTime,
          start_time: new Date(startTime!).toISOString(),
          end_time: new Date().toISOString(),
        });
        
        Alert.alert('Walk Saved', `Distance: ${formatDistance(distance)}\nTime: ${formatTime(elapsedTime)}`);
      }
      
      setIsRecording(false);
      setIsPaused(false);
      setTrackPoints([]);
      setDistance(0);
      setElapsedTime(0);
      setStartTime(null);
      clearLocationBuffer();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save walk');
    }
  };

  const region = currentLocation
    ? {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : undefined;

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        {region ? (
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={region}
            showsUserLocation
            showsMyLocationButton
            followsUserLocation={isRecording}
          >
            {trackPoints.length > 0 && (
              <Polyline
                coordinates={trackPoints.map((p) => ({
                  latitude: p.latitude,
                  longitude: p.longitude,
                }))}
                strokeColor="#FF6B6B"
                strokeWidth={4}
              />
            )}
            
            {trackPoints.length > 0 && (
              <Marker
                coordinate={{
                  latitude: trackPoints[0].latitude,
                  longitude: trackPoints[0].longitude,
                }}
                title="Start"
                pinColor="green"
              />
            )}
          </MapView>
        ) : (
          <View style={styles.loadingContainer}>
            <Text>Loading map...</Text>
          </View>
        )}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{formatDistance(distance)}</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
          <Text style={styles.statLabel}>Time</Text>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        {!isRecording ? (
          <TouchableOpacity
            style={[styles.button, styles.startButton]}
            onPress={handleStartRecording}
          >
            <Text style={styles.buttonText}>Start Walk</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.recordingControls}>
            <TouchableOpacity
              style={[styles.button, styles.pauseButton]}
              onPress={handlePauseRecording}
            >
              <Text style={styles.buttonText}>{isPaused ? 'Resume' : 'Pause'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.stopButton]}
              onPress={handleStopRecording}
            >
              <Text style={styles.buttonText}>Stop & Save</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {isRecording && (
        <View style={styles.recordingIndicator}>
          <Text style={styles.recordingText}>● Recording in background</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  controlsContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  recordingControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  pauseButton: {
    backgroundColor: '#FFC107',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: '#FF6B6B',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  recordingText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default RecordWalkScreen;
