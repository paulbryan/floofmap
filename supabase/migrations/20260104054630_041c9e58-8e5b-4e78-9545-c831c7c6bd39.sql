-- Make walker_email nullable to support clearing it after acceptance
-- The column is currently NOT NULL which would break the trigger
ALTER TABLE public.dog_walkers ALTER COLUMN walker_email DROP NOT NULL;