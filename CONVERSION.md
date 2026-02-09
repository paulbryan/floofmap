# Converting FloofMap from Web to React Native

This document explains the conversion of FloofMap from a pure web application to a hybrid application with both web and React Native mobile versions.

## Overview

The original FloofMap was a web application built with React, Vite, and Tailwind CSS. While it worked well in browsers, GPS tracking would stop when the app went to the background or the screen was locked on mobile devices.

To solve this problem, we created a React Native mobile app using Expo that supports **true background GPS tracking**.

## Architecture

### Before Conversion

```
floofmap/
├── src/              # React web app source
├── public/           # Static assets
├── package.json
└── vite.config.ts
```

### After Conversion

```
floofmap/
├── web/              # React web app (moved here)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── mobile/           # React Native mobile app (new)
│   ├── src/
│   │   ├── config/
│   │   ├── navigation/
│   │   ├── screens/
│   │   ├── services/
│   │   └── components/
│   ├── app.json
│   └── package.json
├── supabase/         # Shared backend (unchanged)
├── package.json      # Root workspace manager
└── README.md         # Updated documentation
```

## Key Differences: Web vs Mobile

### Location Tracking

**Web App:**
- Uses browser's `navigator.geolocation` API
- Stops tracking when tab loses focus or device sleeps
- Limited to foreground operation
- Works on any device with a browser

**Mobile App:**
- Uses `expo-location` with background tracking
- Continues tracking when app is in background
- Continues tracking when screen is locked
- Requires native build (not Expo Go)
- Shows persistent notification during tracking (Android)

### Navigation

**Web App:**
- Uses `react-router-dom` for routing
- URL-based navigation
- Browser history

**Mobile App:**
- Uses `@react-navigation/native`
- Stack and tab navigation
- Native transitions and gestures

### Maps

**Web App:**
- Uses `maplibre-gl` for web map rendering
- Vector tiles
- WebGL-based

**Mobile App:**
- Uses `react-native-maps` with native map components
- Google Maps (Android) / Apple Maps (iOS)
- Native performance

### Data Storage

**Web App:**
- `localStorage` for Supabase auth
- IndexedDB for offline data (via `idb`)

**Mobile App:**
- `@react-native-async-storage/async-storage` for Supabase auth
- AsyncStorage for offline data

### UI Components

**Web App:**
- Tailwind CSS for styling
- shadcn/ui components
- Radix UI primitives

**Mobile App:**
- React Native StyleSheet
- Custom components
- Native UI elements

## Background GPS Tracking Implementation

The mobile app's background GPS tracking is implemented using two key Expo packages:

### 1. expo-location

Provides access to device location with support for background updates:

```typescript
import * as Location from 'expo-location';

await Location.requestForegroundPermissionsAsync();
await Location.requestBackgroundPermissionsAsync();

await Location.startLocationUpdatesAsync(TASK_NAME, {
  accuracy: Location.Accuracy.BestForNavigation,
  timeInterval: 1000,  // Update every second
  distanceInterval: 1, // Or when moved 1 meter
  foregroundService: {
    notificationTitle: 'Recording Walk',
    notificationBody: 'Your walk is being tracked',
  },
});
```

### 2. expo-task-manager

Enables background tasks to run when the app is not active:

```typescript
import * as TaskManager from 'expo-task-manager';

TaskManager.defineTask(TASK_NAME, async ({ data, error }) => {
  if (data) {
    const { locations } = data;
    // Process location updates
  }
});
```

### How It Works

1. **User starts recording a walk**
   - App requests background location permissions
   - Starts location tracking service
   - On Android: Shows persistent notification

2. **App goes to background**
   - Background task continues running
   - Location updates are received and stored in memory buffer
   - Notification remains visible (Android)

3. **Location updates processed**
   - Updates are collected in a buffer
   - Main app polls buffer every second
   - Points are added to route with distance calculation
   - Map is updated with new route segment

4. **User stops recording**
   - Background location service is stopped
   - Route data is saved to Supabase
   - Notification is dismissed (Android)

### Platform-Specific Behavior

**iOS:**
- Requires "Always" location permission
- Shows blue status bar when app uses location in background
- System may suspend background updates if battery is low
- Requires `UIBackgroundModes: ["location"]` in Info.plist

**Android:**
- Requires `ACCESS_BACKGROUND_LOCATION` permission (Android 10+)
- Shows persistent foreground service notification
- More reliable background tracking than iOS
- Requires `FOREGROUND_SERVICE` and `FOREGROUND_SERVICE_LOCATION` permissions

## Shared Code and Backend

Both web and mobile apps share:

### Supabase Backend
- Database schema
- Authentication
- Storage
- Edge functions
- Real-time subscriptions

### Data Models
- User profiles
- Dogs
- Walks
- Points of interest (POIs)
- Dog walker invitations

## Development Workflow

### Working on Web App

```bash
cd web
npm install
npm run dev
```

### Working on Mobile App

```bash
cd mobile
npm install
npm start

# For testing background location:
npx expo run:android  # or run:ios
```

### Root Commands

```bash
# Install all dependencies
npm run install:all

# Run web dev server
npm run web:dev

# Run mobile dev server
npm run mobile:start
```

## Testing Background Location

Background location tracking **does not work** in Expo Go. You must create a development build:

### Android Testing

```bash
cd mobile
npx expo run:android
```

1. App opens on device/emulator
2. Grant location permissions
3. Select "Allow all the time" for background access
4. Start recording a walk
5. Press home button or lock screen
6. Walk around for a minute
7. Return to app - route should have continued tracking

### iOS Testing (requires Mac)

```bash
cd mobile
npx expo run:ios
```

1. App opens on device/simulator
2. Grant location permissions
3. Select "Always Allow"
4. Start recording a walk
5. Press home button or lock screen
6. Walk around for a minute
7. Return to app - route should have continued tracking

## Deployment

### Web App

Deploy to Lovable or any static hosting:
```bash
cd web
npm run build
# Deploy dist/ folder
```

### Mobile App

Use Expo EAS Build:
```bash
cd mobile
eas build --platform android
eas build --platform ios
eas submit
```

## Migration Notes

When migrating existing code from web to mobile:

1. **Replace web-specific APIs:**
   - `navigator.geolocation` → `expo-location`
   - `localStorage` → `AsyncStorage`
   - `fetch` → works the same

2. **Convert UI components:**
   - `<div>` → `<View>`
   - `<span>`, `<p>` → `<Text>`
   - `<img>` → `<Image>`
   - CSS classes → StyleSheet

3. **Update routing:**
   - `react-router-dom` → `@react-navigation`
   - `<Link>` → `<TouchableOpacity>` with `navigation.navigate()`

4. **Map components:**
   - `maplibre-gl` → `react-native-maps`
   - Different API for markers and polylines

## Benefits of This Architecture

1. **Code Reuse:** Shared backend, data models, and business logic
2. **Platform Optimization:** Each platform uses native capabilities
3. **Better UX:** Background GPS tracking on mobile, responsive web UI
4. **Maintainability:** Separate codebases are easier to maintain than single cross-platform codebase
5. **Deployment:** Web and mobile can be deployed independently

## Future Improvements

- [ ] Share more business logic between web and mobile
- [ ] Create shared TypeScript types package
- [ ] Add more native mobile features (push notifications, etc.)
- [ ] Optimize battery usage for long walks
- [ ] Add offline mode with local database sync
- [ ] Implement route optimization algorithms
- [ ] Add social features for dog walkers

## Conclusion

This conversion successfully addresses the original issue of GPS tracking not working when the app is in the background. The mobile app now provides a true native experience with reliable background location tracking, while the web app continues to serve desktop and casual mobile users.
