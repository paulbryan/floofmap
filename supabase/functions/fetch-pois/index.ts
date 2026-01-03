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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bbox, categories } = await req.json();
    
    if (!bbox || !Array.isArray(bbox) || bbox.length !== 4) {
      return new Response(
        JSON.stringify({ error: 'Invalid bbox. Expected [south, west, north, east]' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const [south, west, north, east] = bbox;
    const bboxHash = `${south.toFixed(3)},${west.toFixed(3)},${north.toFixed(3)},${east.toFixed(3)}`;
    
    console.log(`Fetching POIs for bbox: ${bboxHash}, categories: ${categories?.join(', ') || 'all'}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first
    const categoryList = categories || ['dog_park', 'water', 'bin', 'vet'];
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
        console.error('Overpass API error:', response.status, await response.text());
        throw new Error(`Overpass API error: ${response.status}`);
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
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
