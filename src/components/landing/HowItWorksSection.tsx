import { motion } from "framer-motion";
import { Play, Search, MapPin } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Play,
    title: "Record Your Walk",
    description: "Hit the record button and walk your dog as usual. SniffMap tracks your route with GPS precision in the background.",
    color: "primary",
  },
  {
    number: "02",
    icon: Search,
    title: "AI Detects Sniffs",
    description: "Our algorithms analyze movement patterns to identify when your dog stopped to sniff, wait, or do their business.",
    color: "secondary",
  },
  {
    number: "03",
    icon: MapPin,
    title: "Explore & Discover",
    description: "Review your walks, find sniff hotspots, discover dog-friendly amenities, and share insights with the community.",
    color: "accent",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-20 md:py-32 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-4">
            How It Works
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Simple as a Walk in the Park
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Getting started with SniffMap takes just seconds. No complicated setup required.
          </p>
        </motion.div>

        <div className="relative max-w-5xl mx-auto">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-secondary to-accent -translate-y-1/2" />
          
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="relative text-center"
              >
                {/* Step number badge */}
                <div className={`relative z-10 w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-lg ${
                  step.color === "primary" ? "bg-gradient-hero" :
                  step.color === "secondary" ? "bg-gradient-forest" :
                  "bg-accent"
                }`}>
                  <step.icon className="w-10 h-10 text-primary-foreground" />
                  <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    step.color === "primary" ? "bg-primary text-primary-foreground" :
                    step.color === "secondary" ? "bg-secondary text-secondary-foreground" :
                    "bg-accent text-accent-foreground"
                  }`}>
                    {step.number}
                  </div>
                </div>
                
                <h3 className="text-xl md:text-2xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
