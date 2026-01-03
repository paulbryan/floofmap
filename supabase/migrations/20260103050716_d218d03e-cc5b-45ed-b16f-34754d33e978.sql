
-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create dogs table
CREATE TABLE public.dogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  breed TEXT,
  birthday DATE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create walks table
CREATE TABLE public.walks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dog_id UUID REFERENCES public.dogs(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  distance_m REAL DEFAULT 0,
  duration_s INTEGER DEFAULT 0,
  sniff_time_s INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create track_points table
CREATE TABLE public.track_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  walk_id UUID NOT NULL REFERENCES public.walks(id) ON DELETE CASCADE,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  lat DOUBLE PRECISION NOT NULL,
  lon DOUBLE PRECISION NOT NULL,
  accuracy_m REAL,
  speed_mps REAL
);

-- Create stop_events table
CREATE TABLE public.stop_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  walk_id UUID NOT NULL REFERENCES public.walks(id) ON DELETE CASCADE,
  ts_start TIMESTAMPTZ NOT NULL,
  ts_end TIMESTAMPTZ NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lon DOUBLE PRECISION NOT NULL,
  radius_m REAL,
  score REAL,
  label TEXT DEFAULT 'sniff',
  confidence REAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create poi_cache table
CREATE TABLE public.poi_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bbox_hash TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  data_json JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create community_pins table (with blurred locations for privacy)
CREATE TABLE public.community_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('bag_dispenser', 'barking_zone', 'water', 'bin')),
  lat_blurred DOUBLE PRECISION NOT NULL,
  lon_blurred DOUBLE PRECISION NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  votes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'reported', 'removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.walks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stop_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poi_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_pins ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Dogs policies
CREATE POLICY "Users can view own dogs" ON public.dogs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own dogs" ON public.dogs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own dogs" ON public.dogs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own dogs" ON public.dogs FOR DELETE USING (auth.uid() = user_id);

-- Walks policies
CREATE POLICY "Users can view own walks" ON public.walks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own walks" ON public.walks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own walks" ON public.walks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own walks" ON public.walks FOR DELETE USING (auth.uid() = user_id);

-- Track points policies (via walk ownership)
CREATE POLICY "Users can view own track points" ON public.track_points FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.walks WHERE walks.id = track_points.walk_id AND walks.user_id = auth.uid()));
CREATE POLICY "Users can create track points for own walks" ON public.track_points FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.walks WHERE walks.id = track_points.walk_id AND walks.user_id = auth.uid()));
CREATE POLICY "Users can delete own track points" ON public.track_points FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.walks WHERE walks.id = track_points.walk_id AND walks.user_id = auth.uid()));

-- Stop events policies (via walk ownership)
CREATE POLICY "Users can view own stop events" ON public.stop_events FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.walks WHERE walks.id = stop_events.walk_id AND walks.user_id = auth.uid()));
CREATE POLICY "Users can create stop events for own walks" ON public.stop_events FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.walks WHERE walks.id = stop_events.walk_id AND walks.user_id = auth.uid()));
CREATE POLICY "Users can update own stop events" ON public.stop_events FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.walks WHERE walks.id = stop_events.walk_id AND walks.user_id = auth.uid()));
CREATE POLICY "Users can delete own stop events" ON public.stop_events FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.walks WHERE walks.id = stop_events.walk_id AND walks.user_id = auth.uid()));

-- POI cache is public read, no write from client
CREATE POLICY "Anyone can read POI cache" ON public.poi_cache FOR SELECT USING (true);

-- Community pins policies
CREATE POLICY "Anyone can view active pins" ON public.community_pins FOR SELECT USING (status = 'active');
CREATE POLICY "Authenticated users can create pins" ON public.community_pins FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);
CREATE POLICY "Users can update own pins" ON public.community_pins FOR UPDATE 
  USING (auth.uid() = created_by);

-- Create function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dogs_updated_at BEFORE UPDATE ON public.dogs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_walks_user_id ON public.walks(user_id);
CREATE INDEX idx_walks_dog_id ON public.walks(dog_id);
CREATE INDEX idx_track_points_walk_id ON public.track_points(walk_id);
CREATE INDEX idx_stop_events_walk_id ON public.stop_events(walk_id);
CREATE INDEX idx_community_pins_type ON public.community_pins(type);
CREATE INDEX idx_poi_cache_bbox ON public.poi_cache(bbox_hash);
