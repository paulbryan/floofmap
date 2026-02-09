# FloofMap Mobile

React Native mobile application for FloofMap, built with Expo. This app enables **background GPS tracking** for dog walks, allowing location recording even when the app is not in the foreground.

## Features

- 🐕 Record dog walks with GPS tracking
- 📍 Background location tracking (works when app is in background or screen is locked)
- 🗺️ Interactive map view with route visualization
- ⏱️ Real-time distance and time tracking
- 💾 Automatic sync with Supabase backend
- 🔐 User authentication
- 📱 Native iOS and Android support

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli`)
- For iOS: Mac with Xcode (for building)
- For Android: Android Studio (for building)
- Physical device or emulator for testing

### Installation

```bash
# Install dependencies
npm install

# Create .env file with your Supabase credentials
cp .env.example .env
# Edit .env with your actual Supabase URL and anon key
```

### Development

```bash
# Start the Expo development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

### Testing Background Location

**Important:** Background location tracking does NOT work in Expo Go. You must create a development build:

```bash
# For Android
npx expo run:android

# For iOS
npx expo run:ios
```

Then:
1. Open the app on your device
2. Grant location permissions when prompted
3. Select "Always Allow" or "Allow all the time" for background tracking
4. Start recording a walk
5. Lock the screen or switch to another app
6. The app will continue tracking your location

## Project Structure

```
mobile/
├── src/
│   ├── config/          # Configuration files (Supabase)
│   ├── navigation/      # React Navigation setup
│   ├── screens/         # App screens
│   ├── services/        # Background location service
│   ├── components/      # Reusable components
│   └── types/           # TypeScript type definitions
├── assets/              # Images, fonts, etc.
├── app.json            # Expo configuration
├── App.tsx             # App entry point
└── package.json        # Dependencies
```

## Background Location Implementation

The app uses `expo-location` with `expo-task-manager` to enable background GPS tracking:

- **Foreground Service**: On Android, shows a persistent notification while tracking
- **Background Updates**: Receives location updates every second or when moved 1 meter
- **High Accuracy**: Uses best available location accuracy for precise tracking
- **Battery Optimized**: Only tracks when actively recording a walk

See `src/services/backgroundLocation.ts` for implementation details.

## Configuration

### Location Permissions

Permissions are configured in `app.json`:

**iOS:**
- `NSLocationWhenInUseUsageDescription`
- `NSLocationAlwaysAndWhenInUseUsageDescription`
- `NSLocationAlwaysUsageDescription`
- `UIBackgroundModes: ["location"]`

**Android:**
- `ACCESS_FINE_LOCATION`
- `ACCESS_BACKGROUND_LOCATION`
- `FOREGROUND_SERVICE`
- `FOREGROUND_SERVICE_LOCATION`

### Environment Variables

Required environment variables in `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Building for Production

### Using EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure your project
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

### Local Builds

```bash
# Android
npx expo run:android --variant release

# iOS (requires Mac)
npx expo run:ios --configuration Release
```

## Troubleshooting

### Background location not working

1. Ensure you're using a development build, not Expo Go
2. Check that background permissions are granted
3. On Android, verify the foreground service notification appears
4. On iOS, check that "Always" location permission is granted

### Location accuracy issues

- Make sure you're testing outdoors with clear sky view
- Indoor testing may result in poor GPS accuracy
- Wait a few seconds for GPS to acquire satellite lock

## Technologies Used

- **Expo SDK 54** - React Native framework
- **React Navigation** - Navigation library
- **expo-location** - Location and background tracking
- **expo-task-manager** - Background task execution
- **react-native-maps** - Map component
- **@supabase/supabase-js** - Backend integration
- **TypeScript** - Type safety

## License

See root project LICENSE file.
