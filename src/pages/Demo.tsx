import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Play, MapPin, Timer, Route, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Demo walk data
const demoWalk = {
  date: "January 3, 2026",
  distance: 2.4,
  duration: 32,
  sniffs: 12,
  sniffTime: 8.5, // minutes
  route: [
    { lat: 51.505, lon: -0.09, time: 0 },
    { lat: 51.506, lon: -0.091, time: 2 },
    { lat: 51.508, lon: -0.093, time: 5 },
    { lat: 51.51, lon: -0.095, time: 10 },
    { lat: 51.512, lon: -0.098, time: 15 },
    { lat: 51.514, lon: -0.1, time: 20 },
    { lat: 51.515, lon: -0.097, time: 25 },
    { lat: 51.513, lon: -0.094, time: 30 },
    { lat: 51.51, lon: -0.092, time: 32 },
  ],
  sniffStops: [
    { lat: 51.506, lon: -0.091, duration: 45, label: "Sniff", time: 2 },
    { lat: 51.508, lon: -0.093, duration: 30, label: "Sniff", time: 5 },
    { lat: 51.51, lon: -0.095, duration: 60, label: "Pee", time: 10 },
    { lat: 51.512, lon: -0.098, duration: 25, label: "Sniff", time: 15 },
    { lat: 51.514, lon: -0.1, duration: 40, label: "Sniff", time: 20 },
    { lat: 51.515, lon: -0.097, duration: 90, label: "Poop", time: 25 },
    { lat: 51.513, lon: -0.094, duration: 20, label: "Sniff", time: 30 },
  ],
  pois: [
    { type: "water", name: "Dog Water Fountain", lat: 51.509, lon: -0.094 },
    { type: "bin", name: "Waste Bin", lat: 51.513, lon: -0.096 },
    { type: "bin", name: "Waste Bin", lat: 51.507, lon: -0.092 },
  ],
};

const Demo = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
            <span className="text-sm font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
              Demo Walk
            </span>
            <Button variant="hero" size="sm" asChild>
              <Link to="/auth?mode=signup">
                Sign Up Free
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Map visualization */}
      <div className="h-[50vh] bg-forest-100 relative mt-16 overflow-hidden">
        {/* Simplified map with walk route */}
        <div className="absolute inset-0">
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-20">
            <svg className="w-full h-full">
              <defs>
                <pattern id="demoGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#demoGrid)" />
            </svg>
          </div>

          {/* Walk path */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            {/* Route line */}
            <motion.path
              d="M20,85 Q25,75 30,65 T45,50 Q55,40 60,35 T70,25 Q75,30 72,40 T60,55 Q50,60 45,65"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 3, ease: "easeInOut" }}
            />
          </svg>

          {/* Sniff markers with staggered animation */}
          {[
            { top: "70%", left: "25%", delay: 0.5, label: "🐾" },
            { top: "55%", left: "35%", delay: 1 },
            { top: "42%", left: "48%", delay: 1.5, label: "💧" },
            { top: "30%", left: "58%", delay: 2 },
            { top: "22%", left: "68%", delay: 2.5 },
            { top: "35%", left: "72%", delay: 3, label: "💩" },
            { top: "52%", left: "60%", delay: 3.5 },
          ].map((marker, i) => (
            <motion.div
              key={i}
              className="absolute w-8 h-8 rounded-full bg-primary shadow-glow flex items-center justify-center"
              style={{ top: marker.top, left: marker.left }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: marker.delay, duration: 0.3 }}
            >
              <span className="text-sm">{marker.label || "🐾"}</span>
            </motion.div>
          ))}

          {/* POI markers */}
          <motion.div
            className="absolute top-[45%] left-[42%] w-8 h-8 rounded-full bg-accent shadow-lg flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.2 }}
          >
            <span className="text-sm">💧</span>
          </motion.div>
          
          <motion.div
            className="absolute top-[38%] left-[70%] w-7 h-7 rounded-full bg-forest-500 shadow-lg flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 2.8 }}
          >
            <span className="text-xs">🗑️</span>
          </motion.div>
        </div>

        {/* Legend overlay */}
        <div className="absolute bottom-4 left-4 right-4 bg-card/95 backdrop-blur rounded-xl shadow-card p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span>Sniff Stop</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-accent" />
                <span>Water</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-forest-500" />
                <span>Bin</span>
              </div>
            </div>
            <span className="text-muted-foreground">{demoWalk.sniffs} sniffs detected</span>
          </div>
        </div>
      </div>

      {/* Walk details */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-card border-t border-border rounded-t-3xl -mt-6 relative z-10 shadow-xl"
      >
        <div className="p-6">
          {/* Date header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">Morning Walk</h2>
              <p className="text-sm text-muted-foreground">{demoWalk.date}</p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center text-2xl">
              🐕
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="bg-muted rounded-xl p-3 text-center">
              <Route className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="font-bold">{demoWalk.distance}km</p>
              <p className="text-xs text-muted-foreground">Distance</p>
            </div>
            <div className="bg-muted rounded-xl p-3 text-center">
              <Timer className="w-5 h-5 mx-auto mb-1 text-secondary" />
              <p className="font-bold">{demoWalk.duration}min</p>
              <p className="text-xs text-muted-foreground">Duration</p>
            </div>
            <div className="bg-muted rounded-xl p-3 text-center">
              <MapPin className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="font-bold">{demoWalk.sniffs}</p>
              <p className="text-xs text-muted-foreground">Sniffs</p>
            </div>
            <div className="bg-muted rounded-xl p-3 text-center">
              <span className="text-lg">🐾</span>
              <p className="font-bold">{Math.round((demoWalk.sniffTime / demoWalk.duration) * 100)}%</p>
              <p className="text-xs text-muted-foreground">Sniff Time</p>
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-primary/5 rounded-xl p-4 mb-6 border border-primary/20">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <span>🧠</span> AI Insights
            </h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Your dog spent extra time near the park entrance - a popular sniff spot!
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Detected 7 sniffs, 1 pee break, and 1 poop stop based on movement patterns.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Water fountain available 50m into your route - marked for future reference.
              </li>
            </ul>
          </div>

          {/* Sniff stops list */}
          <h3 className="font-semibold mb-3">Sniff Stops</h3>
          <div className="space-y-2 mb-6">
            {demoWalk.sniffStops.slice(0, 4).map((stop, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  stop.label === "Poop" ? "bg-amber-100" :
                  stop.label === "Pee" ? "bg-sky-100" :
                  "bg-primary/10"
                }`}>
                  <span className="text-lg">
                    {stop.label === "Poop" ? "💩" : stop.label === "Pee" ? "💧" : "🐾"}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">{stop.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {stop.duration}s • {stop.time} min into walk
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <Button variant="hero" size="lg" className="w-full" asChild>
            <Link to="/auth?mode=signup">
              <Play className="w-5 h-5" />
              Start Tracking Your Walks
            </Link>
          </Button>
          
          <p className="text-center text-xs text-muted-foreground mt-3">
            Free forever • No credit card required
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Demo;
