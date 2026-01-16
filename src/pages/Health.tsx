import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Health = () => {
  const [status, setStatus] = useState<"checking" | "ok" | "error">("checking");
  const [timestamp, setTimestamp] = useState<string>("");

  useEffect(() => {
    const checkHealth = async () => {
      try {
        // Simple query to keep the database active
        const { error } = await supabase
          .from("profiles")
          .select("id")
          .limit(1);

        if (error) throw error;
        
        setStatus("ok");
        setTimestamp(new Date().toISOString());
      } catch {
        setStatus("error");
        setTimestamp(new Date().toISOString());
      }
    };

    checkHealth();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-2">
        <div className={`text-4xl font-bold ${status === "ok" ? "text-green-500" : status === "error" ? "text-red-500" : "text-muted-foreground"}`}>
          {status === "checking" ? "⏳" : status === "ok" ? "✓" : "✗"}
        </div>
        <p className="text-lg font-medium text-foreground">
          {status === "checking" ? "Checking..." : status === "ok" ? "OK" : "Error"}
        </p>
        {timestamp && (
          <p className="text-sm text-muted-foreground">{timestamp}</p>
        )}
      </div>
    </div>
  );
};

export default Health;

