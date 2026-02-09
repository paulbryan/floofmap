# Quick Start Guide

Get FloofMap running in minutes!

## Prerequisites

- Node.js 18+ and npm
- Git

## Web App (5 minutes)

1. **Clone and navigate**
   ```bash
   git clone https://github.com/paulbryan/floofmap
   cd floofmap/web
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Install and run**
   ```bash
   npm install
   npm run dev
   ```

4. **Open browser**
   Visit http://localhost:5173

## Mobile App (10 minutes)

### Option 1: Test in Expo Go (Quick, but no background GPS)

1. **Navigate and setup**
   ```bash
   cd floofmap/mobile
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

2. **Install Expo Go app**
   - iOS: https://apps.apple.com/app/expo-go/id982107779
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

3. **Start development server**
   ```bash
   npm install
   npm start
   ```

4. **Scan QR code**
   - iOS: Use Camera app to scan QR code
   - Android: Use Expo Go app to scan QR code

⚠️ **Note:** Background location tracking does NOT work in Expo Go!

### Option 2: Development Build (Full features including background GPS)

#### For Android:

1. **Setup**
   ```bash
   cd floofmap/mobile
   cp .env.example .env
   # Edit .env with your Supabase credentials
   npm install
   ```

2. **Connect device or start emulator**
   - Physical device: Enable USB debugging and connect via USB
   - Emulator: Start Android Studio emulator

3. **Build and run**
   ```bash
   npx expo run:android
   ```

4. **Grant permissions**
   - When prompted, allow location access
   - Choose "Allow all the time" for background tracking

#### For iOS (Mac required):

1. **Setup**
   ```bash
   cd floofmap/mobile
   cp .env.example .env
   # Edit .env with your Supabase credentials
   npm install
   ```

2. **Connect device or start simulator**
   ```bash
   npx expo run:ios
   ```

3. **Grant permissions**
   - When prompted, allow location access
   - Choose "Always Allow" for background tracking

## Get Supabase Credentials

1. Go to https://supabase.com and sign up/sign in
2. Create a new project
3. Go to **Project Settings > API**
4. Copy:
   - Project URL → Use as `SUPABASE_URL`
   - anon/public key → Use as `SUPABASE_ANON_KEY`

## Test Background GPS Tracking

1. Open the mobile app (development build, not Expo Go)
2. Navigate to "Record" tab
3. Tap "Start Walk"
4. Grant location permissions (Always/All the time)
5. Lock your phone screen OR switch to another app
6. Walk around for 1-2 minutes
7. Return to app
8. You should see the route continued tracking! 🎉

## Troubleshooting

### "Cannot connect to Supabase"
- Check that your `.env` file has correct credentials
- Verify Supabase project is active and not paused

### "Location permission denied"
- iOS: Settings > FloofMap > Location > Always
- Android: Settings > Apps > FloofMap > Permissions > Location > Allow all the time

### "Background location not working"
- Make sure you're using a development build, NOT Expo Go
- Verify you granted "Always"/"All the time" permission
- Check that foreground notification appears (Android)

### "App won't build"
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Metro cache: `npx expo start --clear`
- For iOS: `cd ios && pod install && cd ..`

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [CONVERSION.md](CONVERSION.md) to understand the architecture
- Review [mobile/README.md](mobile/README.md) for mobile-specific guides
- Set up the Supabase database with migrations (see README)

## Need Help?

- Open an issue on GitHub
- Check the [Expo documentation](https://docs.expo.dev/)
- Read the [Supabase docs](https://supabase.com/docs)

Happy walking! 🐕
