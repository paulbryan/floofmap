import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface POI {
  id: string;
  lat: number;
  lon: number;
  type: string;
  name?: string;
  tags?: Record<string, string>;
}

// Input validation helpers
function isValidLatitude(lat: unknown): lat is number {
  return typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90;
}

function isValidLongitude(lon: unknown): lon is number {
  return typeof lon === 'number' && !isNaN(lon) && lon >= -180 && lon <= 180;
}

function isValidCategory(cat: unknown): cat is string {
  const validCategories = ['dog_park', 'water', 'bin', 'vet'];
  return typeof cat === 'string' && validCategories.includes(cat);
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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
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

    const { bbox, categories } = body as { bbox?: unknown; categories?: unknown };
    
    // Validate bbox
    if (!bbox || !Array.isArray(bbox) || bbox.length !== 4) {
      return new Response(
        JSON.stringify({ error: 'Invalid bbox. Expected [south, west, north, east]' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const [south, west, north, east] = bbox;
    
    if (!isValidLatitude(south) || !isValidLatitude(north)) {
      return new Response(
        JSON.stringify({ error: 'Invalid latitude values. Must be between -90 and 90' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidLongitude(west) || !isValidLongitude(east)) {
      return new Response(
        JSON.stringify({ error: 'Invalid longitude values. Must be between -180 and 180' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (south > north) {
      return new Response(
        JSON.stringify({ error: 'Invalid bbox. South must be less than north' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate categories if provided
    let categoryList: string[] = ['dog_park', 'water', 'bin', 'vet'];
    if (categories !== undefined) {
      if (!Array.isArray(categories)) {
        return new Response(
          JSON.stringify({ error: 'Categories must be an array' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const invalidCategories = categories.filter(cat => !isValidCategory(cat));
      if (invalidCategories.length > 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid categories. Valid options: dog_park, water, bin, vet' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      categoryList = categories as string[];
    }

    const bboxHash = `${south.toFixed(3)},${west.toFixed(3)},${north.toFixed(3)},${east.toFixed(3)}`;
    
    console.log(`Fetching POIs for bbox: ${bboxHash}, categories: ${categoryList.join(', ')}`);

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check cache first
    const { data: cachedData } = await supabase
      .from('poi_cache')
      .select('category, data_json, fetched_at')
      .eq('bbox_hash', bboxHash)
      .in('category', categoryList);

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const validCache: Record<string, POI[]> = {};
    const categoriesToFetch: string[] = [];

    for (const cat of categoryList) {
      const cached = cachedData?.find(c => c.category === cat);
      if (cached && cached.fetched_at > oneHourAgo) {
        validCache[cat] = cached.data_json as POI[];
      } else {
        categoriesToFetch.push(cat);
      }
    }

    console.log(`Cache hit for: ${Object.keys(validCache).join(', ') || 'none'}`);
    console.log(`Fetching from OSM: ${categoriesToFetch.join(', ') || 'none'}`);

    // Fetch from Overpass API for missing categories
    const freshData: Record<string, POI[]> = {};
    
    if (categoriesToFetch.length > 0) {
      const overpassQueries: Record<string, string> = {
        dog_park: `node["leisure"="dog_park"](${south},${west},${north},${east});way["leisure"="dog_park"](${south},${west},${north},${east});`,
        water: `node["amenity"="drinking_water"](${south},${west},${north},${east});node["drinking_water"="yes"](${south},${west},${north},${east});`,
        bin: `node["amenity"="waste_basket"](${south},${west},${north},${east});node["amenity"="waste_disposal"](${south},${west},${north},${east});`,
        vet: `node["amenity"="veterinary"](${south},${west},${north},${east});way["amenity"="veterinary"](${south},${west},${north},${east});`,
      };

      const queryParts = categoriesToFetch
        .map(cat => overpassQueries[cat])
        .filter(Boolean)
        .join('');

      const overpassQuery = `[out:json][timeout:25];(${queryParts});out center;`;
      
      console.log('Querying Overpass API...');
      
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: overpassQuery,
        headers: { 'Content-Type': 'text/plain' },
      });

      if (!response.ok) {
        console.error('Overpass API error:', response.status);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch location data. Please try again.' }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const osmData = await response.json();
      console.log(`Received ${osmData.elements?.length || 0} elements from OSM`);

      // Categorize the results
      for (const cat of categoriesToFetch) {
        freshData[cat] = [];
      }

      for (const element of osmData.elements || []) {
        const lat = element.lat || element.center?.lat;
        const lon = element.lon || element.center?.lon;
        
        if (!lat || !lon) continue;

        const poi: POI = {
          id: `osm-${element.type}-${element.id}`,
          lat,
          lon,
          type: '',
          name: element.tags?.name,
          tags: element.tags,
        };

        // Determine category
        if (element.tags?.leisure === 'dog_park') {
          poi.type = 'dog_park';
          if (categoriesToFetch.includes('dog_park')) freshData.dog_park.push(poi);
        } else if (element.tags?.amenity === 'drinking_water' || element.tags?.drinking_water === 'yes') {
          poi.type = 'water';
          if (categoriesToFetch.includes('water')) freshData.water.push(poi);
        } else if (element.tags?.amenity === 'waste_basket' || element.tags?.amenity === 'waste_disposal') {
          poi.type = 'bin';
          if (categoriesToFetch.includes('bin')) freshData.bin.push(poi);
        } else if (element.tags?.amenity === 'veterinary') {
          poi.type = 'vet';
          if (categoriesToFetch.includes('vet')) freshData.vet.push(poi);
        }
      }

      // Cache the fresh data
      for (const [category, pois] of Object.entries(freshData)) {
        await supabase
          .from('poi_cache')
          .upsert({
            bbox_hash: bboxHash,
            category,
            data_json: pois,
            fetched_at: new Date().toISOString(),
          }, { onConflict: 'bbox_hash,category' });
      }
    }

    // Combine cached and fresh data
    const result: Record<string, POI[]> = { ...validCache, ...freshData };
    
    console.log(`Returning POIs: ${Object.entries(result).map(([k, v]) => `${k}: ${v.length}`).join(', ')}`);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching POIs:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
