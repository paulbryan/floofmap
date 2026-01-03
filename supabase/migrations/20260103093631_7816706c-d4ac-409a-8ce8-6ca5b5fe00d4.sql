-- Create a security definer function to get pending invites for the current user
-- This matches their email server-side without exposing other users' emails
CREATE OR REPLACE FUNCTION public.get_my_pending_invites()
RETURNS TABLE (
  id uuid,
  dog_id uuid,
  owner_user_id uuid,
  status text,
  dog_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    dw.id,
    dw.dog_id,
    dw.owner_user_id,
    dw.status,
    d.name as dog_name
  FROM public.dog_walkers dw
  LEFT JOIN public.dogs d ON d.id = dw.dog_id
  WHERE dw.walker_email = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
    AND dw.status = 'pending'
$$;