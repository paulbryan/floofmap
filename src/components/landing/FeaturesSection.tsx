import { motion } from "framer-motion";
import { MapPin, Brain, Droplets, Shield, Zap, Users } from "lucide-react";

const features = [
  {
    icon: MapPin,
    title: "GPS Walk Recording",
    description: "Track every walk with precision GPS. See your routes, distances, and pace in real-time.",
    color: "primary",
  },
  {
    icon: Brain,
    title: "AI Sniff Detection",
    description: "Our AI learns your dog's behavior to identify sniff stops, wait times, and bathroom breaks.",
    color: "secondary",
  },
  {
    icon: Droplets,
    title: "Find Dog-Friendly POIs",
    description: "Discover water fountains, waste bins, and bag dispensers along your walking routes.",
    color: "accent",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your data stays yours. Export anytime, delete instantly. Barking zones are always blurred.",
    color: "forest",
  },
  {
    icon: Zap,
    title: "Works Offline",
    description: "Keep recording even without signal. Your walks sync automatically when back online.",
    color: "amber",
  },
  {
    icon: Users,
    title: "Community Pins",
    description: "Contribute and discover crowd-sourced dog amenities added by fellow dog walkers.",
    color: "primary",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 md:py-32 bg-gradient-sunset relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-background to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            Features
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Everything Your Walk Needs
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From GPS tracking to AI-powered insights, SniffMap has everything to make your dog walks more enjoyable and informative.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group p-6 md:p-8 rounded-2xl bg-card border border-border shadow-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div
                className={`w-14 h-14 rounded-xl mb-6 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
                  feature.color === "primary" ? "bg-primary/10" :
                  feature.color === "secondary" ? "bg-secondary/10" :
                  feature.color === "accent" ? "bg-accent/10" :
                  feature.color === "forest" ? "bg-forest-100" :
                  "bg-amber-100"
                }`}
              >
                <feature.icon
                  className={`w-7 h-7 ${
                    feature.color === "primary" ? "text-primary" :
                    feature.color === "secondary" ? "text-secondary" :
                    feature.color === "accent" ? "text-accent" :
                    feature.color === "forest" ? "text-forest-600" :
                    "text-amber-600"
                  }`}
                />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
