import { Link } from "react-router-dom";
import { ArrowLeft, FileText, AlertTriangle, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import SEO from "@/components/SEO";

const Terms = () => {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Terms of Service"
        description="Read Floof Map's Terms of Service. Learn about acceptable use, community guidelines, data ownership, and your rights as a user."
        path="/terms"
      />
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="font-bold">FloofMap</span>
            </div>
            <div className="w-16" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: {currentDate}</p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using FloofMap ("the Service"), you agree to be bound 
                by these Terms of Service. If you disagree with any part of these terms, 
                you may not access the Service.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                FloofMap is a mobile web application that allows users to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Record GPS-tracked dog walks</li>
                <li>View AI-inferred sniff stops and behavioral patterns</li>
                <li>Discover dog-friendly points of interest</li>
                <li>Contribute to community features like barking zone pins</li>
                <li>Export walk data in standard formats</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  You must create an account to use certain features. You are responsible 
                  for maintaining the security of your account and all activities under it.
                </p>
                <p>
                  You must provide accurate information and keep it updated. We reserve 
                  the right to suspend accounts with false information.
                </p>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">4. Acceptable Use</h2>
              <div className="bg-destructive/10 rounded-xl p-6 border border-destructive/20">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  You agree NOT to:
                </h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Use barking zone pins to harass, target, or identify specific individuals or households</li>
                  <li>Submit false or misleading community pins</li>
                  <li>Attempt to reverse-engineer blurred location data</li>
                  <li>Use the Service for any illegal purpose</li>
                  <li>Interfere with or disrupt the Service</li>
                  <li>Scrape or collect data from the Service</li>
                </ul>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">5. Community Pins & Content</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When you contribute community pins (barking zones, bag dispensers, etc.):
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Your contributions are subject to our privacy-blurring algorithms</li>
                <li>Other users may vote on or flag your contributions</li>
                <li>We may remove pins that violate our guidelines</li>
                <li>You grant us a license to display your contributions</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">6. Location Data</h2>
              <div className="bg-amber-500/10 rounded-xl p-6 border border-amber-500/20">
                <p className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Important:</strong> FloofMap requires 
                  location access to function. On iOS devices, background location tracking 
                  may be limited. For best results, keep the app visible during walks. 
                  GPS accuracy varies by device and environment.
                </p>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">7. AI & Inference</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our AI-powered sniff detection uses algorithms to infer dog behavior from 
                movement patterns. These inferences are estimates and may not be accurate. 
                We do not guarantee the accuracy of behavioral classifications.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">8. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service, including its design, features, and content, is owned by 
                FloofMap. Your walk data remains yours—you can export or delete it anytime. 
                Map data is provided by OpenStreetMap contributors under the ODbL license.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">9. Disclaimers</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. 
                  We do not guarantee uninterrupted access, accuracy of location data, 
                  or reliability of AI inferences.
                </p>
                <p>
                  We are not responsible for decisions made based on information 
                  provided by the Service. Always use your own judgment when walking 
                  your dog.
                </p>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">10. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                To the maximum extent permitted by law, FloofMap shall not be liable 
                for any indirect, incidental, special, or consequential damages arising 
                from your use of the Service.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">11. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may suspend or terminate your access for violation of these terms. 
                You may delete your account at any time. Upon termination, your data 
                will be deleted in accordance with our Privacy Policy.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">12. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update these terms from time to time. Continued use of the 
                Service after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">13. Contact</h2>
              <p className="text-muted-foreground">
                Questions about these terms? Email us at{" "}
                <a href="mailto:legal@floofmap.com" className="text-primary hover:underline">
                  legal@floofmap.com
                </a>
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Terms;
