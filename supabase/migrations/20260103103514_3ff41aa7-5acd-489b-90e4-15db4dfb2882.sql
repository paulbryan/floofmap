-- Create a secure function to get dog walkers without exposing email addresses
CREATE OR REPLACE FUNCTION public.get_dog_walkers_for_owner(p_owner_user_id uuid)
RETURNS TABLE(
  id uuid,
  dog_id uuid,
  walker_user_id uuid,
  status text,
  created_at timestamptz,
  accepted_at timestamptz,
  revoked_at timestamptz,
  walker_name text,
  walker_avatar text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    dw.id,
    dw.dog_id,
    dw.walker_user_id,
    dw.status,
    dw.created_at,
    dw.accepted_at,
    dw.revoked_at,
    p.full_name as walker_name,
    p.avatar_url as walker_avatar
  FROM public.dog_walkers dw
  LEFT JOIN public.profiles p ON p.id = dw.walker_user_id
  WHERE dw.owner_user_id = p_owner_user_id
    AND dw.status != 'revoked'
    AND auth.uid() = p_owner_user_id
$$;