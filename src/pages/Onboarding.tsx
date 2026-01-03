import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Dog, Calendar, Camera, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [dogName, setDogName] = useState("");
  const [breed, setBreed] = useState("");
  const [birthday, setBirthday] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Not authenticated",
          description: "Please sign in to continue.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // For now, just navigate to app - we'll add dog profile after migrations
      toast({
        title: `Welcome, ${dogName}! 🐕`,
        description: "Your dog profile is ready. Let's go for a walk!",
      });
      navigate("/app");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-sunset flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-secondary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
            1
          </div>
          <div className="w-16 h-1 bg-muted rounded-full" />
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-bold">
            2
          </div>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-xl border border-border p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center shadow-lg mx-auto mb-4">
              <Dog className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Tell us about your pup!</h1>
            <p className="text-muted-foreground">
              This helps us personalize sniff detection for your dog
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="dogName">Dog's Name *</Label>
              <div className="relative">
                <Dog className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="dogName"
                  type="text"
                  placeholder="e.g., Max, Bella, Charlie"
                  className="pl-10"
                  value={dogName}
                  onChange={(e) => setDogName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="breed">Breed (optional)</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="breed"
                  type="text"
                  placeholder="e.g., Golden Retriever, Mixed"
                  className="pl-10"
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthday">Birthday (optional)</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="birthday"
                  type="date"
                  className="pl-10"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                />
              </div>
            </div>

            {/* Avatar placeholder */}
            <div className="space-y-2">
              <Label>Photo (optional)</Label>
              <button
                type="button"
                className="w-full p-6 border-2 border-dashed border-border rounded-xl hover:border-primary/50 hover:bg-muted/50 transition-colors flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Camera className="w-6 h-6 text-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">
                  Add a photo of your dog
                </span>
              </button>
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={isLoading || !dogName}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  Start Walking
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Skip option */}
        <button
          onClick={() => navigate("/app")}
          className="block w-full text-center text-sm text-muted-foreground hover:text-foreground mt-4 transition-colors"
        >
          Skip for now
        </button>
      </motion.div>
    </div>
  );
};

export default Onboarding;
