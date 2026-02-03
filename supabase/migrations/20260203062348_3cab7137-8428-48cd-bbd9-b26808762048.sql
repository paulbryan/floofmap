-- Create walk_dogs junction table for multi-dog walks
CREATE TABLE public.walk_dogs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  walk_id uuid NOT NULL REFERENCES public.walks(id) ON DELETE CASCADE,
  dog_id uuid NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(walk_id, dog_id)
);

-- Create index for efficient lookups
CREATE INDEX idx_walk_dogs_walk_id ON public.walk_dogs(walk_id);
CREATE INDEX idx_walk_dogs_dog_id ON public.walk_dogs(dog_id);

-- Enable RLS
ALTER TABLE public.walk_dogs ENABLE ROW LEVEL SECURITY;

-- Deny anonymous access
CREATE POLICY "Deny anonymous access to walk_dogs"
ON public.walk_dogs
AS RESTRICTIVE
FOR ALL
USING (false)
WITH CHECK (false);

-- Users can view walk_dogs for their own walks
CREATE POLICY "Users can view own walk_dogs"
ON public.walk_dogs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM walks
    WHERE walks.id = walk_dogs.walk_id
    AND walks.user_id = auth.uid()
  )
);

-- Users can create walk_dogs for their own walks
CREATE POLICY "Users can create own walk_dogs"
ON public.walk_dogs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM walks
    WHERE walks.id = walk_dogs.walk_id
    AND walks.user_id = auth.uid()
  )
);

-- Users can delete walk_dogs for their own walks
CREATE POLICY "Users can delete own walk_dogs"
ON public.walk_dogs
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM walks
    WHERE walks.id = walk_dogs.walk_id
    AND walks.user_id = auth.uid()
  )
);

-- Owners can view walk_dogs for walks with their dogs
CREATE POLICY "Owners can view walk_dogs for their dogs"
ON public.walk_dogs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM walks w
    JOIN dogs d ON d.id = walk_dogs.dog_id
    WHERE w.id = walk_dogs.walk_id
    AND d.user_id = auth.uid()
  )
);

-- Walkers can view walk_dogs for shared dogs
CREATE POLICY "Walkers can view walk_dogs for shared dogs"
ON public.walk_dogs
FOR SELECT
USING (
  has_walker_access(walk_dogs.dog_id, auth.uid())
);

-- Walkers can create walk_dogs for shared dogs
CREATE POLICY "Walkers can create walk_dogs for shared dogs"
ON public.walk_dogs
FOR INSERT
WITH CHECK (
  has_walker_access(walk_dogs.dog_id, auth.uid())
);