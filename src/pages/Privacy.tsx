import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Lock, Eye, Trash2, Download, MapPin } from "lucide-react";
import { motion } from "framer-motion";

const Privacy = () => {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
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
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: {currentDate}</p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Lock className="w-6 h-6 text-primary" />
                Our Commitment to Privacy
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                At FloofMap, we believe your data belongs to you. We've built our 
                service with privacy as a core principle, not an afterthought. 
                This policy explains what data we collect, how we use it, and 
                the controls you have.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">What We Collect</h2>
              <div className="space-y-4">
                <div className="bg-card rounded-xl p-4 border border-border">
                  <h3 className="font-semibold mb-2">Account Information</h3>
                  <p className="text-sm text-muted-foreground">
                    Email address for authentication. Optional: name and dog profiles.
                  </p>
                </div>
                <div className="bg-card rounded-xl p-4 border border-border">
                  <h3 className="font-semibold mb-2">Walk Data</h3>
                  <p className="text-sm text-muted-foreground">
                    GPS coordinates, timestamps, speed, and accuracy during recorded walks. 
                    This data is stored securely and only accessible by you.
                  </p>
                </div>
                <div className="bg-card rounded-xl p-4 border border-border">
                  <h3 className="font-semibold mb-2">Inferred Data</h3>
                  <p className="text-sm text-muted-foreground">
                    Sniff stops and behavioral patterns derived from your walk data 
                    using our AI algorithms. You can delete this anytime.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Eye className="w-6 h-6 text-primary" />
                Barking Zones & Community Data
              </h2>
              <div className="bg-amber-500/10 rounded-xl p-6 border border-amber-500/20">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  <strong className="text-foreground">Privacy-Safe by Design:</strong> When users add "Barking Zone" 
                  pins, we automatically blur and snap locations to a 30-50 meter grid. 
                  This means:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>No specific house or address can be identified</li>
                  <li>Pins represent general areas, not exact locations</li>
                  <li>We never display pins that could target individuals</li>
                  <li>Community can flag inappropriate pins for removal</li>
                </ul>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">How We Use Your Data</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">✓</span>
                  <span>Display your walks and provide insights about your dog's behavior</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">✓</span>
                  <span>Improve sniff stop detection accuracy for your specific dog</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">✓</span>
                  <span>Show nearby dog-friendly POIs (water, bins, bag dispensers)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-destructive font-bold">✗</span>
                  <span>We never sell your data to third parties</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-destructive font-bold">✗</span>
                  <span>We never share your exact walk routes with other users</span>
                </li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Download className="w-6 h-6 text-primary" />
                Your Rights & Controls
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-card rounded-xl p-4 border border-border">
                  <h3 className="font-semibold mb-2">Export Your Data</h3>
                  <p className="text-sm text-muted-foreground">
                    Download all your walks in GPX or JSON format anytime from Settings.
                  </p>
                </div>
                <div className="bg-card rounded-xl p-4 border border-border">
                  <h3 className="font-semibold mb-2">Delete Walks</h3>
                  <p className="text-sm text-muted-foreground">
                    Remove individual walks or clear your entire history.
                  </p>
                </div>
                <div className="bg-card rounded-xl p-4 border border-border">
                  <h3 className="font-semibold mb-2">Delete Account</h3>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data.
                  </p>
                </div>
                <div className="bg-card rounded-xl p-4 border border-border">
                  <h3 className="font-semibold mb-2">Revoke Permissions</h3>
                  <p className="text-sm text-muted-foreground">
                    Disable location access anytime through your browser settings.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Trash2 className="w-6 h-6 text-primary" />
                Data Retention
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your data for as long as you have an active account. 
                When you delete your account, all data is permanently removed within 
                30 days. Aggregated, anonymized statistics may be retained for 
                service improvement.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">Third-Party Services</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>We use the following third-party services:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>OpenStreetMap:</strong> Map tiles and POI data (no personal data shared)</li>
                  <li><strong>Supabase:</strong> Authentication and database hosting (encrypted)</li>
                  <li><strong>AI Services:</strong> Sniff stop classification (anonymized data only)</li>
                </ul>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
              <p className="text-muted-foreground">
                Questions about this policy? Email us at{" "}
                <a href="mailto:privacy@floofmap.com" className="text-primary hover:underline">
                  privacy@floofmap.com
                </a>
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Privacy;
