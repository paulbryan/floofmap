-- Add explicit DENY policy for anonymous users on track_points
-- This prevents any unauthenticated access attempts to sensitive location data

CREATE POLICY "Deny anonymous access to track points"
ON public.track_points
FOR ALL
TO anon
USING (false)
WITH CHECK (false);