import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WalkData {
  duration_s: number;
  distance_m: number;
  sniff_time_s: number;
  stop_events: Array<{
    label: string;
    duration_s: number;
    lat: number;
    lon: number;
  }>;
  dog_name?: string;
  dog_breed?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const walkData: WalkData = await req.json();
    
    console.log('Analyzing walk:', {
      duration: walkData.duration_s,
      distance: walkData.distance_m,
      sniffTime: walkData.sniff_time_s,
      stopEvents: walkData.stop_events?.length || 0,
    });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
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

    const stopSummary = walkData.stop_events?.reduce((acc, stop) => {
      acc[stop.label] = (acc[stop.label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

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
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI usage limit reached. Please check your workspace credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
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
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
