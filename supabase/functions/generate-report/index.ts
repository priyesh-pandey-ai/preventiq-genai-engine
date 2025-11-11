import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KPIRow {
  persona_id: string;
  persona_label: string;
  total_sends: number;
  total_clicks: number;
  ctr: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const AZURE_ENDPOINT = Deno.env.get('AZURE_OPENAI_ENDPOINT')!;
    const AZURE_KEY = Deno.env.get('AZURE_OPENAI_KEY')!;
    const MODEL_NAME = Deno.env.get('AZURE_MODEL_NAME')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get date range from request (default to last 7 days)
    const { start_date, end_date } = await req.json().catch(() => ({}));
    
    const startDate = start_date || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = end_date || new Date().toISOString();

    console.log(`Generating report for ${startDate} to ${endDate}`);

    // Step 1: Get campaign KPIs
    const { data: kpis, error: kpisError } = await supabase.rpc('get_campaign_kpis', {
      p_start_date: startDate,
      p_end_date: endDate,
    }) as { data: KPIRow[] | null; error: any };

    if (kpisError) {
      console.error('Error fetching KPIs:', kpisError);
      throw kpisError;
    }

    if (!kpis || kpis.length === 0) {
      return new Response(
        JSON.stringify({
          message: 'No campaign data available for this date range',
          kpis: [],
          pmf_score: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('KPIs fetched:', kpis);

    // Step 2: Calculate PMF score
    const { data: pmfScore, error: pmfError } = await supabase.rpc('calculate_pmf_score', {
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (pmfError) {
      console.error('Error calculating PMF score:', pmfError);
    }

    const finalPmfScore = pmfScore || 0;
    console.log('PMF Score:', finalPmfScore);

    // Step 3: Calculate global CTR
    const totalSends = kpis.reduce((sum, row) => sum + Number(row.total_sends), 0);
    const totalClicks = kpis.reduce((sum, row) => sum + Number(row.total_clicks), 0);
    const globalCtr = totalSends > 0 ? totalClicks / totalSends : 0;

    // Step 4: Find best performing persona
    const sortedKpis = [...kpis].sort((a, b) => Number(b.ctr) - Number(a.ctr));
    const bestPersona = sortedKpis[0];

    // Step 5: Generate AI insights using Azure OpenAI
    const kpiSummary = kpis.map(k => 
      `${k.persona_label}: ${k.total_sends} sends, ${k.total_clicks} clicks, ${(Number(k.ctr) * 100).toFixed(1)}% CTR`
    ).join('\n');

    const aiPrompt = `You are a marketing analyst. Based on the following campaign data, write a brief, insightful summary (under 100 words) explaining which persona was most engaged and why you think that is.
Then, propose 3 new, creative email subject lines tailored to the best-performing persona.

DATA:
${kpiSummary}

Best Persona: ${bestPersona.persona_label} (${bestPersona.persona_id})
Global CTR: ${(globalCtr * 100).toFixed(1)}%
PMF Score: ${(finalPmfScore * 100).toFixed(1)}%

Return only a single, valid JSON object with two keys: "summary" (string) and "next_ideas" (an array of 3 strings).`;

    console.log('Calling Azure OpenAI for insights...');

    const aiResponse = await fetch(
      `${AZURE_ENDPOINT}chat/completions`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'api-key': AZURE_KEY
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages: [{ role: 'user', content: aiPrompt }],
          temperature: 0.7,
          max_tokens: 512,
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Azure OpenAI API error:', errorText);
      throw new Error(`Azure OpenAI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error('No content in Azure OpenAI response');
    }

    // Parse Azure OpenAI response
    let insights: { summary: string; next_ideas: string[] };
    try {
      const cleanContent = aiContent.replace(/```json\n?|\n?```/g, '').trim();
      insights = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', geminiContent);
      // Fallback insights
      insights = {
        summary: `The ${bestPersona.persona_label} persona showed the highest engagement with a ${(Number(bestPersona.ctr) * 100).toFixed(1)}% click-through rate. This suggests that personalized messaging resonates well with this audience segment.`,
        next_ideas: [
          'Take control of your health journey today',
          'Your personalized wellness plan is ready',
          'Science-backed prevention strategies for you',
        ],
      };
    }

    console.log('Report generated successfully');

    // Step 6: Return complete report data
    return new Response(
      JSON.stringify({
        success: true,
        report: {
          date_range: {
            start: startDate,
            end: endDate,
          },
          kpis: kpis.map(k => ({
            persona_id: k.persona_id,
            persona_label: k.persona_label,
            total_sends: Number(k.total_sends),
            total_clicks: Number(k.total_clicks),
            ctr: Number(k.ctr),
            ctr_percent: `${(Number(k.ctr) * 100).toFixed(1)}%`,
          })),
          metrics: {
            total_sends: totalSends,
            total_clicks: totalClicks,
            global_ctr: globalCtr,
            global_ctr_percent: `${(globalCtr * 100).toFixed(1)}%`,
            pmf_score: finalPmfScore,
            pmf_score_percent: `${(finalPmfScore * 100).toFixed(1)}%`,
          },
          best_persona: {
            id: bestPersona.persona_id,
            label: bestPersona.persona_label,
            ctr: Number(bestPersona.ctr),
          },
          insights: {
            summary: insights.summary,
            next_subject_lines: insights.next_ideas,
          },
          generated_at: new Date().toISOString(),
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-report function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
