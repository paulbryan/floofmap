import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

export const LOCATION_TASK_NAME = 'background-location-task';

export interface LocationPoint {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  speed: number | null;
}

// Store location updates in memory for processing
let locationBuffer: LocationPoint[] = [];

export const getLocationBuffer = () => locationBuffer;
export const clearLocationBuffer = () => {
  locationBuffer = [];
};

// Define the background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error('Background location error:', error);
    return;
  }
  
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    
    // Process each location update
    locations.forEach((location) => {
      const point: LocationPoint = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        timestamp: location.timestamp,
        speed: location.coords.speed,
      };
      
      locationBuffer.push(point);
      console.log('Background location update:', point);
    });
  }
});

export const startBackgroundLocation = async () => {
  // Request permissions
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  
  if (foregroundStatus !== 'granted') {
    throw new Error('Foreground location permission not granted');
  }
  
  const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
  
  if (backgroundStatus !== 'granted') {
    throw new Error('Background location permission not granted');
  }
  
  // Start background location tracking
  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 1000, // Update every second
    distanceInterval: 1, // Or when moved 1 meter
    foregroundService: {
      notificationTitle: 'FloofMap Walk Recording',
      notificationBody: 'Recording your walk in the background',
      notificationColor: '#FF6B6B',
    },
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
  });
  
  console.log('Background location tracking started');
};

export const stopBackgroundLocation = async () => {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
  
  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    console.log('Background location tracking stopped');
  }
};

export const isBackgroundLocationActive = async () => {
  return await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
};
