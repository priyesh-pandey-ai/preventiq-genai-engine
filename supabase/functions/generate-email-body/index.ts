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
    const { persona_id, lead_name, lang = 'en', subject_line } = await req.json();

    if (!persona_id) {
      return new Response(
        JSON.stringify({ error: 'persona_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get persona details
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: persona } = await supabase
      .from('personas')
      .select('label, description')
      .eq('id', persona_id)
      .single();

    if (!persona) {
      return new Response(
        JSON.stringify({ error: 'Persona not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    const personaContext = {
      'ARCH_PRO': 'data-driven professional who values efficiency and ROI, responds to statistics and expert opinions',
      'ARCH_TP': 'busy parent concerned about family health and hereditary risks, values convenience and trust',
      'ARCH_SEN': 'senior citizen who trusts traditional medical advice, prefers respectful and clear communication',
      'ARCH_STU': 'budget-conscious young adult influenced by peer recommendations and social proof',
      'ARCH_RISK': 'health-aware individual who procrastinates, needs gentle nudges and fear-of-missing-out triggers',
      'ARCH_PRICE': 'value-seeker motivated by discounts and special offers, responds to limited-time deals'
    };

    const prompt = `You are an expert healthcare marketing copywriter. Generate a personalized email body for a preventive health campaign.

CONTEXT:
- Persona: ${persona.label} (${persona.description})
- Persona Psychology: ${personaContext[persona_id] || persona.description}
- Lead Name: ${lead_name || 'there'}
- Subject Line: ${subject_line || 'Your Health Matters'}
- Language: ${lang === 'hi' ? 'Hindi' : 'English'}

REQUIREMENTS:
1. Write in ${lang === 'hi' ? 'Hindi' : 'English'} language
2. Keep tone appropriate for the persona (${personaContext[persona_id]})
3. Include a warm greeting using the lead's name
4. 2-3 short paragraphs maximum (under 150 words total)
5. Focus on benefits relevant to this persona
6. Create emotional connection and trust
7. Include a clear call-to-action that motivates them
8. End with a professional signature
9. DO NOT include the subject line in the body
10. DO NOT make medical claims like "cure" or "guarantee"

Return ONLY a JSON object with these keys:
{
  "greeting": "Personalized greeting line",
  "body_paragraph_1": "First engaging paragraph",
  "body_paragraph_2": "Second paragraph with benefits",
  "call_to_action": "Motivating CTA text",
  "closing": "Professional closing line"
}`;

    console.log(`Generating AI email body for persona ${persona_id} in ${lang}`);

    const response = await fetch(`${AZURE_ENDPOINT}chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_KEY,
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: 'system', content: 'You are an expert healthcare marketing copywriter specializing in personalized email content.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure OpenAI error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to generate email content' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
      // Remove markdown code blocks if present
      let cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      
      // Try to find JSON object in the content
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }
      
      parsedContent = JSON.parse(cleanContent);
      
      // Validate required fields
      if (!parsedContent.greeting || !parsedContent.call_to_action) {
        throw new Error('Missing required fields in AI response');
      }
    } catch (parseError) {
      console.error('Failed to parse Azure OpenAI response:', content);
      console.error('Parse error:', parseError);
      
      // Return a graceful fallback instead of throwing
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse AI response',
          fallback: true,
          email_content: {
            greeting: "Hello there,",
            body_paragraph_1: "We have something important to share with you about your health.",
            body_paragraph_2: "Take a moment to explore our preventive health solutions designed for you.",
            call_to_action: "Learn More",
            closing: "Best regards, Your Health Team"
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('AI email content generated successfully');

    return new Response(
      JSON.stringify({
        email_content: parsedContent,
        generated_by: 'azure-openai-grok-3',
        persona_id,
        lang
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-email-body function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
