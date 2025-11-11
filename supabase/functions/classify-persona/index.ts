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

    const AZURE_ENDPOINT = Deno.env.get('AZURE_OPENAI_ENDPOINT');
    const AZURE_KEY = Deno.env.get('AZURE_OPENAI_KEY');
    const MODEL_NAME = Deno.env.get('AZURE_MODEL_NAME') || 'grok-3';
    
    if (!AZURE_ENDPOINT || !AZURE_KEY) {
      console.error('Azure OpenAI credentials not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `You are a healthcare marketing analyst. Classify this lead into one of these 6 archetypes based on their data.
Return ONLY a JSON object with the key "archetype" containing the ID.

ARCHETYPES:
- ARCH_PRO: 25-40, tech-savvy, metro city (Mumbai, Delhi, Bangalore, Hyderabad)
- ARCH_TP: 35-50, family-focused, worried about hereditary risks
- ARCH_SEN: 55+, trusts doctors, wary of online ads
- ARCH_STU: 18-25, budget-conscious, student
- ARCH_RISK: 40+, procrastinates on health checkups
- ARCH_PRICE: Any age, motivated by discounts

LEAD DATA:
- City: ${city || 'Not provided'}
- Organization Type: ${org_type || 'Not provided'}
- Language: ${lang}

Return ONLY: {"archetype": "ARCH_XXX"}`;

    console.log('Classifying lead:', lead_id);

    const response = await fetch(`${AZURE_ENDPOINT}chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_KEY,
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure OpenAI error:', response.status, errorText);
      
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
