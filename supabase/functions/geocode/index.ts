import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lon, type = 'reverse' } = await req.json();
    
    if (type === 'reverse') {
      if (typeof lat !== 'number' || typeof lon !== 'number') {
        return new Response(
          JSON.stringify({ error: 'Invalid coordinates. Expected lat and lon as numbers.' }),
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
        throw new Error(`Geocoding service error: ${response.status}`);
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
    }

    return new Response(
      JSON.stringify({ error: 'Only reverse geocoding is currently supported' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error geocoding:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
