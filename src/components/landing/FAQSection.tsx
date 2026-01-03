import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What permissions does Floof Map need?",
    answer: "Floof Map requires location access to record your walks. On Android, we request 'Allow all the time' for background tracking. On iOS, we use 'Always Allow' but note that iOS may pause background apps—we'll alert you if tracking stops.",
  },
  {
    question: "Does it work on iPhone with the app in the background?",
    answer: "iOS has strict background location limits. Floof Map works best when the app is open. For longer walks, we recommend keeping the screen on with auto-lock disabled. We're working on solutions and will be transparent about any limitations.",
  },
  {
    question: "How accurate is the sniff detection?",
    answer: "Our AI analyzes speed changes, turning patterns, and stop duration to detect sniffs. It starts at ~80% accuracy and improves as you label events. The more you use it with your specific dog, the smarter it gets!",
  },
  {
    question: "Can I export my walk data?",
    answer: "Absolutely! Export any walk as GPX (for fitness apps) or JSON (for developers). You can also export all your data at once from Settings. Your data belongs to you.",
  },
  {
    question: "What about my dog's safety on busy streets?",
    answer: "Always prioritize real-world awareness over the app. Floof Map is designed to be used passively—just hit record and forget about it. Review your walks safely afterward at home.",
  },
  {
    question: "How do barking zones work without targeting houses?",
    answer: "When you report a barking zone, we blur the location to a 30-50m radius centered on the nearest street segment. This helps walkers plan calmer routes without singling out any specific property.",
  },
  {
    question: "Is Floof Map free?",
    answer: "Yes! The core features—GPS recording, sniff detection, POI discovery—are completely free with generous limits. We offer a Pro plan for power users who want unlimited history and advanced analytics.",
  },
];

const FAQSection = () => {
  return (
    <section className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4">
            FAQ
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Got questions? We've got answers. Can't find what you're looking for? Contact us anytime.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-border rounded-xl px-6 bg-card shadow-sm data-[state=open]:shadow-card transition-shadow"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
