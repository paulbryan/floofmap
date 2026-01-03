-- Create dog_walkers table for sharing dogs with walkers
CREATE TABLE public.dog_walkers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dog_id UUID NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL,
  walker_user_id UUID NOT NULL,
  walker_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(dog_id, walker_user_id)
);

-- Enable RLS
ALTER TABLE public.dog_walkers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dog_walkers table
-- Owners can manage their dog sharing
CREATE POLICY "Owners can view their dog sharing" 
ON public.dog_walkers FOR SELECT 
USING (auth.uid() = owner_user_id);

CREATE POLICY "Owners can create dog sharing" 
ON public.dog_walkers FOR INSERT 
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owners can update their dog sharing" 
ON public.dog_walkers FOR UPDATE 
USING (auth.uid() = owner_user_id);

CREATE POLICY "Owners can delete their dog sharing" 
ON public.dog_walkers FOR DELETE 
USING (auth.uid() = owner_user_id);

-- Walkers can see invites for them
CREATE POLICY "Walkers can view their invites" 
ON public.dog_walkers FOR SELECT 
USING (auth.uid() = walker_user_id AND status IN ('pending', 'active'));

-- Walkers can accept invites (update pending to active)
CREATE POLICY "Walkers can accept invites" 
ON public.dog_walkers FOR UPDATE 
USING (auth.uid() = walker_user_id AND status = 'pending')
WITH CHECK (auth.uid() = walker_user_id AND status = 'active');

-- Deny anonymous access
CREATE POLICY "Deny anonymous access to dog_walkers" 
ON public.dog_walkers FOR ALL 
TO anon
USING (false) 
WITH CHECK (false);

-- Create security definer function to check walker access
CREATE OR REPLACE FUNCTION public.has_walker_access(p_dog_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dog_walkers
    WHERE dog_id = p_dog_id 
      AND walker_user_id = p_user_id 
      AND status = 'active'
  )
$$;

-- Create function to check if user owns a dog
CREATE OR REPLACE FUNCTION public.owns_dog(p_dog_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dogs
    WHERE id = p_dog_id AND user_id = p_user_id
  )
$$;

-- Update dogs RLS to allow walkers to see shared dogs
CREATE POLICY "Walkers can view shared dogs" 
ON public.dogs FOR SELECT 
USING (public.has_walker_access(id, auth.uid()));

-- Update walks RLS policies
-- Walkers can create walks for dogs they have access to
CREATE POLICY "Walkers can create walks for shared dogs" 
ON public.walks FOR INSERT 
WITH CHECK (
  dog_id IS NOT NULL 
  AND public.has_walker_access(dog_id, auth.uid())
);

-- Walkers can view walks for dogs they have active access to
CREATE POLICY "Walkers can view walks for shared dogs" 
ON public.walks FOR SELECT 
USING (
  dog_id IS NOT NULL 
  AND public.has_walker_access(dog_id, auth.uid())
);

-- Owners can see all walks for their dogs (even after revoking walker)
CREATE POLICY "Owners can view all walks for their dogs" 
ON public.walks FOR SELECT 
USING (
  dog_id IS NOT NULL 
  AND public.owns_dog(dog_id, auth.uid())
);

-- Walkers can update walks they created for shared dogs
CREATE POLICY "Walkers can update walks they created" 
ON public.walks FOR UPDATE 
USING (
  auth.uid() = user_id 
  AND dog_id IS NOT NULL 
  AND public.has_walker_access(dog_id, auth.uid())
);

-- Track points - walkers can create for walks they have access to
CREATE POLICY "Walkers can create track points for shared walks" 
ON public.track_points FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM walks w
    WHERE w.id = track_points.walk_id
      AND w.dog_id IS NOT NULL
      AND public.has_walker_access(w.dog_id, auth.uid())
  )
);

-- Track points - walkers and owners can view
CREATE POLICY "Walkers can view track points for shared walks" 
ON public.track_points FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM walks w
    WHERE w.id = track_points.walk_id
      AND w.dog_id IS NOT NULL
      AND (public.has_walker_access(w.dog_id, auth.uid()) OR public.owns_dog(w.dog_id, auth.uid()))
  )
);

-- Stop events - walkers can create for walks they have access to
CREATE POLICY "Walkers can create stop events for shared walks" 
ON public.stop_events FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM walks w
    WHERE w.id = stop_events.walk_id
      AND w.dog_id IS NOT NULL
      AND public.has_walker_access(w.dog_id, auth.uid())
  )
);

-- Stop events - walkers and owners can view
CREATE POLICY "Walkers can view stop events for shared walks" 
ON public.stop_events FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM walks w
    WHERE w.id = stop_events.walk_id
      AND w.dog_id IS NOT NULL
      AND (public.has_walker_access(w.dog_id, auth.uid()) OR public.owns_dog(w.dog_id, auth.uid()))
  )
);