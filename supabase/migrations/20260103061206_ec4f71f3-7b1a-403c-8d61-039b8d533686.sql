-- Add restrictive policies for poi_cache write operations
-- The service role (used by edge functions) bypasses RLS, so these policies
-- effectively block all client-side write attempts while allowing edge functions to write

-- Deny INSERT for all users (service role bypasses RLS)
CREATE POLICY "Only service role can insert POI cache"
ON public.poi_cache
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

-- Deny UPDATE for all users
CREATE POLICY "Only service role can update POI cache"
ON public.poi_cache
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

-- Deny DELETE for all users
CREATE POLICY "Only service role can delete POI cache"
ON public.poi_cache
FOR DELETE
TO authenticated, anon
USING (false);