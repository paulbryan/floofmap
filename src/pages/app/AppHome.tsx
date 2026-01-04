import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, MapPin, TrendingUp, Calendar, ChevronRight, PlusCircle, Flame, Cloud, Sun, CloudRain, CloudSnow, CloudLightning, CloudFog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, startOfDay, subDays, isEqual, isBefore } from "date-fns";

// Time-based greeting
const getGreeting = (): { text: string; emoji: string } => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: "Good morning", emoji: "🌅" };
  if (hour >= 12 && hour < 17) return { text: "Good afternoon", emoji: "☀️" };
  if (hour >= 17 && hour < 21) return { text: "Good evening", emoji: "🌇" };
  return { text: "Good night", emoji: "🌙" };
};

// Weather icon mapping
const getWeatherIcon = (main: string) => {
  switch (main.toLowerCase()) {
    case 'clear': return <Sun className="w-4 h-4" />;
    case 'clouds': return <Cloud className="w-4 h-4" />;
    case 'rain':
    case 'drizzle': return <CloudRain className="w-4 h-4" />;
    case 'snow': return <CloudSnow className="w-4 h-4" />;
    case 'thunderstorm': return <CloudLightning className="w-4 h-4" />;
    case 'mist':
    case 'fog':
    case 'haze': return <CloudFog className="w-4 h-4" />;
    default: return <Sun className="w-4 h-4" />;
  }
};

interface WeatherData {
  temp: number;
  description: string;
  main: string;
}

interface WalkBase {
  id: string;
  started_at: string;
  distance_m: number | null;
  duration_s: number | null;
  sniff_time_s: number | null;
}

interface Walk extends WalkBase {
  dogs: {
    id: string;
    name: string;
    avatar_url: string | null;
  } | null;
}

interface Stats {
  totalWalks: number;
  totalDistance: string;
  avgSniffs: number;
  streak: number;
  walkedToday: boolean;
}

// Calculate consecutive days streak from walk dates
const calculateStreak = (walks: WalkBase[]): { streak: number; walkedToday: boolean } => {
  if (walks.length === 0) return { streak: 0, walkedToday: false };

  const walkDays = new Set<string>();
  walks.forEach(walk => {
    const day = startOfDay(new Date(walk.started_at)).toISOString();
    walkDays.add(day);
  });

  const sortedDays = Array.from(walkDays)
    .map(d => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  if (sortedDays.length === 0) return { streak: 0, walkedToday: false };

  const today = startOfDay(new Date());
  const yesterday = startOfDay(subDays(new Date(), 1));
  const mostRecentWalkDay = sortedDays[0];
  const walkedToday = isEqual(mostRecentWalkDay, today);

  if (!isEqual(mostRecentWalkDay, today) && !isEqual(mostRecentWalkDay, yesterday)) {
    return { streak: 0, walkedToday: false };
  }

  let streak = 1;
  let checkDay = mostRecentWalkDay;

  for (let i = 1; i < sortedDays.length; i++) {
    const expectedPrevDay = startOfDay(subDays(checkDay, 1));
    if (isEqual(sortedDays[i], expectedPrevDay)) {
      streak++;
      checkDay = sortedDays[i];
    } else if (isBefore(sortedDays[i], expectedPrevDay)) {
      break;
    }
  }

  return { streak, walkedToday };
};

const AppHome = () => {
  const [userName, setUserName] = useState("");
  const [recentWalks, setRecentWalks] = useState<Walk[]>([]);
  const [hasDogs, setHasDogs] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalWalks: 0,
    totalDistance: "0 km",
    avgSniffs: 0,
    streak: 0,
    walkedToday: false,
  });
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const greeting = getGreeting();
  const navigate = useNavigate();

  // Fetch weather using GPS or cached location
  const fetchWeather = async (cachedLat?: number | null, cachedLon?: number | null) => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const { data, error } = await supabase.functions.invoke('get-weather', {
              body: { lat: latitude, lon: longitude, updateCache: true },
            });
            if (!error && data) {
              setWeather(data);
            }
          },
          async () => {
            // GPS failed, use cached location if available
            if (cachedLat && cachedLon) {
              const { data, error } = await supabase.functions.invoke('get-weather', {
                body: { lat: cachedLat, lon: cachedLon, updateCache: false },
              });
              if (!error && data) {
                setWeather(data);
              }
            }
          },
          { timeout: 5000, maximumAge: 300000 }
        );
      } else if (cachedLat && cachedLon) {
        const { data, error } = await supabase.functions.invoke('get-weather', {
          body: { lat: cachedLat, lon: cachedLon, updateCache: false },
        });
        if (!error && data) {
          setWeather(data);
        }
      }
    } catch (err) {
      console.error('Weather fetch error:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileResult, walksResult, allWalksResult, dogsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, cached_lat, cached_lon")
          .eq("id", user.id)
          .single(),
        supabase
          .from("walks")
          .select("id, started_at, distance_m, duration_s, sniff_time_s, dogs(id, name, avatar_url)")
          .eq("user_id", user.id)
          .order("started_at", { ascending: false })
          .limit(5),
        supabase
          .from("walks")
          .select("id, started_at, distance_m, duration_s, sniff_time_s")
          .eq("user_id", user.id)
          .order("started_at", { ascending: false })
          .limit(100),
        supabase
          .from("dogs")
          .select("id")
          .eq("user_id", user.id)
          .limit(1)
      ]);

      const displayName = profileResult.data?.full_name || user.email?.split("@")[0] || "";
      setUserName(displayName);

      // Fetch weather with cached location from profile
      const cachedLat = profileResult.data?.cached_lat;
      const cachedLon = profileResult.data?.cached_lon;
      fetchWeather(cachedLat, cachedLon);

      const walks = walksResult.data;
      const allWalks = allWalksResult.data || [];
      setHasDogs((dogsResult.data?.length ?? 0) > 0);

      if (walks) {
        setRecentWalks(walks);

        const totalDistance = allWalks.reduce((sum, w) => sum + (w.distance_m || 0), 0);
        const totalSniffTime = allWalks.reduce((sum, w) => sum + (w.sniff_time_s || 0), 0);
        const avgSniffs = allWalks.length > 0 ? Math.round(totalSniffTime / allWalks.length / 60) : 0;
        const { streak, walkedToday } = calculateStreak(allWalks);

        setStats({
          totalWalks: allWalks.length,
          totalDistance: totalDistance >= 1000 
            ? `${(totalDistance / 1000).toFixed(1)} km` 
            : `${Math.round(totalDistance)} m`,
          avgSniffs: avgSniffs,
          streak,
          walkedToday,
        });
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const formatWalkDate = (dateStr: string) => {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  };

  const formatDistance = (meters: number | null) => {
    if (!meters) return "0 m";
    return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0 min";
    const mins = Math.round(seconds / 60);
    return `${mins} min`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-amber-500/10 to-background px-4 lg:px-8 pt-8 lg:pt-12 pb-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-6"
          >
            <div>
              <p className="text-muted-foreground text-sm flex items-center gap-2">
                {greeting.text} {greeting.emoji}
                {weather && (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    • {getWeatherIcon(weather.main)} {weather.temp}°C
                  </span>
                )}
              </p>
              <h1 className="text-2xl lg:text-3xl font-bold">Hi, {userName || "there"}!</h1>
            </div>
            <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-muted flex items-center justify-center text-2xl lg:text-3xl">
              🐕
            </div>
          </motion.div>

          {/* Start Walk Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Button variant="hero" size="lg" className="w-full sm:w-auto" asChild>
              <Link to="/app/record">
                <Play className="w-5 h-5" />
                Start Walk
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Stats Grid - only show if there are walks */}
      {recentWalks.length > 0 && (
        <div className="px-4 lg:px-8 py-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Your Stats
            </h2>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <div className="bg-card rounded-xl p-4 lg:p-6 border border-border">
                <p className="text-2xl lg:text-3xl font-bold text-primary">{stats.totalWalks}</p>
                <p className="text-sm text-muted-foreground">Total Walks</p>
              </div>
              <div className="bg-card rounded-xl p-4 lg:p-6 border border-border">
                <p className="text-2xl lg:text-3xl font-bold text-secondary">{stats.totalDistance}</p>
                <p className="text-sm text-muted-foreground">Distance</p>
              </div>
              <div className="bg-card rounded-xl p-4 lg:p-6 border border-border">
                <p className="text-2xl lg:text-3xl font-bold text-accent">{stats.avgSniffs}</p>
                <p className="text-sm text-muted-foreground">Avg Sniffs/Walk</p>
              </div>
              <div className="bg-card rounded-xl p-4 lg:p-6 border border-border relative overflow-hidden">
                {stats.streak > 0 && (
                  <div className="absolute -right-2 -top-2 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-full blur-xl" />
                )}
                <div className="relative flex items-center gap-2">
                  <p className="text-2xl lg:text-3xl font-bold text-amber-500">{stats.streak}</p>
                  <Flame className={`w-6 h-6 ${stats.streak > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
                </div>
                <p className="text-sm text-muted-foreground relative">Day Streak</p>
                {stats.streak > 0 && !stats.walkedToday && (
                  <p className="text-xs text-amber-600 mt-1">Walk today to keep it!</p>
                )}
                {stats.walkedToday && stats.streak > 0 && (
                  <p className="text-xs text-green-600 mt-1">✓ Walked today</p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Welcome Section for New Users */}
      {recentWalks.length === 0 && !loading && (
        <div className="px-4 lg:px-8 py-6">
          <div className="max-w-6xl mx-auto space-y-4">
            {!hasDogs && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 rounded-xl border border-amber-500/20 p-4 lg:p-5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-2xl shrink-0">
                    🐕
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm lg:text-base">Add your furry friend</h3>
                    <p className="text-xs lg:text-sm text-muted-foreground">
                      Set up your dog&apos;s profile to track their walks
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0" asChild>
                    <Link to="/app/dogs">
                      <PlusCircle className="w-4 h-4 mr-1" />
                      Add Dog
                    </Link>
                  </Button>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-primary/5 via-amber-500/5 to-secondary/5 rounded-2xl border border-border p-6 lg:p-8"
            >
              <div className="text-center max-w-lg mx-auto">
                <div className="text-5xl mb-4">🐾</div>
                <h2 className="text-xl lg:text-2xl font-bold mb-2">Welcome to Floof Map!</h2>
                <p className="text-muted-foreground mb-6">
                  Track your dog walks, discover sniff-worthy spots, and explore dog-friendly places in your neighborhood.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <Play className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-sm font-medium">Record Walks</p>
                    <p className="text-xs text-muted-foreground">Track routes & sniff stops</p>
                  </div>
                  <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-2">
                      <MapPin className="w-5 h-5 text-secondary" />
                    </div>
                    <p className="text-sm font-medium">Discover POIs</p>
                    <p className="text-xs text-muted-foreground">Parks, water & more</p>
                  </div>
                  <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-2">
                      <TrendingUp className="w-5 h-5 text-amber-500" />
                    </div>
                    <p className="text-sm font-medium">Track Stats</p>
                    <p className="text-xs text-muted-foreground">Distance & sniff time</p>
                  </div>
                </div>

                <Button variant="hero" size="lg" asChild>
                  <Link to="/app/record">
                    <Play className="w-5 h-5" />
                    Start Your First Walk
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Recent Walks */}
      {recentWalks.length > 0 && (
        <div className="px-4 lg:px-8 pb-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Recent Walks
              </h2>
              <Link
                to="/app/explore"
                className="text-sm text-primary font-medium flex items-center gap-1"
              >
                View all
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              {recentWalks.map((walk, index) => (
                <motion.div
                  key={walk.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="bg-card rounded-xl p-4 border border-border flex items-center gap-4 hover:shadow-card transition-shadow cursor-pointer"
                  onClick={() => navigate(`/app/walk/${walk.id}`)}
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center overflow-hidden shrink-0">
                    {walk.dogs?.avatar_url ? (
                      <img src={walk.dogs.avatar_url} alt={walk.dogs.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">🐕</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{formatWalkDate(walk.started_at)}</p>
                      {walk.dogs && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full truncate">
                          {walk.dogs.name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDistance(walk.distance_m)} • {formatDuration(walk.duration_s)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-primary">{Math.round((walk.sniff_time_s || 0) / 60)}</p>
                    <p className="text-xs text-muted-foreground">sniff min</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppHome;