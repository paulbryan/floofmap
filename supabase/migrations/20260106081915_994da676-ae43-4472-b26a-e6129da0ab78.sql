-- Drop and recreate get_my_pending_invites with owner info
DROP FUNCTION IF EXISTS public.get_my_pending_invites();

CREATE FUNCTION public.get_my_pending_invites()
RETURNS TABLE(
  id uuid, 
  dog_id uuid, 
  owner_user_id uuid, 
  status text, 
  dog_name text,
  owner_name text,
  owner_avatar text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    dw.id,
    dw.dog_id,
    dw.owner_user_id,
    dw.status,
    d.name as dog_name,
    p.full_name as owner_name,
    p.avatar_url as owner_avatar
  FROM public.dog_walkers dw
  LEFT JOIN public.dogs d ON d.id = dw.dog_id
  LEFT JOIN public.profiles p ON p.id = dw.owner_user_id
  WHERE dw.walker_email = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
    AND dw.status = 'pending'
$$;