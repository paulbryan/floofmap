import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/SEO";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for casual dog walkers",
    features: [
      "Up to 30 walk recordings/month",
      "Basic sniff detection",
      "Find water fountains & bins",
      "1 dog profile",
      "7-day walk history",
      "GPX export",
    ],
    cta: "Start Free",
    variant: "outline" as const,
    popular: false,
  },
  {
    name: "Pro",
    price: "$4.99",
    period: "/month",
    description: "For dedicated dog parents",
    features: [
      "Unlimited walk recordings",
      "Advanced AI sniff detection",
      "All POI types + community pins",
      "Unlimited dog profiles",
      "Unlimited walk history",
      "Sniff heatmaps & analytics",
      "Priority support",
      "GPX + JSON export",
    ],
    cta: "Start Pro Trial",
    variant: "hero" as const,
    popular: true,
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Pricing"
        description="Choose your Floof Map plan. Start free forever or upgrade to Pro for unlimited walk recordings, AI sniff detection, and advanced analytics."
        path="/pricing"
      />
      <Header />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              Simple Pricing
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Choose Your{" "}
              <span className="text-gradient-primary">Adventure</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free and upgrade when you're ready. No hidden fees, cancel anytime.
            </p>
          </motion.div>

          {/* Plans */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-2xl p-8 ${
                  plan.popular
                    ? "bg-card border-2 border-primary shadow-xl"
                    : "bg-card border border-border shadow-card"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    Most Popular
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-muted-foreground">{plan.description}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        plan.popular ? "bg-primary/10" : "bg-muted"
                      }`}>
                        <Check className={`w-3 h-3 ${plan.popular ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.variant}
                  size="lg"
                  className="w-full"
                  asChild
                >
                  <Link to="/auth?mode=signup">
                    {plan.cta}
                  </Link>
                </Button>
              </motion.div>
            ))}
          </div>

          {/* FAQ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-20 text-center"
          >
            <h2 className="text-2xl font-bold mb-4">Questions?</h2>
            <p className="text-muted-foreground mb-6">
              Check out our FAQ or reach out to us anytime.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" asChild>
                <Link to="/#faq">View FAQ</Link>
              </Button>
              <Button variant="ghost" asChild>
                <a href="mailto:hello@floofmap.com">Contact Us</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
