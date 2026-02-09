import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const usePendingInviteCount = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      const { data } = await supabase.rpc("get_my_pending_invites");
      setCount(data?.length ?? 0);
    };

    fetchCount();

    // Refresh count periodically
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return count;
};
