import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation helpers
function isNonNegativeNumber(val: unknown): val is number {
  return typeof val === 'number' && !isNaN(val) && val >= 0;
}

function isValidLatitude(lat: unknown): lat is number {
  return typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90;
}

function isValidLongitude(lon: unknown): lon is number {
  return typeof lon === 'number' && !isNaN(lon) && lon >= -180 && lon <= 180;
}

function sanitizeText(text: unknown, maxLength: number = 100): string {
  if (typeof text !== 'string') return '';
  // Remove any potential prompt injection characters and limit length
  return text
    .replace(/[<>{}[\]]/g, '')
    .slice(0, maxLength)
    .trim();
}

function isValidStopEvent(event: unknown): boolean {
  if (typeof event !== 'object' || event === null) return false;
  const e = event as Record<string, unknown>;
  return (
    isNonNegativeNumber(e.duration_s) &&
    isValidLatitude(e.lat) &&
    isValidLongitude(e.lon) &&
    (e.label === undefined || typeof e.label === 'string')
  );
}

interface ValidatedWalkData {
  duration_s: number;
  distance_m: number;
  sniff_time_s: number;
  stop_events: Array<{
    label: string;
    duration_s: number;
    lat: number;
    lon: number;
  }>;
  dog_name: string;
  dog_breed: string;
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

    const rawData = body as Record<string, unknown>;
    
    // Validate required numeric fields
    if (!isNonNegativeNumber(rawData.duration_s)) {
      return new Response(
        JSON.stringify({ error: 'duration_s must be a non-negative number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isNonNegativeNumber(rawData.distance_m)) {
      return new Response(
        JSON.stringify({ error: 'distance_m must be a non-negative number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isNonNegativeNumber(rawData.sniff_time_s)) {
      return new Response(
        JSON.stringify({ error: 'sniff_time_s must be a non-negative number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate stop_events if provided
    const stopEvents: ValidatedWalkData['stop_events'] = [];
    if (rawData.stop_events !== undefined) {
      if (!Array.isArray(rawData.stop_events)) {
        return new Response(
          JSON.stringify({ error: 'stop_events must be an array' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Limit to 100 stop events to prevent abuse
      if (rawData.stop_events.length > 100) {
        return new Response(
          JSON.stringify({ error: 'Too many stop events. Maximum is 100.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      for (const event of rawData.stop_events) {
        if (!isValidStopEvent(event)) {
          return new Response(
            JSON.stringify({ error: 'Invalid stop event format' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const e = event as Record<string, unknown>;
        stopEvents.push({
          label: sanitizeText(e.label, 50) || 'sniff',
          duration_s: e.duration_s as number,
          lat: e.lat as number,
          lon: e.lon as number,
        });
      }
    }

    // Create validated walk data with sanitized text fields
    const walkData: ValidatedWalkData = {
      duration_s: rawData.duration_s as number,
      distance_m: rawData.distance_m as number,
      sniff_time_s: rawData.sniff_time_s as number,
      stop_events: stopEvents,
      dog_name: sanitizeText(rawData.dog_name, 50),
      dog_breed: sanitizeText(rawData.dog_breed, 50),
    };
    
    console.log('Analyzing walk:', {
      duration: walkData.duration_s,
      distance: walkData.distance_m,
      sniffTime: walkData.sniff_time_s,
      stopEvents: walkData.stop_events.length,
    });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service is not configured. Please contact support.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate some metrics
    const durationMin = Math.round(walkData.duration_s / 60);
    const distanceKm = (walkData.distance_m / 1000).toFixed(2);
    const sniffPercent = walkData.duration_s > 0 
      ? Math.round((walkData.sniff_time_s / walkData.duration_s) * 100) 
      : 0;
    const avgSpeed = walkData.duration_s > 0 
      ? ((walkData.distance_m / walkData.duration_s) * 3.6).toFixed(1) 
      : 0;

    const stopSummary = walkData.stop_events.reduce((acc, stop) => {
      acc[stop.label] = (acc[stop.label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const prompt = `Analyze this dog walk and provide helpful, encouraging insights:

Dog: ${walkData.dog_name || 'Unknown'} ${walkData.dog_breed ? `(${walkData.dog_breed})` : ''}

Walk Stats:
- Duration: ${durationMin} minutes
- Distance: ${distanceKm} km
- Average speed: ${avgSpeed} km/h
- Sniff time: ${walkData.sniff_time_s} seconds (${sniffPercent}% of walk)
- Stop events: ${JSON.stringify(stopSummary)}

Please provide:
1. A brief, friendly summary of the walk (2-3 sentences)
2. One specific positive observation about the walk
3. One gentle suggestion for future walks (if applicable)
4. An encouraging closing note

Keep the response concise, warm, and dog-owner friendly. Use occasional emojis. Focus on the dog's enrichment and well-being.`;

    console.log('Calling Lovable AI...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are a friendly dog walking coach. You help dog owners understand their walks and encourage enriching experiences for their dogs. Be warm, supportive, and practical.' 
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'AI service is temporarily busy. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service quota exceeded. Please try again later.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.error('AI gateway error:', response.status);
      return new Response(
        JSON.stringify({ error: 'Failed to analyze walk. Please try again.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const analysis = aiResponse.choices?.[0]?.message?.content;

    console.log('Walk analysis complete');

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis,
        metrics: {
          duration_min: durationMin,
          distance_km: parseFloat(distanceKm),
          avg_speed_kmh: parseFloat(avgSpeed as string),
          sniff_percent: sniffPercent,
          stop_summary: stopSummary,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error analyzing walk:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
