import { motion } from "framer-motion";
import { Brain, Sparkles, TrendingUp, Eye } from "lucide-react";

const AISection = () => {
  return (
    <section className="py-20 md:py-32 bg-gradient-sunset relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-background to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
              <Brain className="w-4 h-4" />
              AI-Powered
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              AI That Understands{" "}
              <span className="text-gradient-primary">Dog Behavior</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              SniffMap doesn't just track where you go—it understands what your dog does. 
              Our AI analyzes movement patterns to detect sniffing, waiting, and bathroom breaks, 
              giving you insights no other app can.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Eye className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Pattern Recognition</h4>
                  <p className="text-sm text-muted-foreground">
                    Detects slow speed + high turning = sniffing behavior
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Personalized Learning</h4>
                  <p className="text-sm text-muted-foreground">
                    The more you label, the smarter it gets for your specific dog
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Transparent Explanations</h4>
                  <p className="text-sm text-muted-foreground">
                    Always know why something was marked—no black box AI
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <div className="relative aspect-square max-w-md mx-auto">
              {/* Central brain icon */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-3xl bg-gradient-hero shadow-glow flex items-center justify-center z-10">
                <Brain className="w-16 h-16 text-primary-foreground" />
              </div>
              
              {/* Orbiting elements */}
              <motion.div
                className="absolute w-full h-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 rounded-xl bg-card shadow-card flex items-center justify-center">
                  <span className="text-2xl">🐾</span>
                </div>
              </motion.div>
              
              <motion.div
                className="absolute w-full h-full"
                animate={{ rotate: -360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              >
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-14 rounded-xl bg-card shadow-card flex items-center justify-center">
                  <span className="text-xl">📍</span>
                </div>
              </motion.div>
              
              <motion.div
                className="absolute w-full h-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              >
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-14 h-14 rounded-xl bg-card shadow-card flex items-center justify-center">
                  <span className="text-xl">⏱️</span>
                </div>
              </motion.div>
              
              <motion.div
                className="absolute w-full h-full"
                animate={{ rotate: -360 }}
                transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
              >
                <div className="absolute top-1/2 right-0 -translate-y-1/2 w-14 h-14 rounded-xl bg-card shadow-card flex items-center justify-center">
                  <span className="text-xl">🔄</span>
                </div>
              </motion.div>
              
              {/* Dotted circle */}
              <div className="absolute inset-8 rounded-full border-2 border-dashed border-primary/20" />
              <div className="absolute inset-16 rounded-full border-2 border-dashed border-secondary/20" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AISection;
