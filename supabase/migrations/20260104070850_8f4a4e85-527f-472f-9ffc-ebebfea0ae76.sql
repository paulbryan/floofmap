-- Fix 1: Remove direct SELECT for walkers to prevent email exposure
-- They only need to see pending invites via get_my_pending_invites() function
DROP POLICY IF EXISTS "Walkers can view their own invites" ON public.dog_walkers;

-- Fix 2: Create a secure function for owners to view their invites
-- This replaces the dropped direct SELECT policy and excludes walker_email
CREATE OR REPLACE FUNCTION public.get_owner_dog_sharing(p_owner_user_id uuid)
RETURNS TABLE(
  id uuid,
  dog_id uuid,
  walker_user_id uuid,
  status text,
  created_at timestamp with time zone,
  accepted_at timestamp with time zone,
  revoked_at timestamp with time zone,
  walker_name text,
  walker_avatar text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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
    AND auth.uid() = p_owner_user_id
$$;