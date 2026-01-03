-- Add explicit DENY policies for anonymous users on sensitive tables
-- This prevents any unauthenticated access attempts

-- Profiles table - contains user names and avatars
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Dogs table - contains user's pet information
CREATE POLICY "Deny anonymous access to dogs"
ON public.dogs
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Walks table - contains user's walk history and locations
CREATE POLICY "Deny anonymous access to walks"
ON public.walks
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Stop events table - contains location data from walks
CREATE POLICY "Deny anonymous access to stop events"
ON public.stop_events
FOR ALL
TO anon
USING (false)
WITH CHECK (false);