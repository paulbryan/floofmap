import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeocodeResult {
  display_name: string;
  address: {
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
  };
}

// Input validation helpers
function isValidLatitude(lat: unknown): lat is number {
  return typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90;
}

function isValidLongitude(lon: unknown): lon is number {
  return typeof lon === 'number' && !isNaN(lon) && lon >= -180 && lon <= 180;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Verify JWT token
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Authenticated user: ${user.id}`);

    // Parse and validate input
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof body !== 'object' || body === null) {
      return new Response(
        JSON.stringify({ error: 'Request body must be an object' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { lat, lon, type = 'reverse' } = body as { lat?: unknown; lon?: unknown; type?: unknown };
    
    // Validate type
    if (type !== 'reverse') {
      return new Response(
        JSON.stringify({ error: 'Only reverse geocoding is currently supported' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate coordinates
    if (!isValidLatitude(lat)) {
      return new Response(
        JSON.stringify({ error: 'Invalid latitude. Must be a number between -90 and 90' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidLongitude(lon)) {
      return new Response(
        JSON.stringify({ error: 'Invalid longitude. Must be a number between -180 and 180' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Reverse geocoding: ${lat}, ${lon}`);

    // Use Nominatim for reverse geocoding (free, no API key required)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'FloofMap/1.0 (https://floofmap.com)',
        },
      }
    );

    if (!response.ok) {
      console.error('Nominatim error:', response.status);
      return new Response(
        JSON.stringify({ error: 'Failed to geocode location. Please try again.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data: GeocodeResult = await response.json();
    
    // Build a friendly location name
    const parts = [];
    if (data.address?.road) parts.push(data.address.road);
    if (data.address?.neighbourhood) parts.push(data.address.neighbourhood);
    else if (data.address?.suburb) parts.push(data.address.suburb);
    
    const locality = data.address?.city || data.address?.town || data.address?.village || data.address?.county;
    if (locality) parts.push(locality);

    const friendlyName = parts.length > 0 ? parts.join(', ') : data.display_name?.split(',').slice(0, 2).join(',');

    console.log(`Geocoded to: ${friendlyName}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        location: {
          display_name: data.display_name,
          friendly_name: friendlyName,
          address: data.address,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error geocoding:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
