# Migration Plan: Lovable/Supabase → Cloudflare Workers + D1

Migrate FloofMap to a self-hosted Cloudflare stack while preserving all user data, walks, dogs, sharing relationships, and avatars. End state: static SPA on Cloudflare Pages, API on a Worker, data in D1, files in R2, auth handled by a self-hosted library (no Supabase dependency).

## Target architecture

```text
[ React SPA ]  --->  [ Cloudflare Pages ]
      |
      | fetch /api/*
      v
[ Cloudflare Worker (Hono) ]
   |        |          |          |
   v        v          v          v
 [ D1 ]  [ R2 ]   [ KV/cache ]  [ external APIs:
                                  OpenWeather, Nominatim,
                                  Overpass, Resend, Lovable AI ]
```

- **Frontend**: existing Vite/React app, unchanged UI. The `@/integrations/supabase/client` import is replaced by a thin `@/lib/api` client that calls the Worker.
- **API**: single Worker using Hono for routing, with one route group per former Supabase table/edge function.
- **DB**: D1 (SQLite). Postgres-specific features (RLS, security-definer functions, `gen_random_uuid`, `jsonb`, triggers) are reimplemented in app code.
- **Auth**: self-hosted using **Better Auth** (or Lucia) on the Worker, with email/password + Google OAuth + magic links via Resend. Sessions stored in D1, delivered as `HttpOnly` cookies.
- **Storage**: R2 bucket replaces the `avatars` Supabase storage bucket, fronted by a Worker route for signed uploads and public reads.
- **Secrets**: Worker bindings replace Supabase secrets (`OPENWEATHER_API_KEY`, `RESEND_API_KEY`, `LOVABLE_API_KEY`, Google OAuth client id/secret, session signing key).

## Workstreams

### 1. Repo scaffolding

- Add `worker/` package containing the Hono Worker, `wrangler.toml`, D1 schema, R2 binding, and route handlers.
- Add `worker/migrations/` (D1 SQL) and `worker/scripts/` (data import scripts).
- Configure `wrangler.toml` with: D1 binding `DB`, R2 binding `AVATARS`, KV binding `CACHE` (for `poi_cache`), env vars for secrets, custom domain `api.floofmap.com`.
- Update Vite build to output to `dist/`; deploy `dist/` to Cloudflare Pages with `/api/*` proxied to the Worker (or use a Pages Function reverse-proxy).

### 2. D1 schema

Port the 9 tables (`profiles`, `dogs`, `walks`, `walk_dogs`, `track_points`, `stop_events`, `dog_walkers`, `community_pins`, `poi_cache`) plus a new `users` and `sessions` table for Better Auth.

SQLite adjustments:
- `uuid` → `TEXT` with app-generated UUIDv7.
- `timestamptz` → `TEXT` ISO-8601 (or INTEGER epoch ms).
- `double precision` → `REAL`, `jsonb` → `TEXT` (JSON).
- Replace `gen_random_uuid()` defaults with values supplied by the API layer.
- Replace `updated_at` triggers with explicit writes in the data layer.
- Replace `auth.users` references with the new `users` table.
- Move `poi_cache` to Workers KV (TTL'd) rather than a table.
- Indexes: `track_points(walk_id, ts)`, `walks(user_id, started_at desc)`, `walk_dogs(walk_id)`, `walk_dogs(dog_id)`, `dog_walkers(walker_email)`, `stop_events(walk_id)`.

### 3. Authorization (replacing RLS)

RLS does not exist in D1. Reimplement every policy as an authorization helper in the Worker, applied per route:

- `requireUser()` middleware → loads session, attaches `userId` to context.
- `assertOwnsDog(dogId)`, `assertWalkerAccess(dogId)`, `assertOwnsWalk(walkId)` helpers mirror the SQL `owns_dog`, `has_walker_access` functions.
- Mirror the `get_walk_track_points` blurring logic for non-owner walkers (blur first/last 3 points to ~50 m).
- Mirror the security-definer RPCs (`invite_dog_walker`, `accept_dog_walker_invite`, `decline_dog_walker_invite`, `get_my_pending_invites`, `get_owner_dog_sharing`, `get_dog_walkers_for_owner`) as Worker endpoints.

### 4. Auth migration

- Install Better Auth with D1 adapter; configure email/password, Google OAuth, magic link (Resend transport).
- Set cookie domain `.floofmap.com` so SPA and Worker share session.
- Migrate users: export `auth.users` from Supabase via `pg_dump` or the Admin API. Supabase password hashes are **bcrypt** and portable — store the hash in `users.password_hash` and configure Better Auth to verify legacy bcrypt, rehashing on next login.
- Map Google-only users by `email`; on first login, link the Google provider record.
- Preserve original `user_id` UUIDs so every foreign key in `dogs`, `walks`, `dog_walkers`, `profiles.id`, etc. remains valid without rewriting.

### 5. Data migration

One-shot script (`worker/scripts/migrate.ts`) run locally with service-role Supabase creds:

1. `pg_dump --data-only --inserts` per table, or query via the Supabase JS client with the service role.
2. Transform rows: timestamps → ISO strings, `jsonb` → JSON.stringify, drop Postgres-only columns.
3. Stream into D1 via `wrangler d1 execute --file=...` or the D1 HTTP API in batches (D1 has a ~100 stmt / 1 MB per batch limit — chunk `track_points`).
4. Download every object in the `avatars` bucket via Supabase Storage API, upload to R2 with the same key, rewrite `profiles.avatar_url` and `dogs.avatar_url` to the new R2 public URL (`https://cdn.floofmap.com/avatars/...`).
5. Verification pass: row counts per table match source; spot-check 10 random walks end-to-end.

Run order: `users → profiles → dogs → dog_walkers → walks → walk_dogs → track_points → stop_events → community_pins`.

### 6. Port edge functions to Worker routes

| Supabase function | Worker route | Notes |
|---|---|---|
| `geocode` | `GET /api/geocode?lat&lon` | Nominatim passthrough, identical logic. |
| `get-weather` | `GET /api/weather?lat&lon` | OpenWeather; cache 10 min in KV. |
| `fetch-pois` | `GET /api/pois?bbox` | Overpass; cache in KV instead of `poi_cache` table. |
| `detect-stops` | `POST /api/walks/:id/detect-stops` | Pure logic, port as-is. |
| `analyze-walk` | `POST /api/walks/:id/analyze` | Uses Lovable AI — keep `LOVABLE_API_KEY` as Worker secret. |
| `send-invite-email` | `POST /api/invites/:id/email` | Resend, identical body. |
| `health` | `GET /api/health` | Trivial. |

Each handler: Deno `serve` → Hono handler; `Deno.env.get` → `c.env.X`; `createClient(...)` → direct D1 queries.

### 7. Realtime / offline

- The app uses `localStorage`-based offline sync (`src/lib/offlineSync.ts`) — keep as is; just point flush to new API.
- If any Supabase Realtime subscriptions exist (check `src/lib/offlineSync.ts` and hooks), replace with polling or Durable Objects + WebSockets. Inspect during implementation; defer DO work unless required.

### 8. Frontend swap

- Replace `src/integrations/supabase/client.ts` with `src/lib/api.ts` exposing typed methods (`api.dogs.list()`, `api.walks.create()`, etc.) backed by `fetch('/api/...', { credentials: 'include' })`.
- Replace `supabase.auth.*` calls in `Auth.tsx`, `AppLayout.tsx`, `Onboarding.tsx` with Better Auth's React client.
- Replace `supabase.functions.invoke('geocode', ...)` etc. with `api.geocode(...)`.
- Replace `supabase.storage.from('avatars').upload(...)` with `api.avatars.upload(file)` → Worker presigned R2 upload.
- Delete `src/integrations/supabase/` and `@supabase/supabase-js` from `package.json`.
- Regenerate types from D1 schema using `drizzle-kit` or hand-written types.

### 9. Capacitor

- Update `capacitor.config.ts` `server.url` (dev) and production fetch base URL to `https://api.floofmap.com`.
- Ensure cookies work in WKWebView/Android WebView (set `SameSite=None; Secure` and configure CORS `Access-Control-Allow-Credentials: true` with explicit origins).

### 10. DNS & cutover

1. Deploy Worker to staging subdomain, run full data migration into a staging D1, smoke-test SPA against it.
2. Schedule maintenance window. Put Supabase project into read-only by revoking write policies (or pause writes at the app layer).
3. Re-run delta migration for rows changed since the initial dump.
4. Switch `floofmap.com` DNS from Lovable to Cloudflare Pages; point `api.floofmap.com` at the Worker.
5. Update Google OAuth authorized redirect URIs to `https://api.floofmap.com/api/auth/callback/google`.
6. Monitor Worker logs + error rate for 48h; keep Supabase project paused but intact for rollback.

### 11. Decommission

- After 2 weeks of stable operation: export final Supabase backup to R2, delete Supabase project, remove Lovable Cloud binding, remove `supabase/` directory from repo, archive migration scripts.

## Risks & mitigations

- **D1 row/size limits on `track_points`**: a single long walk can produce thousands of points. Batch inserts ≤ 100 rows, and consider storing each walk's track as a single JSON blob in R2 with an index row in D1 if volumes are high. Decide after measuring largest existing walk during migration dry-run.
- **Password hash compatibility**: confirm Supabase exports bcrypt hashes (it does for email/password users). Magic-link-only users will need to re-auth via magic link post-cutover — acceptable.
- **No PostGIS**: current code does not appear to use PostGIS server-side; spatial work is client-side on the map. Verify during implementation.
- **Realtime**: if any feature depends on Postgres changefeeds, switch to short-poll first, Durable Objects later.
- **RLS gap**: every endpoint must enforce ownership in code. Add integration tests for each route covering owner / walker / stranger.

## Deliverables for the implementing agent

1. `worker/` package with Hono app, D1 schema, all routes, Better Auth setup, R2 handlers.
2. `worker/scripts/migrate.ts` end-to-end data + storage migration with verification.
3. Frontend changes: new `src/lib/api.ts`, removed `src/integrations/supabase/`, updated auth and storage call sites.
4. `wrangler.toml`, Pages config, updated `capacitor.config.ts`.
5. Runbook in `docs/migration.md` covering staging dry-run, cutover steps, and rollback.
