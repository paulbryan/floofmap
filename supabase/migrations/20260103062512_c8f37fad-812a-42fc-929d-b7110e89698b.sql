-- Fix community_pins: restrict to authenticated users only
-- Drop the current public SELECT policy and replace with authenticated-only

DROP POLICY IF EXISTS "Anyone can view active pins" ON public.community_pins;

-- Only authenticated users can view active pins
CREATE POLICY "Authenticated users can view active pins"
ON public.community_pins
FOR SELECT
TO authenticated
USING (status = 'active'::text);

-- Explicitly deny anonymous access
CREATE POLICY "Deny anonymous access to community pins"
ON public.community_pins
FOR ALL
TO anon
USING (false)
WITH CHECK (false);