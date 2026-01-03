import { motion } from "framer-motion";
import { Shield, Eye, Download, Trash2 } from "lucide-react";

const privacyFeatures = [
  {
    icon: Shield,
    title: "Your Data, Your Control",
    description: "All walk data is encrypted and stored securely. We never sell your data to third parties.",
  },
  {
    icon: Eye,
    title: "Blurred Barking Zones",
    description: "Community-reported noisy areas are anonymized to a street segment—never targeting specific homes.",
  },
  {
    icon: Download,
    title: "Export Anytime",
    description: "Download your complete walk history in GPX or JSON format whenever you want.",
  },
  {
    icon: Trash2,
    title: "Delete Instantly",
    description: "Remove individual walks or your entire account with a single click. No questions asked.",
  },
];

const PrivacySection = () => {
  return (
    <section id="privacy" className="py-20 md:py-32 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="order-2 lg:order-1"
          >
            <div className="relative max-w-md mx-auto">
              {/* Shield visual */}
              <div className="aspect-square rounded-3xl bg-gradient-forest p-1">
                <div className="w-full h-full rounded-[1.3rem] bg-card flex items-center justify-center">
                  <div className="relative">
                    <Shield className="w-32 h-32 text-secondary opacity-10" />
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ scale: 0.8, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      <Shield className="w-24 h-24 text-secondary" />
                    </motion.div>
                    <motion.div
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.6 }}
                    >
                      <span className="text-4xl">🐕</span>
                    </motion.div>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <motion.div
                className="absolute -top-4 -right-4 w-24 h-24 rounded-2xl bg-forest-100 -z-10"
                initial={{ opacity: 0, rotate: -10 }}
                whileInView={{ opacity: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
              <motion.div
                className="absolute -bottom-4 -left-4 w-20 h-20 rounded-2xl bg-primary/10 -z-10"
                initial={{ opacity: 0, rotate: 10 }}
                whileInView={{ opacity: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              />
            </div>
          </motion.div>
          
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="order-1 lg:order-2"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-forest-100 text-forest-600 text-sm font-semibold mb-6">
              <Shield className="w-4 h-4" />
              Privacy First
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Built With{" "}
              <span className="text-gradient-forest">Privacy</span> in Mind
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              We believe your walks are personal. SniffMap is designed from the ground up 
              to respect your privacy while still delivering powerful features.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-4">
              {privacyFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  className="p-4 rounded-xl bg-muted/50 border border-border"
                >
                  <feature.icon className="w-6 h-6 text-secondary mb-3" />
                  <h4 className="font-semibold mb-1 text-sm">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PrivacySection;
