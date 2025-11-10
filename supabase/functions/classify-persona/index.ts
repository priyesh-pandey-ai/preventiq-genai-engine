import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lead_id, city, org_type, lang = 'en' } = await req.json();

    if (!lead_id) {
      return new Response(
        JSON.stringify({ error: 'lead_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `Your task is to classify a new lead into one of the following 6 archetypes based on their data.
Return only a single JSON object with the key "archetype" containing the single best-fit ID.

ARCHETYPES:
- ARCH_PRO: 25-40, tech-savvy, seeks optimization, lives in a metro city (Mumbai, Delhi, Bangalore, Hyderabad).
- ARCH_TP: 35-50, family-focused, worried about hereditary risks, diagnostic centers or hospitals.
- ARCH_SEN: 55+, trusts doctors, wary of online ads, prefers established clinics.
- ARCH_STU: 18-25, budget-conscious, student, wellness centers.
- ARCH_RISK: 40+, knows they should get a checkup but procrastinates, any organization type.
- ARCH_PRICE: Any age, primary motivation is a discount, typically smaller clinics or pharmacies.

LEAD DATA:
- City: ${city || 'Not provided'}
- Organization Type: ${org_type || 'Not provided'}
- Language: ${lang}

Based on this information, which archetype best fits this lead? Return only valid JSON like: {"archetype": "ARCH_PRO"}`;

    console.log('Classifying lead:', lead_id);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a healthcare marketing analyst. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      // Fallback to default archetype
      return new Response(
        JSON.stringify({ 
          archetype: 'ARCH_PRO', 
          fallback: true,
          message: 'Using default archetype due to AI service error' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse the JSON response
    let parsedContent;
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      parsedContent = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Fallback to default
      return new Response(
        JSON.stringify({ archetype: 'ARCH_PRO', fallback: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate archetype
    const validArchetypes = ['ARCH_PRO', 'ARCH_TP', 'ARCH_SEN', 'ARCH_STU', 'ARCH_RISK', 'ARCH_PRICE'];
    const archetype = parsedContent.archetype;
    
    if (!validArchetypes.includes(archetype)) {
      console.error('Invalid archetype returned:', archetype);
      return new Response(
        JSON.stringify({ archetype: 'ARCH_PRO', fallback: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Lead classified as:', archetype);

    return new Response(
      JSON.stringify({ archetype }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in classify-persona function:', error);
    return new Response(
      JSON.stringify({ 
        archetype: 'ARCH_PRO', 
        fallback: true,
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
