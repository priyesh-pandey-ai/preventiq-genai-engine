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
    const { lead_id } = await req.json();

    if (!lead_id) {
      return new Response(
        JSON.stringify({ error: 'lead_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get lead data
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, name, email, city, org_type, age, lang, persona_id, created_at')
      .eq('id', lead_id)
      .single();

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: 'Lead not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get engagement history
    const { data: assignments } = await supabase
      .from('assignments')
      .select('id, sent_at, persona_id')
      .eq('lead_id', lead_id)
      .order('sent_at', { ascending: false });

    const { data: clicks } = await supabase
      .from('events')
      .select('id, ts, type')
      .in('assignment_id', (assignments || []).map(a => a.id))
      .eq('type', 'click');

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

    const engagementSummary = `
Total emails sent: ${assignments?.length || 0}
Total clicks: ${clicks?.length || 0}
Days since signup: ${Math.floor((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24))}
Last email sent: ${assignments?.[0]?.sent_at ? new Date(assignments[0].sent_at).toLocaleDateString() : 'Never'}
`;

    const prompt = `You are a healthcare marketing AI analyst. Analyze this lead's profile and engagement data to provide actionable insights.

LEAD PROFILE:
- Name: ${lead.name}
- Age: ${lead.age || 'Not provided'}
- City: ${lead.city}
- Organization Type: ${lead.org_type}
- Language: ${lead.lang}
- Current Persona: ${lead.persona_id || 'Not classified'}

ENGAGEMENT DATA:
${engagementSummary}

ANALYSIS TASK:
1. Assess engagement level (high/medium/low) and explain why
2. Predict likelihood to convert (high/medium/low) with reasoning
3. Identify the most effective messaging approach for this lead
4. Suggest the best time to send next email (morning/afternoon/evening) based on profile
5. Recommend 2-3 specific actions to increase engagement

Return ONLY a JSON object:
{
  "engagement_level": "high|medium|low",
  "engagement_reasoning": "Brief explanation",
  "conversion_likelihood": "high|medium|low",
  "conversion_reasoning": "Brief explanation",
  "messaging_strategy": "Recommended messaging approach",
  "best_send_time": "morning|afternoon|evening",
  "recommended_actions": ["Action 1", "Action 2", "Action 3"]
}`;

    console.log(`Enriching lead ${lead_id} with AI insights`);

    const response = await fetch(`${AZURE_ENDPOINT}chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_KEY,
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: 'system', content: 'You are a healthcare marketing AI analyst specializing in lead analysis and predictive insights.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure OpenAI error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to generate lead insights' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse the JSON response
    let insights;
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      insights = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse Azure OpenAI response:', content);
      throw new Error('Invalid JSON response from AI');
    }

    console.log('Lead enrichment completed successfully');

    return new Response(
      JSON.stringify({
        lead_id,
        insights,
        generated_at: new Date().toISOString(),
        generated_by: 'azure-openai-grok-3'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in enrich-lead function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
