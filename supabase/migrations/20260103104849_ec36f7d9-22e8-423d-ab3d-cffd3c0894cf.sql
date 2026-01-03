-- Add unique constraint on dog_id and walker_email to support re-inviting revoked walkers
ALTER TABLE public.dog_walkers 
ADD CONSTRAINT dog_walkers_dog_id_walker_email_key UNIQUE (dog_id, walker_email);