import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.fc8e55992b1e460b8f91d2cf336d851e',
  appName: 'FloofMap',
  webDir: 'dist',
  server: {
    // Hot-reload from Lovable preview during development
    url: 'https://fc8e5599-2b1e-460b-8f91-d2cf336d851e.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    Geolocation: {
      // iOS: Request "always" location permission for background tracking
      // Android: Request ACCESS_BACKGROUND_LOCATION
    },
  },
  ios: {
    // Enable background location updates
    backgroundColor: '#FFFFFF',
  },
  android: {
    backgroundColor: '#FFFFFF',
  },
};

export default config;
