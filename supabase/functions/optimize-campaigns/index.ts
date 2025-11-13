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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get campaign performance data
    const { data: kpis } = await supabase.rpc('get_campaign_kpis', {
      p_start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      p_end_date: new Date().toISOString(),
    });

    // Get variant performance
    const { data: variantStats } = await supabase
      .from('variant_stats')
      .select('*');

    // Get recent assignments
    const { data: recentAssignments } = await supabase
      .from('assignments')
      .select('id, persona_id, sent_at, status')
      .order('sent_at', { ascending: false })
      .limit(100);

    const AZURE_ENDPOINT = Deno.env.get('AZURE_OPENAI_ENDPOINT');
    const AZURE_KEY = Deno.env.get('AZURE_OPENAI_KEY');
    const MODEL_NAME = Deno.env.get('AZURE_MODEL_NAME') || 'grok-3';
    
    if (!AZURE_ENDPOINT || !AZURE_KEY) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const kpiSummary = kpis?.map(k => 
      `${k.persona_id}: ${k.total_sends} emails, ${k.total_clicks} clicks, ${(Number(k.ctr) * 100).toFixed(1)}% CTR`
    ).join('\n') || 'No campaign data available';

    const variantPerformance = variantStats?.slice(0, 10).map(v => 
      `Variant ${v.variant_id}: Alpha=${v.alpha}, Beta=${v.beta}, Estimated CTR=${((v.alpha / (v.alpha + v.beta)) * 100).toFixed(1)}%`
    ).join('\n') || 'No variant data available';

    const prompt = `You are an AI-powered marketing optimization consultant specializing in healthcare campaigns. Analyze the following campaign performance data and provide strategic recommendations.

CAMPAIGN PERFORMANCE (Last 30 Days):
${kpiSummary}

TOP VARIANT PERFORMANCE (Thompson Sampling Stats):
${variantPerformance}

RECENT ACTIVITY:
Total recent sends: ${recentAssignments?.length || 0}
Active personas: ${new Set(recentAssignments?.map(a => a.persona_id) || []).size}

OPTIMIZATION TASK:
1. Identify the top 3 opportunities for improvement
2. Suggest specific actions to increase engagement for underperforming personas
3. Recommend new testing strategies (e.g., new subject line themes, send times, content formats)
4. Predict which persona has the highest growth potential and why
5. Provide 5 innovative campaign ideas that leverage AI and personalization
6. Suggest metrics to track for continuous improvement

Return ONLY a JSON object:
{
  "top_opportunities": [
    {"issue": "Description", "impact": "high|medium|low", "action": "Specific recommendation"}
  ],
  "persona_optimization": {
    "underperforming_personas": ["ARCH_XXX"],
    "recommended_actions": ["Action 1", "Action 2"]
  },
  "testing_strategies": ["Strategy 1", "Strategy 2", "Strategy 3"],
  "growth_potential": {
    "persona_id": "ARCH_XXX",
    "reasoning": "Why this persona has potential"
  },
  "innovative_ideas": [
    {"idea": "Campaign concept", "ai_feature": "How AI enhances it", "expected_impact": "Predicted outcome"}
  ],
  "success_metrics": ["Metric 1", "Metric 2", "Metric 3"]
}`;

    console.log('Generating AI-powered campaign optimization recommendations...');

    const response = await fetch(`${AZURE_ENDPOINT}chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_KEY,
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: 'system', content: 'You are an expert healthcare marketing AI consultant with deep knowledge of campaign optimization, personalization strategies, and AI-driven marketing.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure OpenAI error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to generate optimization recommendations' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse the JSON response
    let recommendations;
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      recommendations = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Invalid JSON response from AI');
    }

    console.log('Campaign optimization recommendations generated successfully');

    return new Response(
      JSON.stringify({
        recommendations,
        generated_at: new Date().toISOString(),
        generated_by: 'azure-openai-grok-3',
        data_period: 'last_30_days'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in optimize-campaigns function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
