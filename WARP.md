# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Floofmap is a dog walking app built with Vite, React, TypeScript, Tailwind CSS, shadcn/ui, and Supabase. It tracks walks with GPS, records "sniff stops," and provides AI-powered walk analysis.

## Commands

```bash
# Development
npm run dev              # Start dev server (Vite)
npm run build            # Production build
npm run build:dev        # Development build
npm run lint             # Run ESLint
npm run preview          # Preview production build

# Supabase
supabase login           # Authenticate CLI
supabase link --project-ref cxjtdkpmimsumezzifxv  # Link to project
supabase db push         # Apply migrations to remote
supabase functions serve # Run edge functions locally
```

## Architecture

### Frontend Stack
- **Vite + React 18** with SWC for fast compilation
- **TypeScript** with strict mode
- **Tailwind CSS** + **shadcn/ui** for styling/components
- **TanStack Query** for server state management
- **React Router v6** for client-side routing
- **MapLibre GL** for interactive maps
- **Framer Motion** for animations

### Backend (Supabase)
- **Auth**: Email/password authentication via Supabase Auth
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Edge Functions**: Deno-based serverless functions in `supabase/functions/`
- **Migrations**: SQL files in `supabase/migrations/`

### Key Data Models
- `profiles` - User profiles with cached location
- `dogs` - User's dogs
- `dog_walkers` - Shared dog access between users
- `walks` - Walk sessions with distance/duration
- `track_points` - GPS coordinates for each walk
- `stop_events` - Detected sniff/stop events during walks
- `community_pins` - User-reported POIs (dog parks, water fountains, etc.)

## Code Structure

```
src/
├── App.tsx                    # Routes and providers
├── main.tsx                   # Entry point
├── components/
│   ├── app/                   # Authenticated app shell (AppLayout, nav)
│   ├── landing/               # Marketing/landing page components
│   ├── map/                   # MapLibre map components
│   └── ui/                    # shadcn/ui primitives
├── hooks/                     # Custom hooks
│   ├── useMapRoute.ts         # Map route drawing/animation
│   └── usePOIMarkers.ts       # POI marker management
├── integrations/supabase/
│   ├── client.ts              # Supabase client instance
│   └── types.ts               # Auto-generated DB types
├── lib/
│   ├── offlineSync.ts         # IndexedDB offline sync for walks
│   └── utils.ts               # cn() utility for Tailwind
└── pages/
    ├── app/                   # Protected routes (/app/*)
    └── *.tsx                  # Public routes (auth, landing, etc.)

supabase/
├── config.toml                # Project config and function settings
├── functions/                 # Edge functions (Deno)
│   ├── analyze-walk/          # AI walk analysis via Lovable API
│   ├── detect-stops/          # Sniff stop detection algorithm
│   ├── fetch-pois/            # POI fetching from external APIs
│   ├── geocode/               # Reverse geocoding
│   └── get-weather/           # Weather data
└── migrations/                # SQL migration files
```

## Key Patterns

### Supabase Client Usage
```typescript
import { supabase } from "@/integrations/supabase/client";

// Queries
const { data, error } = await supabase.from("walks").select("*");

// Auth
const { data: { user } } = await supabase.auth.getUser();

// Edge function calls
await supabase.functions.invoke("detect-stops", { body: { walk_id } });
```

### Route Protection
Protected routes use `AppLayout` which checks auth state and redirects to `/auth` if unauthenticated. The layout provides responsive navigation (sidebar on desktop, bottom nav on mobile).

### Offline Sync
`src/lib/offlineSync.ts` uses IndexedDB to store walks and track points when offline. Data syncs automatically when the connection is restored via the `online` event listener.

### Environment Variables
Required in `.env`:
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
```

Edge functions require secrets set in Supabase dashboard:
- `LOVABLE_API_KEY` - For AI walk analysis
