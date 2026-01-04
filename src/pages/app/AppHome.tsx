import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, MapPin, TrendingUp, Calendar, Dog, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const AppHome = () => {
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserName(user.email.split("@")[0]);
      }
    };
    getUser();
  }, []);

  // Mock data for demo
  const recentWalks = [
    { id: 1, date: "Today", distance: "2.4 km", duration: "32 min", sniffs: 12 },
    { id: 2, date: "Yesterday", distance: "1.8 km", duration: "25 min", sniffs: 8 },
    { id: 3, date: "2 days ago", distance: "3.1 km", duration: "45 min", sniffs: 15 },
  ];

  const stats = {
    totalWalks: 47,
    totalDistance: "89.5 km",
    avgSniffs: 11,
    streak: 5,
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

      {/* Stats Grid */}
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

      {/* Recent Walks */}
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
                onClick={() => {/* In production, navigate to /app/walk/{walkId} */}}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{walk.date}</p>
                  <p className="text-sm text-muted-foreground">
                    {walk.distance} • {walk.duration}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">{walk.sniffs}</p>
                  <p className="text-xs text-muted-foreground">sniffs</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AppHome;
