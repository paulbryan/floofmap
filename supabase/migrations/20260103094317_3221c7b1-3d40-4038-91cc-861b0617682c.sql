-- Create a function to blur coordinates to ~50m grid (matching existing privacy-first design)
-- This snaps coordinates to a grid, hiding precise start/end locations
CREATE OR REPLACE FUNCTION public.blur_coordinate(coord double precision)
RETURNS double precision
LANGUAGE sql
IMMUTABLE
AS $$
  -- Round to ~50m precision (0.0005 degrees ≈ 55m at equator)
  SELECT round(coord / 0.0005) * 0.0005
$$;

-- Create a secure function for walkers to get track points with blurred start/end locations
-- Owners always see full precision; walkers see blurred first 3 and last 3 points
CREATE OR REPLACE FUNCTION public.get_walk_track_points(p_walk_id uuid)
RETURNS TABLE (
  id uuid,
  walk_id uuid,
  ts timestamptz,
  lat double precision,
  lon double precision,
  accuracy_m real,
  speed_mps real
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_walk_user_id uuid;
  v_walk_dog_id uuid;
  v_is_owner boolean;
  v_total_points integer;
BEGIN
  -- Get walk details
  SELECT w.user_id, w.dog_id INTO v_walk_user_id, v_walk_dog_id
  FROM public.walks w
  WHERE w.id = p_walk_id;
  
  -- Check if current user is the walk owner or dog owner
  v_is_owner := (v_walk_user_id = auth.uid()) 
                OR (v_walk_dog_id IS NOT NULL AND owns_dog(v_walk_dog_id, auth.uid()));
  
  -- Verify access: must be owner or authorized walker
  IF NOT v_is_owner AND NOT (v_walk_dog_id IS NOT NULL AND has_walker_access(v_walk_dog_id, auth.uid())) THEN
    RETURN; -- No access, return empty
  END IF;
  
  -- Owners get full precision
  IF v_is_owner THEN
    RETURN QUERY
    SELECT tp.id, tp.walk_id, tp.ts, tp.lat, tp.lon, tp.accuracy_m, tp.speed_mps
    FROM public.track_points tp
    WHERE tp.walk_id = p_walk_id
    ORDER BY tp.ts;
    RETURN;
  END IF;
  
  -- Walkers get blurred first/last 3 points
  SELECT COUNT(*) INTO v_total_points
  FROM public.track_points tp
  WHERE tp.walk_id = p_walk_id;
  
  RETURN QUERY
  WITH numbered_points AS (
    SELECT 
      tp.id, tp.walk_id, tp.ts, tp.lat, tp.lon, tp.accuracy_m, tp.speed_mps,
      ROW_NUMBER() OVER (ORDER BY tp.ts) as row_num
    FROM public.track_points tp
    WHERE tp.walk_id = p_walk_id
  )
  SELECT 
    np.id,
    np.walk_id,
    np.ts,
    CASE 
      WHEN np.row_num <= 3 OR np.row_num > v_total_points - 3 
      THEN blur_coordinate(np.lat)
      ELSE np.lat
    END as lat,
    CASE 
      WHEN np.row_num <= 3 OR np.row_num > v_total_points - 3 
      THEN blur_coordinate(np.lon)
      ELSE np.lon
    END as lon,
    np.accuracy_m,
    np.speed_mps
  FROM numbered_points np
  ORDER BY np.ts;
END;
$$;