-- Add location caching columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cached_lat double precision,
ADD COLUMN IF NOT EXISTS cached_lon double precision,
ADD COLUMN IF NOT EXISTS location_updated_at timestamp with time zone;