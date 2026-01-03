-- Allow users to view profiles of people they're connected to via dog_walkers
-- Owners can see walker profiles, walkers can see owner profiles
CREATE POLICY "Users can view connected profiles"
ON public.profiles
FOR SELECT
USING (
  -- User is an owner viewing their walker's profile
  EXISTS (
    SELECT 1 FROM public.dog_walkers
    WHERE dog_walkers.owner_user_id = auth.uid()
      AND dog_walkers.walker_user_id = profiles.id
      AND dog_walkers.status = 'active'
  )
  OR
  -- User is a walker viewing their owner's profile
  EXISTS (
    SELECT 1 FROM public.dog_walkers
    WHERE dog_walkers.walker_user_id = auth.uid()
      AND dog_walkers.owner_user_id = profiles.id
      AND dog_walkers.status = 'active'
  )
);