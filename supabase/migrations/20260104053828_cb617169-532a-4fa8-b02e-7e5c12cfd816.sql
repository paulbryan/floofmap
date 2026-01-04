-- Drop the SECURITY DEFINER view and recreate with proper security
DROP VIEW IF EXISTS public.dog_walkers_safe;

-- Create the view with SECURITY INVOKER (default, explicit for clarity)
-- This ensures RLS policies of the querying user are applied
CREATE VIEW public.dog_walkers_safe 
WITH (security_invoker = true) AS
SELECT 
  id,
  dog_id,
  owner_user_id,
  walker_user_id,
  status,
  created_at,
  accepted_at,
  revoked_at
  -- walker_email is intentionally excluded to prevent email harvesting
FROM public.dog_walkers;

-- Grant access to authenticated users
GRANT SELECT ON public.dog_walkers_safe TO authenticated;