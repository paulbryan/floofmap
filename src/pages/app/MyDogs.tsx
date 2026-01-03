import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Dog, Plus, ChevronRight, ArrowLeft, Loader2, 
  UserPlus, Users, Trash2, Mail, Check, X, UsersRound 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DogProfile {
  id: string;
  name: string;
  breed: string | null;
  birthday: string | null;
  avatar_url: string | null;
  user_id: string;
}

interface DogWalker {
  id: string;
  dog_id: string;
  walker_email: string;
  walker_user_id: string;
  status: string;
  created_at: string;
}

interface WalkerInvite {
  id: string;
  dog_id: string;
  owner_user_id: string;
  status: string;
  dog_name: string | null;
}

const MyDogs = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [dogs, setDogs] = useState<DogProfile[]>([]);
  const [sharedDogs, setSharedDogs] = useState<DogProfile[]>([]);
  const [pendingInvites, setPendingInvites] = useState<WalkerInvite[]>([]);
  const [walkers, setWalkers] = useState<Record<string, DogWalker[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDog, setShowAddDog] = useState(false);
  const [showInviteWalker, setShowInviteWalker] = useState(false);
  const [showBulkInvite, setShowBulkInvite] = useState(false);
  const [selectedDog, setSelectedDog] = useState<DogProfile | null>(null);
  const [selectedDogIds, setSelectedDogIds] = useState<string[]>([]);
  const [walkerToRemove, setWalkerToRemove] = useState<DogWalker | null>(null);
  
  // Form states
  const [dogName, setDogName] = useState("");
  const [breed, setBreed] = useState("");
  const [birthday, setBirthday] = useState("");
  const [walkerEmail, setWalkerEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Load my dogs
      const { data: myDogs, error: dogsError } = await supabase
        .from("dogs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (dogsError) throw dogsError;
      setDogs(myDogs || []);

      // Load walkers for each dog
      const { data: walkerData, error: walkersError } = await supabase
        .from("dog_walkers")
        .select("*")
        .eq("owner_user_id", user.id)
        .neq("status", "revoked");

      if (!walkersError && walkerData) {
        const walkersByDog: Record<string, DogWalker[]> = {};
        walkerData.forEach((w) => {
          if (!walkersByDog[w.dog_id]) walkersByDog[w.dog_id] = [];
          walkersByDog[w.dog_id].push(w);
        });
        setWalkers(walkersByDog);
      }

      // Load dogs shared with me (as a walker)
      const { data: sharedData, error: sharedError } = await supabase
        .from("dog_walkers")
        .select("dog_id, dogs(id, name, breed, birthday, avatar_url, user_id)")
        .eq("walker_user_id", user.id)
        .eq("status", "active");

      if (!sharedError && sharedData) {
        const shared = sharedData
          .map((s) => s.dogs)
          .filter((d): d is DogProfile => d !== null);
        setSharedDogs(shared);
      }

      // Load pending invites for me
      const { data: invites, error: invitesError } = await supabase
        .from("dog_walkers")
        .select("id, dog_id, owner_user_id, status, dogs(name)")
        .eq("walker_user_id", user.id)
        .eq("status", "pending");

      if (!invitesError && invites) {
        setPendingInvites(invites as unknown as WalkerInvite[]);
      }
    } catch (error: any) {
      toast({
        title: "Error loading dogs",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDog = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("dogs").insert({
        user_id: user.id,
        name: dogName,
        breed: breed || null,
        birthday: birthday || null,
      });

      if (error) throw error;

      toast({
        title: "Dog added! 🐕",
        description: `${dogName} is ready for walks.`,
      });
      
      setShowAddDog(false);
      setDogName("");
      setBreed("");
      setBirthday("");
      loadData();
    } catch (error: any) {
      toast({
        title: "Error adding dog",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInviteWalker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDog) return;
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("dog_walkers").insert({
        dog_id: selectedDog.id,
        owner_user_id: user.id,
        walker_user_id: "00000000-0000-0000-0000-000000000000",
        walker_email: walkerEmail.toLowerCase(),
        status: "pending",
      });

      // Silently handle duplicate errors to prevent email enumeration
      // Show generic success regardless of whether invite already exists
      if (error && error.code !== '23505') {
        // Only throw for non-duplicate errors
        console.error("Invite error:", error.message);
        throw new Error("Unable to send invite. Please try again.");
      }

      // Always show generic success message to prevent enumeration
      toast({
        title: "Invite sent! 📧",
        description: "The walker will see the invite when they sign in.",
      });
      
      setShowInviteWalker(false);
      setWalkerEmail("");
      setSelectedDog(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Unable to send invite",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkInviteWalker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDogIds.length === 0) return;
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const invites = selectedDogIds.map(dogId => ({
        dog_id: dogId,
        owner_user_id: user.id,
        walker_user_id: "00000000-0000-0000-0000-000000000000",
        walker_email: walkerEmail.toLowerCase(),
        status: "pending",
      }));

      const { error } = await supabase.from("dog_walkers").insert(invites);

      // Silently handle duplicate errors to prevent email enumeration
      if (error && error.code !== '23505') {
        console.error("Bulk invite error:", error.message);
        throw new Error("Unable to send invites. Please try again.");
      }

      // Always show generic success message to prevent enumeration
      toast({
        title: "Invites sent! 📧",
        description: "The walker will see the invites when they sign in.",
      });
      
      setShowBulkInvite(false);
      setWalkerEmail("");
      setSelectedDogIds([]);
      loadData();
    } catch (error: any) {
      toast({
        title: "Unable to send invites",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAcceptInvite = async (invite: WalkerInvite) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("dog_walkers")
        .update({ 
          status: "active", 
          walker_user_id: user.id,
          accepted_at: new Date().toISOString() 
        })
        .eq("id", invite.id);

      if (error) throw error;

      toast({
        title: "Invite accepted! 🎉",
        description: `You can now walk ${invite.dog_name || "this dog"}.`,
      });
      
      loadData();
    } catch (error: any) {
      toast({
        title: "Error accepting invite",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeclineInvite = async (invite: WalkerInvite) => {
    try {
      const { error } = await supabase
        .from("dog_walkers")
        .delete()
        .eq("id", invite.id);

      if (error) throw error;

      toast({
        title: "Invite declined",
      });
      
      loadData();
    } catch (error: any) {
      toast({
        title: "Error declining invite",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveWalker = async () => {
    if (!walkerToRemove) return;

    try {
      const { error } = await supabase
        .from("dog_walkers")
        .update({ status: "revoked", revoked_at: new Date().toISOString() })
        .eq("id", walkerToRemove.id);

      if (error) throw error;

      toast({
        title: "Walker removed",
        description: "They can no longer access your walks.",
      });
      
      setWalkerToRemove(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error removing walker",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/10 to-background px-4 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app/profile")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">My Dogs</h1>
        </div>
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="px-4 py-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Pending Invites
          </h2>
          <div className="space-y-2">
            {pendingInvites.map((invite) => (
              <motion.div
                key={invite.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl border border-border p-4"
              >
                <p className="font-medium mb-2">
                  You've been invited to walk {invite.dog_name || "a dog"}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAcceptInvite(invite)}
                    className="gap-1"
                  >
                    <Check className="w-4 h-4" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeclineInvite(invite)}
                    className="gap-1"
                  >
                    <X className="w-4 h-4" />
                    Decline
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* My Dogs */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Dog className="w-5 h-5 text-primary" />
            Your Dogs
          </h2>
        <div className="flex gap-2">
          {dogs.length > 1 && (
            <Dialog open={showBulkInvite} onOpenChange={(open) => {
              setShowBulkInvite(open);
              if (!open) {
                setSelectedDogIds([]);
                setWalkerEmail("");
              }
            }}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1">
                  <UsersRound className="w-4 h-4" />
                  Share All
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share Multiple Dogs</DialogTitle>
                  <DialogDescription>
                    Select which dogs to share with a dog walker
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleBulkInviteWalker} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Dogs</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {dogs.map(dog => (
                        <div key={dog.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
                          <Checkbox
                            id={`dog-${dog.id}`}
                            checked={selectedDogIds.includes(dog.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedDogIds([...selectedDogIds, dog.id]);
                              } else {
                                setSelectedDogIds(selectedDogIds.filter(id => id !== dog.id));
                              }
                            }}
                          />
                          <label htmlFor={`dog-${dog.id}`} className="flex items-center gap-2 cursor-pointer flex-1">
                            <span className="text-lg">🐕</span>
                            <span className="font-medium">{dog.name}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => setSelectedDogIds(dogs.map(d => d.id))}
                    >
                      Select all
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bulkWalkerEmail">Walker's Email</Label>
                    <Input
                      id="bulkWalkerEmail"
                      type="email"
                      value={walkerEmail}
                      onChange={(e) => setWalkerEmail(e.target.value)}
                      placeholder="dogwalker@example.com"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSaving || !walkerEmail || selectedDogIds.length === 0}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : `Send ${selectedDogIds.length} Invite${selectedDogIds.length !== 1 ? 's' : ''}`}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
          <Dialog open={showAddDog} onOpenChange={setShowAddDog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1">
                <Plus className="w-4 h-4" />
                Add Dog
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a Dog</DialogTitle>
                <DialogDescription>
                  Add a new dog to your profile
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddDog} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dogName">Name *</Label>
                  <Input
                    id="dogName"
                    value={dogName}
                    onChange={(e) => setDogName(e.target.value)}
                    placeholder="e.g., Max, Bella"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="breed">Breed (optional)</Label>
                  <Input
                    id="breed"
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    placeholder="e.g., Golden Retriever"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthday">Birthday (optional)</Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSaving || !dogName}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Dog"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        </div>

        {dogs.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-6 text-center">
            <Dog className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No dogs yet. Add your first dog!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dogs.map((dog, index) => (
              <motion.div
                key={dog.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-xl border border-border overflow-hidden"
              >
                <div className="p-4 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center text-2xl">
                    🐕
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{dog.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {dog.breed || "Unknown breed"}
                    </p>
                  </div>
                  <Dialog open={showInviteWalker && selectedDog?.id === dog.id} onOpenChange={(open) => {
                    setShowInviteWalker(open);
                    if (open) setSelectedDog(dog);
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="gap-1">
                        <UserPlus className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite Dog Walker</DialogTitle>
                        <DialogDescription>
                          Invite someone to walk {dog.name}. They'll be able to record walks and view maps.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleInviteWalker} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="walkerEmail">Walker's Email</Label>
                          <Input
                            id="walkerEmail"
                            type="email"
                            value={walkerEmail}
                            onChange={(e) => setWalkerEmail(e.target.value)}
                            placeholder="dogwalker@example.com"
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={isSaving || !walkerEmail}>
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Invite"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Show walkers for this dog */}
                {walkers[dog.id] && walkers[dog.id].length > 0 && (
                  <div className="border-t border-border px-4 py-3 bg-muted/30">
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Dog Walkers
                    </p>
                    <div className="space-y-2">
                      {walkers[dog.id].map((walker) => (
                        <div key={walker.id} className="flex items-center justify-between">
                          <span className="text-sm">{walker.walker_email}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              walker.status === "active" 
                                ? "bg-green-100 text-green-700" 
                                : "bg-amber-100 text-amber-700"
                            }`}>
                              {walker.status}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              onClick={() => setWalkerToRemove(walker)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Dogs I Walk (shared with me) */}
      {sharedDogs.length > 0 && (
        <div className="px-4 py-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-secondary" />
            Dogs I Walk
          </h2>
          <div className="space-y-3">
            {sharedDogs.map((dog, index) => (
              <motion.div
                key={dog.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-xl border border-secondary/30 p-4 flex items-center gap-4"
              >
                <div className="w-14 h-14 rounded-xl bg-secondary/20 flex items-center justify-center text-2xl">
                  🐕
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{dog.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {dog.breed || "Unknown breed"}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Remove Walker Confirmation */}
      <AlertDialog open={!!walkerToRemove} onOpenChange={() => setWalkerToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Dog Walker?</AlertDialogTitle>
            <AlertDialogDescription>
              {walkerToRemove?.walker_email} will no longer be able to see or record walks for this dog.
              You will still be able to see all walks they recorded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveWalker}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Walker
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyDogs;
