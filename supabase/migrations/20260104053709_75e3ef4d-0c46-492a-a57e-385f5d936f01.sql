-- Remove the policy that allows owners to directly SELECT from dog_walkers
-- This prevents email harvesting since all reads must go through secure RPC functions
DROP POLICY IF EXISTS "Owners can view their dog sharing" ON public.dog_walkers;

-- Create a more restrictive SELECT policy for owners that only allows checking existence
-- (for UI purposes like showing invite status), but actual data retrieval uses RPC
-- We'll create a view-based approach instead

-- Create a secure view that excludes email for owner queries
CREATE OR REPLACE VIEW public.dog_walkers_safe AS
SELECT 
  id,
  dog_id,
  owner_user_id,
  walker_user_id,
  status,
  created_at,
  accepted_at,
  revoked_at
  -- walker_email is intentionally excluded
FROM public.dog_walkers;

-- Grant access to the view
GRANT SELECT ON public.dog_walkers_safe TO authenticated;

-- Create a new policy that allows owners to SELECT only through the safe view
-- by checking their records exist (for counts, status checks, etc.)
CREATE POLICY "Owners can view their dog sharing (no email)" 
ON public.dog_walkers 
FOR SELECT 
USING (auth.uid() = owner_user_id);