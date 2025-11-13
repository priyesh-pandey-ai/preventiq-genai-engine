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
    const { lead_id, city, org_type, age, lang = 'en' } = await req.json();

    if (!lead_id) {
      return new Response(
        JSON.stringify({ error: 'lead_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Classifying lead:', lead_id, { age, city, org_type });

    // Deterministic age-based classification rules
    let archetype: string | null = null;
    
    if (age !== null && age !== undefined) {
      if (age >= 18 && age <= 25) {
        archetype = 'ARCH_STU'; // Students/Young Adults
        console.log('Age-based classification: ARCH_STU (18-25)');
      } else if (age >= 55) {
        archetype = 'ARCH_SEN'; // Senior Citizens
        console.log('Age-based classification: ARCH_SEN (55+)');
      } else if (age >= 35 && age <= 50) {
        archetype = 'ARCH_TP'; // Time-poor Parents
        console.log('Age-based classification: ARCH_TP (35-50)');
      } else if (age >= 25 && age <= 40) {
        // Check if metro city for ARCH_PRO
        const metroCities = ['mumbai', 'delhi', 'bangalore', 'hyderabad', 'chennai', 'kolkata', 'pune'];
        if (city && metroCities.some(metro => city.toLowerCase().includes(metro))) {
          archetype = 'ARCH_PRO'; // Proactive Professional
          console.log('Age-based classification: ARCH_PRO (25-40, metro city)');
        } else {
          archetype = 'ARCH_PRO'; // Default for this age group
          console.log('Age-based classification: ARCH_PRO (25-40)');
        }
      } else if (age >= 40) {
        archetype = 'ARCH_RISK'; // At-risk but Avoidant
        console.log('Age-based classification: ARCH_RISK (40+)');
      }
    }

    // If we got archetype from age-based rules, use it
    if (archetype) {
      console.log('Lead classified as:', archetype, '(deterministic)');
      return new Response(
        JSON.stringify({ archetype, method: 'deterministic' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fallback: Use AI-based classification if no age provided
    const AZURE_ENDPOINT = Deno.env.get('AZURE_OPENAI_ENDPOINT');
    const AZURE_KEY = Deno.env.get('AZURE_OPENAI_KEY');
    const MODEL_NAME = Deno.env.get('AZURE_MODEL_NAME') || 'grok-3';
    
    if (!AZURE_ENDPOINT || !AZURE_KEY) {
      console.error('No age provided and Azure OpenAI not configured, using default');
      // Fallback to default archetype when no age and no AI available
      return new Response(
        JSON.stringify({ 
          archetype: 'ARCH_PRO', 
          fallback: true,
          method: 'default',
          message: 'Using default archetype - no age provided and AI not configured' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('No age provided, using AI classification as fallback');

    const prompt = `You are a healthcare marketing analyst. Classify this lead into one of these 6 archetypes based on their data.
Return ONLY a JSON object with the key "archetype" containing the ID.

ARCHETYPES (with age and behavior patterns):
- ARCH_PRO: 25-40 years old, tech-savvy professionals, metro city dwellers (Mumbai, Delhi, Bangalore, Hyderabad), data-driven
- ARCH_TP: 35-50 years old, family-focused parents, concerned about hereditary risks, time-constrained
- ARCH_SEN: 55+ years old, senior citizens, trusts doctors over online ads, traditional communication preferred
- ARCH_STU: 18-25 years old, students/young adults, budget-conscious, influenced by social proof
- ARCH_RISK: 40+ years old, at-risk individuals, aware but procrastinates on health checkups
- ARCH_PRICE: Any age, primary motivation is discounts/free offers, price-sensitive

LEAD DATA:
- City: ${city || 'Not provided'}
- Organization Type: ${org_type || 'Not provided'}
- Language: ${lang}

Return ONLY: {"archetype": "ARCH_XXX"}`;

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
          method: 'default',
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
        JSON.stringify({ archetype: 'ARCH_PRO', fallback: true, method: 'default' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate archetype
    const validArchetypes = ['ARCH_PRO', 'ARCH_TP', 'ARCH_SEN', 'ARCH_STU', 'ARCH_RISK', 'ARCH_PRICE'];
    archetype = parsedContent.archetype;
    
    if (!validArchetypes.includes(archetype)) {
      console.error('Invalid archetype returned:', archetype);
      return new Response(
        JSON.stringify({ archetype: 'ARCH_PRO', fallback: true, method: 'default' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Lead classified as:', archetype, '(AI)');

    return new Response(
      JSON.stringify({ archetype, method: 'ai' }),
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
