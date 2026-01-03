-- Add DELETE policy for community_pins so users can delete their own pins
CREATE POLICY "Users can delete own pins"
ON public.community_pins
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);