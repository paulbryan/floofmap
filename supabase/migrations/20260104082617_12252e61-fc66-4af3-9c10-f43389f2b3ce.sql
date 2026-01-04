-- Create a secure function to invite dog walkers
-- This handles upsert logic server-side, bypassing the need for SELECT access
CREATE OR REPLACE FUNCTION public.invite_dog_walker(
  p_dog_id uuid,
  p_walker_email text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_owner_user_id uuid;
  v_invite_id uuid;
BEGIN
  -- Verify the caller owns this dog
  IF NOT owns_dog(p_dog_id, auth.uid()) THEN
    RAISE EXCEPTION 'You do not own this dog';
  END IF;

  v_owner_user_id := auth.uid();

  -- Upsert the invite - if it exists, update it; if not, create it
  INSERT INTO public.dog_walkers (
    dog_id,
    owner_user_id,
    walker_user_id,
    walker_email,
    status,
    revoked_at,
    accepted_at
  )
  VALUES (
    p_dog_id,
    v_owner_user_id,
    '00000000-0000-0000-0000-000000000000'::uuid,
    lower(p_walker_email),
    'pending',
    NULL,
    NULL
  )
  ON CONFLICT (dog_id, walker_email)
  DO UPDATE SET
    status = 'pending',
    revoked_at = NULL,
    accepted_at = NULL,
    walker_user_id = '00000000-0000-0000-0000-000000000000'::uuid
  RETURNING id INTO v_invite_id;

  RETURN v_invite_id;
END;
$$;