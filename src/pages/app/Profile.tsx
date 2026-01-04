import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Dog, Settings, LogOut, Download, Trash2, Shield, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    getUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "See you next walk! 🐾",
    });
    navigate("/");
  };


  const menuItems = [
    {
      icon: Dog,
      label: "My Dogs",
      description: "Manage your dogs & walkers",
      onClick: () => navigate("/app/dogs"),
    },
    {
      icon: Settings,
      label: "Settings",
      description: "App preferences and notifications",
      onClick: () => navigate("/app/settings"),
    },
    {
      icon: Shield,
      label: "Privacy",
      description: "Control your data and privacy settings",
      onClick: () => navigate("/privacy"),
    },
    {
      icon: Download,
      label: "Export Data",
      description: "Download all your walk data",
      onClick: () => navigate("/app/settings"),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/10 to-background px-4 pt-6 md:pt-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center md:flex-row md:items-start md:gap-8"
          >
            <div className="flex flex-col items-center md:items-start">
              <div className="w-24 h-24 rounded-full bg-card border-4 border-background shadow-xl flex items-center justify-center mb-4">
                <User className="w-12 h-12 text-muted-foreground" />
              </div>
              <h1 className="text-xl font-bold">{userEmail || "Dog Walker"}</h1>
              <p className="text-sm text-muted-foreground">Free Plan</p>
            </div>
            
            <div className="flex items-center gap-6 mt-6 md:mt-0 bg-card rounded-xl p-4 md:p-6 shadow-card md:flex-1 md:justify-center">
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-primary">47</p>
                <p className="text-xs md:text-sm text-muted-foreground">Walks</p>
              </div>
              <div className="w-px h-10 md:h-12 bg-border" />
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-secondary">89.5km</p>
                <p className="text-xs md:text-sm text-muted-foreground">Distance</p>
              </div>
              <div className="w-px h-10 md:h-12 bg-border" />
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-amber-500">5 🔥</p>
                <p className="text-xs md:text-sm text-muted-foreground">Streak</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto md:grid md:grid-cols-2 md:gap-6 md:px-4">
        {/* Dog profiles section */}
        <div className="px-4 md:px-0 py-6">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Dog className="w-5 h-5 text-primary" />
            Your Dogs
          </h2>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl border border-border p-4 flex items-center gap-4"
          >
            <div className="w-16 h-16 rounded-xl bg-amber-100 flex items-center justify-center text-3xl">
              🐕
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Add Your Dog</h3>
              <p className="text-sm text-muted-foreground">
                Set up a profile to personalize sniff detection
              </p>
            </div>
            <Button variant="outline" size="sm">
              Add
            </Button>
          </motion.div>
        </div>

        {/* Menu items */}
        <div className="px-4 md:px-0 pb-6 md:py-6">
          <h2 className="font-semibold mb-3 flex items-center gap-2 md:invisible">
            <Settings className="w-5 h-5 text-primary" />
            Quick Actions
          </h2>
          <div className="space-y-2">
            {menuItems.map((item, index) => (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                onClick={item.onClick}
                className="w-full bg-card rounded-xl border border-border p-4 flex items-center gap-4 hover:shadow-card transition-shadow text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{item.label}</h4>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        <h2 className="font-semibold mb-3 text-destructive flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          Danger Zone
        </h2>
        
        <div className="flex flex-col md:flex-row gap-2 md:gap-4">
          <Button
            variant="outline"
            className="justify-start border-destructive/30 text-destructive hover:bg-destructive/5"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sign Out
          </Button>
          
          <Button
            variant="outline"
            className="justify-start border-destructive/30 text-destructive hover:bg-destructive/5"
          >
            <Trash2 className="w-5 h-5 mr-2" />
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
