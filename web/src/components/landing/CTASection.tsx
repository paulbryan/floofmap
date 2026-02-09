import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-20 md:py-32 bg-gradient-sunset relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-background to-transparent" />
      
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center"
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-4 h-4" />
            Start for Free
          </motion.div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Ready to Transform{" "}
            <span className="text-gradient-primary">Your Dog Walks?</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
            Join thousands of dog owners who've discovered a whole new way to experience 
            walks with their furry friends. It's free to start, and your pup will thank you.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="xl" variant="hero" asChild>
              <Link to="/auth?mode=signup">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button size="xl" variant="glass" asChild>
              <Link to="/demo">
                Try Demo First
              </Link>
            </Button>
          </div>
          
          <p className="mt-6 text-sm text-muted-foreground">
            No credit card required • Free forever plan available
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
