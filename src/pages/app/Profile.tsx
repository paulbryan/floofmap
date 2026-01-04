import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  User, Dog, LogOut, Download, Trash2, Shield, ChevronRight, 
  Bell, MapPin, FileJson, FileText, Loader2, AlertTriangle,
  Pencil, Check, X, Camera
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { startOfDay, subDays, isEqual, isBefore } from "date-fns";
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

interface Stats {
  totalWalks: number;
  totalDistance: string;
  streak: number;
}

interface WalkBase {
  id: string;
  started_at: string;
  distance_m: number | null;
}

// Calculate consecutive days streak
const calculateStreak = (walks: WalkBase[]): number => {
  if (walks.length === 0) return 0;

  const walkDays = new Set<string>();
  walks.forEach(walk => {
    const day = startOfDay(new Date(walk.started_at)).toISOString();
    walkDays.add(day);
  });

  const sortedDays = Array.from(walkDays)
    .map(d => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  if (sortedDays.length === 0) return 0;

  const today = startOfDay(new Date());
  const yesterday = startOfDay(subDays(new Date(), 1));
  const mostRecentWalkDay = sortedDays[0];

  if (!isEqual(mostRecentWalkDay, today) && !isEqual(mostRecentWalkDay, yesterday)) {
    return 0;
  }

  let streak = 1;
  let checkDay = mostRecentWalkDay;

  for (let i = 1; i < sortedDays.length; i++) {
    const expectedPrevDay = startOfDay(subDays(checkDay, 1));
    if (isEqual(sortedDays[i], expectedPrevDay)) {
      streak++;
      checkDay = sortedDays[i];
    } else if (isBefore(sortedDays[i], expectedPrevDay)) {
      break;
    }
  }

  return streak;
};

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [hasDogs, setHasDogs] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [highAccuracy, setHighAccuracy] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserEmail(user.email || "");
      setUserId(user.id);

      // Fetch profile, dogs, and walks in parallel
      const [profileResult, dogsResult, walksResult] = await Promise.all([
        supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).single(),
        supabase.from("dogs").select("id").eq("user_id", user.id).limit(1),
        supabase.from("walks").select("id, started_at, distance_m").eq("user_id", user.id).limit(100),
      ]);

      if (profileResult.data?.full_name) {
        setDisplayName(profileResult.data.full_name);
      }
      if (profileResult.data?.avatar_url) {
        setAvatarUrl(profileResult.data.avatar_url);
      }

      setHasDogs((dogsResult.data?.length ?? 0) > 0);

      const walks = walksResult.data || [];
      if (walks.length > 0) {
        const totalDistance = walks.reduce((sum, w) => sum + (w.distance_m || 0), 0);
        const streak = calculateStreak(walks);
        
        setStats({
          totalWalks: walks.length,
          totalDistance: totalDistance >= 1000 
            ? `${(totalDistance / 1000).toFixed(1)}km` 
            : `${Math.round(totalDistance)}m`,
          streak,
        });
      }
    };

    fetchData();
  }, []);

  const handleSaveDisplayName = async () => {
    if (!newDisplayName.trim()) return;
    setSavingName(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({ full_name: newDisplayName.trim() })
        .eq("id", user.id);

      if (error) throw error;

      setDisplayName(newDisplayName.trim());
      setEditingName(false);
      toast({ title: "Name updated!" });
    } catch (error: any) {
      toast({
        title: "Error updating name",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingName(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image under 5MB.", variant: "destructive" });
      return;
    }

    setUploadingAvatar(true);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Add cache-busting timestamp
      const urlWithTimestamp = `${publicUrl}?t=${Date.now()}`;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlWithTimestamp })
        .eq('id', userId);

      if (updateError) throw updateError;

      setAvatarUrl(urlWithTimestamp);
      toast({ title: "Avatar updated!" });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "See you next walk! 🐾",
    });
    navigate("/");
  };

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

      const { data: walks } = await supabase.from("walks").select("*").eq("user_id", user.id);
      const { data: dogs } = await supabase.from("dogs").select("*").eq("user_id", user.id);
      const { data: trackPoints } = await supabase.from("track_points").select("*").in("walk_id", walks?.map(w => w.id) || []);
      const { data: stopEvents } = await supabase.from("stop_events").select("*").in("walk_id", walks?.map(w => w.id) || []);

      const exportData = {
        exportedAt: new Date().toISOString(),
        dogs: dogs || [],
        walks: walks || [],
        trackPoints: trackPoints || [],
        stopEvents: stopEvents || [],
      };

      downloadFile(JSON.stringify(exportData, null, 2), "floofmap-data.json", "application/json");
      toast({ title: "Export Complete", description: "Your complete data has been exported to JSON." });
    } catch (error) {
      toast({ title: "Export Failed", description: "Could not export your data.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAllWalks = async () => {
    setIsDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("walks").delete().eq("user_id", user.id);
      if (error) throw error;

      setStats(null);
      toast({ title: "Walks Deleted", description: "All your walk history has been permanently deleted." });
    } catch (error) {
      toast({ title: "Delete Failed", description: "Could not delete your walks.", variant: "destructive" });
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

      toast({ title: "Account Deleted", description: "Your account and all data have been removed." });
      navigate("/");
    } catch (error) {
      toast({ title: "Delete Failed", description: "Could not delete your account. Please contact support.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/10 to-background px-4 pt-6 md:pt-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center md:flex-row md:items-start md:gap-8"
          >
            <div className="flex flex-col items-center md:items-start">
              {/* Avatar with upload */}
              <div className="relative mb-4">
                <div className="w-24 h-24 rounded-full bg-card border-4 border-background shadow-xl flex items-center justify-center overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-md hover:bg-primary/90 transition-colors">
                  {uploadingAvatar ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                  />
                </label>
              </div>
              
              {/* Editable display name */}
              {editingName ? (
                <div className="flex items-center gap-2 mb-1">
                  <Input
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    className="h-8 w-48"
                    placeholder="Display name"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={handleSaveDisplayName}
                    disabled={savingName}
                  >
                    {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => setEditingName(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold">{displayName || userEmail || "Dog Walker"}</h1>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => {
                      setNewDisplayName(displayName);
                      setEditingName(true);
                    }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
              <p className="text-sm text-muted-foreground">{userEmail}</p>
            </div>
            
            {/* Stats - only show when there's data */}
            {stats && (
              <div className="flex items-center gap-6 mt-6 md:mt-0 bg-card rounded-xl p-4 md:p-6 shadow-card md:flex-1 md:justify-center">
                <div className="text-center">
                  <p className="text-2xl md:text-3xl font-bold text-primary">{stats.totalWalks}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Walks</p>
                </div>
                <div className="w-px h-10 md:h-12 bg-border" />
                <div className="text-center">
                  <p className="text-2xl md:text-3xl font-bold text-secondary">{stats.totalDistance}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Distance</p>
                </div>
                <div className="w-px h-10 md:h-12 bg-border" />
                <div className="text-center">
                  <p className="text-2xl md:text-3xl font-bold text-amber-500">{stats.streak} 🔥</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Streak</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="md:grid md:grid-cols-2 md:gap-8 space-y-6 md:space-y-0">
          {/* Left column */}
          <div className="space-y-6">
            {/* Dog profiles section */}
            {!hasDogs && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="font-semibold mb-3 flex items-center gap-2">
                  <Dog className="w-5 h-5 text-primary" />
                  Your Dogs
                </h2>
                <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center text-2xl">
                    🐕
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Add Your Dog</h3>
                    <p className="text-sm text-muted-foreground">
                      Set up a profile to personalize sniff detection
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate("/app/dogs")}>
                    Add
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Quick links */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="font-semibold mb-3">Manage</h2>
              <div className="space-y-2">
                {hasDogs && (
                  <button
                    onClick={() => navigate("/app/dogs")}
                    className="w-full bg-card rounded-xl border border-border p-4 flex items-center gap-4 hover:shadow-card transition-shadow text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Dog className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">My Dogs</h4>
                      <p className="text-xs text-muted-foreground">Manage your dogs & walkers</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                )}
                <button
                  onClick={() => navigate("/privacy")}
                  className="w-full bg-card rounded-xl border border-border p-4 flex items-center gap-4 hover:shadow-card transition-shadow text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Privacy Policy</h4>
                    <p className="text-xs text-muted-foreground">How we handle your data</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </motion.div>

            {/* Preferences */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <h2 className="font-semibold mb-3">Preferences</h2>
              <div className="space-y-2">
                <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Bell className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Notifications</p>
                      <p className="text-xs text-muted-foreground">Walk reminders</p>
                    </div>
                  </div>
                  <Switch checked={notifications} onCheckedChange={setNotifications} />
                </div>
                <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">High Accuracy GPS</p>
                      <p className="text-xs text-muted-foreground">Uses more battery</p>
                    </div>
                  </div>
                  <Switch checked={highAccuracy} onCheckedChange={setHighAccuracy} />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Export Data */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" />
                Export Data
              </h2>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleExportGPX}
                  disabled={isExporting}
                >
                  {isExporting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <FileText className="w-5 h-5 mr-2" />}
                  Export as GPX
                  <span className="ml-auto text-xs text-muted-foreground">For GPS apps</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleExportJSON}
                  disabled={isExporting}
                >
                  {isExporting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <FileJson className="w-5 h-5 mr-2" />}
                  Export as JSON
                  <span className="ml-auto text-xs text-muted-foreground">Complete data</span>
                </Button>
              </div>
            </motion.div>

            {/* Account */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <h2 className="font-semibold mb-3">Account</h2>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleSignOut}
              >
                <LogOut className="w-5 h-5 mr-2" />
                Sign Out
              </Button>
            </motion.div>

            {/* Danger Zone */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="font-semibold mb-3 flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </h2>
              <div className="space-y-2">
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
                        This will permanently delete all your walk history, including track points and sniff stops.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAllWalks} className="bg-destructive text-destructive-foreground">
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
                        This will permanently delete your account and all data. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground">
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </motion.div>
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

export default Profile;