import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah M.",
    role: "Golden Retriever Mom",
    avatar: "🧑‍🦰",
    content: "Finally an app that gets it! My dog Charlie loves his sniff walks, and now I can actually see his favorite spots. The AI detection is surprisingly accurate.",
    rating: 5,
  },
  {
    name: "Marcus T.",
    role: "Professional Dog Walker",
    avatar: "👨",
    content: "I walk 8+ dogs a day and SniffMap helps me track each one's preferences. The water fountain finder has been a lifesaver during summer walks!",
    rating: 5,
  },
  {
    name: "Emily & Bean",
    role: "Rescue Dog Parent",
    avatar: "👩",
    content: "Bean is nervous around certain areas. The barking zone feature helped us plan calmer routes. Love that it's privacy-conscious too.",
    rating: 5,
  },
  {
    name: "David K.",
    role: "Husky Owner",
    avatar: "🧔",
    content: "The offline recording saved me so many times in the park with no signal. And the sniff heatmap is just cool to look at!",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-20 md:py-32 bg-gradient-sunset relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-background to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Loved by Dogs & Their Humans
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of happy pups and their owners who've transformed their daily walks.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-6 rounded-2xl bg-card border border-border shadow-card hover:shadow-lg transition-shadow"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                "{testimonial.content}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-sm">{testimonial.name}</div>
                  <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
