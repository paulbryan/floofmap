-- Fix search_path for blur_coordinate function
CREATE OR REPLACE FUNCTION public.blur_coordinate(coord double precision)
RETURNS double precision
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  -- Round to ~50m precision (0.0005 degrees ≈ 55m at equator)
  SELECT round(coord / 0.0005) * 0.0005
$$;