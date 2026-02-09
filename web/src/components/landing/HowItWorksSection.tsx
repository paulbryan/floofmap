import { motion } from "framer-motion";
import { Play, Search, MapPin } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Play,
    title: "Record Your Walk",
    description: "Hit the record button and walk your dog as usual. Floof Map tracks your route with GPS precision in the background.",
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
            Getting started with Floof Map takes just seconds. No complicated setup required.
          </p>
        </motion.div>

        <div className="relative max-w-5xl mx-auto">
          {/* Connection line - positioned to go through icon centers */}
          <div className="hidden lg:block absolute top-10 left-[16.67%] right-[16.67%] h-1 bg-gradient-to-r from-primary via-secondary to-accent rounded-full opacity-30" />
          
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
                {/* Icon container with number badge */}
                <div className="relative z-10 w-20 h-20 mx-auto mb-8">
                  <div className={`w-full h-full rounded-2xl flex items-center justify-center shadow-lg ${
                    step.color === "primary" ? "bg-gradient-hero" :
                    step.color === "secondary" ? "bg-gradient-forest" :
                    "bg-accent"
                  }`}>
                    <step.icon className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <div className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-md ${
                    step.color === "primary" ? "bg-amber-600 text-white" :
                    step.color === "secondary" ? "bg-forest-600 text-white" :
                    "bg-sky-600 text-white"
                  }`}>
                    {step.number}
                  </div>
                </div>
                
                {/* Title with colored underline accent */}
                <div className="mb-4">
                  <h3 className="text-xl md:text-2xl font-bold mb-2">{step.title}</h3>
                  <div className={`mx-auto w-16 h-1 rounded-full ${
                    step.color === "primary" ? "bg-primary" :
                    step.color === "secondary" ? "bg-secondary" :
                    "bg-accent"
                  }`} />
                </div>
                
                <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
