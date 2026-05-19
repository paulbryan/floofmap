// Edge function: get-migration-secrets
// One-shot helper for migrating off Supabase. Returns the sensitive
// connection details (service-role key, DB URL, etc.) needed by the
// migration script.
//
// SECURITY: gated behind MIGRATION_TOKEN. Set that secret to a long
// random string, send it as `Authorization: Bearer <token>`, and DELETE
// this function as soon as the migration is complete.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const expected = Deno.env.get("MIGRATION_TOKEN");
  if (!expected) {
    return new Response(
      JSON.stringify({ error: "MIGRATION_TOKEN not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const auth = req.headers.get("Authorization") ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  // Constant-time-ish compare
  if (
    provided.length !== expected.length ||
    !crypto.subtle ||
    !timingSafeEqual(provided, expected)
  ) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const payload = {
    SUPABASE_URL: Deno.env.get("SUPABASE_URL") ?? null,
    SUPABASE_ANON_KEY: Deno.env.get("SUPABASE_ANON_KEY") ?? null,
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? null,
    SUPABASE_DB_URL: Deno.env.get("SUPABASE_DB_URL") ?? null,
    OPENWEATHER_API_KEY: Deno.env.get("OPENWEATHER_API_KEY") ?? null,
    RESEND_API_KEY: Deno.env.get("RESEND_API_KEY") ?? null,
    LOVABLE_API_KEY: Deno.env.get("LOVABLE_API_KEY") ?? null,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
