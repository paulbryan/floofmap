-- Remove the direct SELECT policy that exposes walker_email
-- Owners must use get_dog_walkers_for_owner function which excludes email
DROP POLICY IF EXISTS "Owners can view their dog sharing (no email)" ON public.dog_walkers;