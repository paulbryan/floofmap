import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Play, Sparkles, MapPin, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-16">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-warm-glow" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      
      {/* Floating decorative elements */}
      <motion.div
        className="absolute top-1/4 left-[10%] hidden lg:block"
        animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-hero shadow-glow flex items-center justify-center">
          <MapPin className="w-8 h-8 text-primary-foreground" />
        </div>
      </motion.div>
      
      <motion.div
        className="absolute top-1/3 right-[15%] hidden lg:block"
        animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <div className="w-14 h-14 rounded-xl bg-gradient-forest shadow-lg flex items-center justify-center">
          <Activity className="w-7 h-7 text-secondary-foreground" />
        </div>
      </motion.div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-card mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              AI-Powered Dog Walk Tracking
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6"
          >
            Every Sniff Tells a{" "}
            <span className="text-gradient-primary">Story</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            The first app that truly understands your dog's walks. Track routes, 
            discover sniff hotspots, and find dog-friendly amenities—all powered by AI.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="xl" variant="hero" asChild>
              <Link to="/auth?mode=signup">
                Start Free
                <Sparkles className="w-5 h-5" />
              </Link>
            </Button>
            <Button size="xl" variant="glass" asChild>
              <Link to="/demo">
                <Play className="w-5 h-5" />
                View Demo Walk
              </Link>
            </Button>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-8 text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-bold"
                  >
                    🐕
                  </div>
                ))}
              </div>
              <span className="text-sm font-medium">10K+ happy pups</span>
            </div>
            <div className="hidden sm:block w-px h-6 bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <span className="text-sm font-medium">4.9 rating on App Store</span>
            </div>
          </motion.div>
        </div>

        {/* Hero Image/Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-16 md:mt-20 max-w-5xl mx-auto"
        >
          <div className="relative">
            {/* Phone mockup frame */}
            <div className="relative mx-auto max-w-sm">
              <div className="aspect-[9/16] rounded-[2.5rem] bg-card border-4 border-foreground/10 shadow-2xl overflow-hidden">
                {/* App Preview Content */}
                <div className="h-full w-full bg-gradient-sunset p-4 flex flex-col">
                  {/* Status bar mock */}
                  <div className="flex justify-between text-xs text-muted-foreground mb-4">
                    <span>9:41</span>
                    <div className="flex gap-1">
                      <span>📶</span>
                      <span>🔋</span>
                    </div>
                  </div>
                  
                  {/* Map preview */}
                  <div className="flex-1 rounded-2xl bg-forest-100 relative overflow-hidden">
                    {/* Simplified map illustration */}
                    <div className="absolute inset-0 opacity-30">
                      <svg viewBox="0 0 200 300" className="w-full h-full">
                        <path d="M20,50 Q60,30 100,60 T180,40" stroke="hsl(var(--forest-300))" strokeWidth="2" fill="none"/>
                        <path d="M10,100 Q50,80 90,110 T170,90" stroke="hsl(var(--forest-300))" strokeWidth="2" fill="none"/>
                        <path d="M30,150 Q70,130 110,160 T190,140" stroke="hsl(var(--forest-300))" strokeWidth="2" fill="none"/>
                        <path d="M0,200 Q40,180 80,210 T160,190" stroke="hsl(var(--forest-300))" strokeWidth="2" fill="none"/>
                        <path d="M20,250 Q60,230 100,260 T180,240" stroke="hsl(var(--forest-300))" strokeWidth="2" fill="none"/>
                      </svg>
                    </div>
                    
                    {/* Walk route line */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 160">
                      <path
                        d="M20,140 Q30,120 25,100 T40,70 Q55,50 50,30 T70,20"
                        stroke="hsl(var(--primary))"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray="150"
                        strokeDashoffset="150"
                        className="animate-[dash_2s_ease-in-out_forwards]"
                      />
                    </svg>
                    
                    {/* Sniff markers */}
                    <motion.div
                      className="absolute top-[35%] left-[25%] w-6 h-6 rounded-full bg-primary shadow-glow flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8 }}
                    >
                      <span className="text-xs">🐾</span>
                    </motion.div>
                    <motion.div
                      className="absolute top-[55%] left-[40%] w-6 h-6 rounded-full bg-primary shadow-glow flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1 }}
                    >
                      <span className="text-xs">🐾</span>
                    </motion.div>
                    <motion.div
                      className="absolute top-[75%] left-[22%] w-6 h-6 rounded-full bg-primary shadow-glow flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.2 }}
                    >
                      <span className="text-xs">🐾</span>
                    </motion.div>
                    
                    {/* Water icon */}
                    <motion.div
                      className="absolute top-[45%] right-[20%] w-7 h-7 rounded-full bg-accent shadow-md flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.4 }}
                    >
                      <span className="text-xs">💧</span>
                    </motion.div>
                    
                    {/* Bin icon */}
                    <motion.div
                      className="absolute bottom-[25%] right-[30%] w-6 h-6 rounded-full bg-forest-500 shadow-md flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.6 }}
                    >
                      <span className="text-xs">🗑️</span>
                    </motion.div>
                  </div>
                  
                  {/* Stats bar */}
                  <div className="mt-4 p-3 rounded-xl bg-card shadow-card">
                    <div className="flex justify-between items-center text-sm">
                      <div className="text-center">
                        <div className="font-bold text-foreground">2.4km</div>
                        <div className="text-xs text-muted-foreground">Distance</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-foreground">32min</div>
                        <div className="text-xs text-muted-foreground">Duration</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-primary">12</div>
                        <div className="text-xs text-muted-foreground">Sniffs</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-foreground/10 rounded-b-2xl" />
            </div>
            
            {/* Decorative cards around phone */}
            <motion.div
              className="hidden md:block absolute -left-16 top-1/4 p-4 rounded-xl bg-card shadow-card border border-border max-w-[180px]"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm">🐾</span>
                </div>
                <span className="text-sm font-semibold">Sniff Detected</span>
              </div>
              <p className="text-xs text-muted-foreground">High turning + slow pace indicates sniffing behavior</p>
            </motion.div>
            
            <motion.div
              className="hidden md:block absolute -right-16 top-1/3 p-4 rounded-xl bg-card shadow-card border border-border max-w-[180px]"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <span className="text-sm">💧</span>
                </div>
                <span className="text-sm font-semibold">Water Nearby</span>
              </div>
              <p className="text-xs text-muted-foreground">Dog water fountain 50m ahead on your route</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
      
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
