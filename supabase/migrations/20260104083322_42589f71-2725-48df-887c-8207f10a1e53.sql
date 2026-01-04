-- Create a secure function to accept an invite
-- The walker needs to update the record but can't SELECT it due to RLS
CREATE OR REPLACE FUNCTION public.accept_dog_walker_invite(p_invite_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_invite_email text;
  v_caller_email text;
BEGIN
  -- Get caller's email
  SELECT email INTO v_caller_email 
  FROM auth.users 
  WHERE id = auth.uid();
  
  -- Verify this invite is for the caller
  SELECT walker_email INTO v_invite_email
  FROM public.dog_walkers
  WHERE id = p_invite_id AND status = 'pending';
  
  IF v_invite_email IS NULL THEN
    RAISE EXCEPTION 'Invite not found or already processed';
  END IF;
  
  IF lower(v_invite_email) != lower(v_caller_email) THEN
    RAISE EXCEPTION 'This invite is not for you';
  END IF;
  
  -- Accept the invite
  UPDATE public.dog_walkers
  SET 
    status = 'active',
    walker_user_id = auth.uid(),
    accepted_at = now()
  WHERE id = p_invite_id;
  
  RETURN true;
END;
$$;

-- Create a secure function to decline an invite
CREATE OR REPLACE FUNCTION public.decline_dog_walker_invite(p_invite_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_invite_email text;
  v_caller_email text;
BEGIN
  -- Get caller's email
  SELECT email INTO v_caller_email 
  FROM auth.users 
  WHERE id = auth.uid();
  
  -- Verify this invite is for the caller
  SELECT walker_email INTO v_invite_email
  FROM public.dog_walkers
  WHERE id = p_invite_id AND status = 'pending';
  
  IF v_invite_email IS NULL THEN
    RAISE EXCEPTION 'Invite not found or already processed';
  END IF;
  
  IF lower(v_invite_email) != lower(v_caller_email) THEN
    RAISE EXCEPTION 'This invite is not for you';
  END IF;
  
  -- Decline by deleting the invite
  DELETE FROM public.dog_walkers
  WHERE id = p_invite_id;
  
  RETURN true;
END;
$$;