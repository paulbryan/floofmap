-- Fix 1: poi_cache - restrict to authenticated users only
DROP POLICY IF EXISTS "Anyone can read POI cache" ON public.poi_cache;

CREATE POLICY "Authenticated users can read POI cache"
ON public.poi_cache
FOR SELECT
TO authenticated
USING (true);

-- Explicit deny for anonymous users on poi_cache
CREATE POLICY "Deny anonymous access to POI cache"
ON public.poi_cache
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Fix 2: track_points - add missing UPDATE policy
CREATE POLICY "Users can update own track points"
ON public.track_points
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM walks
  WHERE walks.id = track_points.walk_id
  AND walks.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM walks
  WHERE walks.id = track_points.walk_id
  AND walks.user_id = auth.uid()
));