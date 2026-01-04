import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Settings as SettingsIcon,
  Download,
  Trash2,
  Bell,
  MapPin,
  Shield,
  FileJson,
  FileText,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [highAccuracy, setHighAccuracy] = useState(true);

  const handleExportGPX = async () => {
    setIsExporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: walks, error: walksError } = await supabase
        .from("walks")
        .select("*")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false });

      if (walksError) throw walksError;

      const { data: trackPoints, error: pointsError } = await supabase
        .from("track_points")
        .select("*")
        .in("walk_id", walks?.map(w => w.id) || [])
        .order("ts", { ascending: true });

      if (pointsError) throw pointsError;

      const gpxContent = generateGPX(walks || [], trackPoints || []);
      downloadFile(gpxContent, "floofmap-walks.gpx", "application/gpx+xml");

      toast({
        title: "Export Complete",
        description: `Exported ${walks?.length || 0} walks to GPX format.`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Could not export your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: walks } = await supabase
        .from("walks")
        .select("*")
        .eq("user_id", user.id);

      const { data: dogs } = await supabase
        .from("dogs")
        .select("*")
        .eq("user_id", user.id);

      const { data: trackPoints } = await supabase
        .from("track_points")
        .select("*")
        .in("walk_id", walks?.map(w => w.id) || []);

      const { data: stopEvents } = await supabase
        .from("stop_events")
        .select("*")
        .in("walk_id", walks?.map(w => w.id) || []);

      const exportData = {
        exportedAt: new Date().toISOString(),
        dogs: dogs || [],
        walks: walks || [],
        trackPoints: trackPoints || [],
        stopEvents: stopEvents || [],
      };

      downloadFile(
        JSON.stringify(exportData, null, 2),
        "floofmap-data.json",
        "application/json"
      );

      toast({
        title: "Export Complete",
        description: "Your complete data has been exported to JSON.",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Could not export your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAllWalks = async () => {
    setIsDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("walks")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Walks Deleted",
        description: "All your walk history has been permanently deleted.",
      });
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Delete Failed",
        description: "Could not delete your walks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      await supabase.from("dogs").delete().eq("user_id", user.id);
      await supabase.from("walks").delete().eq("user_id", user.id);
      await supabase.from("profiles").delete().eq("id", user.id);

      await supabase.auth.signOut();

      toast({
        title: "Account Deleted",
        description: "Your account and all data have been removed.",
      });

      navigate("/");
    } catch (error) {
      console.error("Delete account error:", error);
      toast({
        title: "Delete Failed",
        description: "Could not delete your account. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/app/profile")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Settings</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="md:grid md:grid-cols-2 md:gap-8 space-y-8 md:space-y-0">
          {/* Left column */}
          <div className="space-y-8">
            {/* Preferences */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-primary" />
                Preferences
              </h2>
              <div className="space-y-4">
                <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Bell className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Notifications</p>
                      <p className="text-sm text-muted-foreground">Walk reminders & updates</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications}
                    onCheckedChange={setNotifications}
                  />
                </div>
                <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">High Accuracy GPS</p>
                      <p className="text-sm text-muted-foreground">Uses more battery</p>
                    </div>
                  </div>
                  <Switch
                    checked={highAccuracy}
                    onCheckedChange={setHighAccuracy}
                  />
                </div>
              </div>
            </motion.section>

            {/* Export Data */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" />
                Export Data
              </h2>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleExportGPX}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <FileText className="w-5 h-5 mr-2" />
                  )}
                  Export as GPX
                  <span className="ml-auto text-xs text-muted-foreground">For GPS apps</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleExportJSON}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <FileJson className="w-5 h-5 mr-2" />
                  )}
                  Export as JSON
                  <span className="ml-auto text-xs text-muted-foreground">Complete data</span>
                </Button>
              </div>
            </motion.section>
          </div>

          {/* Right column */}
          <div className="space-y-8">
            {/* Privacy */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Privacy & Data
              </h2>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/privacy")}
                >
                  <Shield className="w-5 h-5 mr-2" />
                  Privacy Policy
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/terms")}
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Terms of Service
                </Button>
              </div>
            </motion.section>

            {/* Danger Zone */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="font-semibold mb-4 flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </h2>
              <div className="space-y-3">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start border-destructive/30 text-destructive hover:bg-destructive/5"
                      disabled={isDeleting}
                    >
                      <Trash2 className="w-5 h-5 mr-2" />
                      Delete All Walks
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete All Walks?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all your walk history, including 
                        track points and sniff stops. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAllWalks}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete All Walks
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start border-destructive/30 text-destructive hover:bg-destructive/5"
                      disabled={isDeleting}
                    >
                      <Trash2 className="w-5 h-5 mr-2" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Your Account?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete your account and all associated data, 
                        including dogs, walks, and settings. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions
function generateGPX(walks: any[], trackPoints: any[]): string {
  const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="FloofMap" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>FloofMap Walks Export</name>
    <time>${new Date().toISOString()}</time>
  </metadata>`;

  const tracks = walks.map(walk => {
    const points = trackPoints
      .filter(p => p.walk_id === walk.id)
      .map(p => `      <trkpt lat="${p.lat}" lon="${p.lon}">
        <time>${p.ts}</time>
        ${p.accuracy_m ? `<hdop>${(p.accuracy_m / 10).toFixed(1)}</hdop>` : ""}
      </trkpt>`)
      .join("\n");

    return `  <trk>
    <name>Walk on ${new Date(walk.started_at).toLocaleDateString()}</name>
    <trkseg>
${points}
    </trkseg>
  </trk>`;
  }).join("\n");

  return `${gpxHeader}\n${tracks}\n</gpx>`;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default Settings;