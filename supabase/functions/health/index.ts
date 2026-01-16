import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Simple query to keep the database active
    const startTime = Date.now();
    const { error } = await supabase.from("profiles").select("id").limit(1);
    const latencyMs = Date.now() - startTime;

    if (error) {
      console.error("Health check failed:", error.message);
      return new Response(
        JSON.stringify({ status: "error", error: error.message, timestamp: new Date().toISOString() }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Health check passed in ${latencyMs}ms`);
    return new Response(
      JSON.stringify({ status: "ok", latency_ms: latencyMs, timestamp: new Date().toISOString() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Health check error:", err);
    return new Response(
      JSON.stringify({ status: "error", error: "Internal error", timestamp: new Date().toISOString() }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

