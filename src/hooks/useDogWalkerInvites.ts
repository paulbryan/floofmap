import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PendingInvite {
  id: string;
  dog_id: string;
  owner_user_id: string;
  walker_email: string;
  status: string;
  dogs?: { name: string };
}

export const useDogWalkerInvites = () => {
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const checkInvites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;

      // Find invites for this user's email that are still pending
      const { data, error } = await supabase
        .from("dog_walkers")
        .select("id, dog_id, owner_user_id, walker_email, status, dogs(name)")
        .eq("walker_email", user.email.toLowerCase())
        .eq("status", "pending");

      if (error) throw error;
      setPendingInvites((data as unknown as PendingInvite[]) || []);
    } catch (error) {
      console.error("Error checking invites:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const acceptInvite = async (inviteId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("dog_walkers")
      .update({
        status: "active",
        walker_user_id: user.id,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", inviteId);

    if (error) throw error;
    await checkInvites();
  };

  const declineInvite = async (inviteId: string) => {
    const { error } = await supabase
      .from("dog_walkers")
      .delete()
      .eq("id", inviteId);

    if (error) throw error;
    await checkInvites();
  };

  useEffect(() => {
    checkInvites();
  }, []);

  return {
    pendingInvites,
    isLoading,
    acceptInvite,
    declineInvite,
    refresh: checkInvites,
  };
};
