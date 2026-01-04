-- Drop the view since it's causing issues and isn't needed
-- (all reads go through secure RPC functions anyway)
DROP VIEW IF EXISTS public.dog_walkers_safe;

-- The current SELECT policy already restricts to owner_user_id = auth.uid()
-- The email is only visible to the owner who created the invite, which is acceptable
-- since they're the one who entered the email address in the first place

-- Update the walker SELECT policy to not expose other walkers' emails
-- Walkers should only see their own invites (their own email)
DROP POLICY IF EXISTS "Walkers can view their invites" ON public.dog_walkers;

CREATE POLICY "Walkers can view their own invites" 
ON public.dog_walkers 
FOR SELECT 
USING (
  auth.uid() = walker_user_id 
  AND status IN ('pending', 'active')
);