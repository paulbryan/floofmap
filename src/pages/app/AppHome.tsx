import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, MapPin, TrendingUp, Calendar, Dog, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface Walk {
  id: string;
  started_at: string;
  distance_m: number | null;
  duration_s: number | null;
  sniff_time_s: number | null;
}

interface Stats {
  totalWalks: number;
  totalDistance: string;
  avgSniffs: number;
  streak: number;
}

const AppHome = () => {
  const [userName, setUserName] = useState("");
  const [recentWalks, setRecentWalks] = useState<Walk[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalWalks: 0,
    totalDistance: "0 km",
    avgSniffs: 0,
    streak: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserName(user.email.split("@")[0]);
      }

      if (user) {
        // Fetch recent walks
        const { data: walks } = await supabase
          .from("walks")
          .select("id, started_at, distance_m, duration_s, sniff_time_s")
          .eq("user_id", user.id)
          .order("started_at", { ascending: false })
          .limit(5);

        if (walks) {
          setRecentWalks(walks);

          // Calculate stats
          const totalDistance = walks.reduce((sum, w) => sum + (w.distance_m || 0), 0);
          const totalSniffTime = walks.reduce((sum, w) => sum + (w.sniff_time_s || 0), 0);
          const avgSniffs = walks.length > 0 ? Math.round(totalSniffTime / walks.length / 60) : 0;

          setStats({
            totalWalks: walks.length,
            totalDistance: totalDistance >= 1000 
              ? `${(totalDistance / 1000).toFixed(1)} km` 
              : `${Math.round(totalDistance)} m`,
            avgSniffs: avgSniffs,
            streak: 0, // TODO: Calculate streak
          });
        }
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
              <p className="text-muted-foreground text-sm">Good morning 🌤️</p>
              <h1 className="text-2xl lg:text-3xl font-bold">Hi, {userName || "there"}!</h1>
            </div>
            <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-muted flex items-center justify-center text-2xl lg:text-3xl">
              🐕
            </div>
          </motion.div>

          {/* Quick Start Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl shadow-card border border-border p-6 lg:p-8"
          >
            <div className="flex items-center gap-4 lg:gap-6">
              <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
                <Dog className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg lg:text-xl">Ready for a walk?</h3>
                <p className="text-sm lg:text-base text-muted-foreground">
                  Start recording to track your adventure
                </p>
              </div>
              <Button variant="hero" size="lg" className="hidden lg:flex" asChild>
                <Link to="/app/record">
                  <Play className="w-5 h-5" />
                  Start Walk
                </Link>
              </Button>
            </div>
            <Button variant="hero" size="lg" className="w-full mt-4 lg:hidden" asChild>
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
              <div className="bg-card rounded-xl p-4 lg:p-6 border border-border">
                <p className="text-2xl lg:text-3xl font-bold text-amber-500">{stats.streak} 🔥</p>
                <p className="text-sm text-muted-foreground">Day Streak</p>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Welcome Section for New Users */}
      {recentWalks.length === 0 && !loading && (
        <div className="px-4 lg:px-8 py-6">
          <div className="max-w-6xl mx-auto">
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

      {/* Recent Walks - only show if there are walks */}
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
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{formatWalkDate(walk.started_at)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistance(walk.distance_m)} • {formatDuration(walk.duration_s)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">{Math.round((walk.sniff_time_s || 0) / 60)}</p>
                    <p className="text-xs text-muted-foreground">sniff min</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
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
