-- Create a trigger to null out walker_email after an invite is accepted
-- This prevents email harvesting since accepted invites won't contain the email
CREATE OR REPLACE FUNCTION public.nullify_walker_email_on_accept()
RETURNS TRIGGER AS $$
BEGIN
  -- When status changes to 'active' (invite accepted), remove the email
  IF NEW.status = 'active' AND OLD.status = 'pending' THEN
    NEW.walker_email = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger
DROP TRIGGER IF EXISTS nullify_email_on_accept ON public.dog_walkers;
CREATE TRIGGER nullify_email_on_accept
  BEFORE UPDATE ON public.dog_walkers
  FOR EACH ROW
  EXECUTE FUNCTION public.nullify_walker_email_on_accept();

-- Clean up any existing accepted invites that still have emails
UPDATE public.dog_walkers 
SET walker_email = NULL 
WHERE status = 'active' AND walker_email IS NOT NULL;