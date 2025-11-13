import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getPersonaEmailContent } from '../shared/persona-templates.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Thompson Sampling: Beta distribution sampler
function betaSample(alpha: number, beta: number): number {
  // Simple approximation using normal distribution for large alpha+beta
  if (alpha + beta > 50) {
    const mean = alpha / (alpha + beta);
    const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));
    const stdDev = Math.sqrt(variance);
    // Generate standard normal random variable (Box-Muller transform)
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return Math.max(0, Math.min(1, mean + z * stdDev));
  }
  
  // For small samples, use simple random between 0 and 1
  // (For production, use a proper Beta sampler library)
  return Math.random();
}

// Bandit algorithm: Explore (uniform random) vs Exploit (Thompson Sampling)
function selectVariant(
  variants: Array<{id: string; content: string}>,
  stats: { [key: string]: { alpha: number; beta: number } },
  totalClicks: number,
  threshold: number = 50
) {
  if (variants.length === 0) {
    throw new Error('No variants available for selection');
  }

  // Phase 1: Explore - Use uniform random selection
  if (totalClicks < threshold) {
    const randomIndex = Math.floor(Math.random() * variants.length);
    return variants[randomIndex];
  }

  // Phase 2: Exploit - Use Thompson Sampling
  let bestVariant = null;
  let bestSample = 0;

  for (const variant of variants) {
    const stat = stats[variant.id] || { alpha: 1, beta: 1 };
    const sample = betaSample(stat.alpha, stat.beta);

    if (sample > bestSample) {
      bestSample = sample;
      bestVariant = variant;
    }
  }

  return bestVariant || variants[0]; // Fallback to first variant
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting campaign send process...');

    // Step 1: Get leads to process (not emailed in last 24 hours or never emailed)
    const { data: leadsToEmail, error: leadsError } = await supabase
      .from('leads')
      .select('id, name, email, city, org_type, lang, age, persona_id')
      .is('is_test', false)
      .or('last_email_sent_at.is.null,last_email_sent_at.lt.' + new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(10); // Process max 10 leads per run (with 7s delay = ~70s total)

    if (leadsError) throw leadsError;

    if (!leadsToEmail || leadsToEmail.length === 0) {
      console.log('No leads found to email');
      return new Response(
        JSON.stringify({ message: 'No leads to process', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${leadsToEmail.length} leads to process`);

    const campaignData = [];

    // Step 2: Process each lead (with delay to avoid API rate limits)
    for (let i = 0; i < leadsToEmail.length; i++) {
      const lead = leadsToEmail[i];
      
      // Add 7-second delay between leads to stay under rate limits
      if (i > 0) {
        console.log(`Waiting 7 seconds before processing lead ${i + 1}/${leadsToEmail.length}...`);
        await new Promise(resolve => setTimeout(resolve, 7000));
      }
      
      try {
        let archetype = lead.persona_id;
        
        // Step 2a: Classify lead into persona if not already classified
        if (!archetype) {
          console.log(`Classifying lead ${lead.id}...`);
          
          const classifyResponse = await fetch(`${supabaseUrl}/functions/v1/classify-persona`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              lead_id: lead.id,
              city: lead.city,
              org_type: lead.org_type,
              age: lead.age,
              lang: lead.lang,
            }),
          });

          if (!classifyResponse.ok) {
            console.error(`Classification failed for lead ${lead.id}`);
            continue;
          }

          const classifyResult = await classifyResponse.json();
          archetype = classifyResult.archetype;
          console.log(`Lead ${lead.id} classified as ${archetype} (${classifyResult.method || 'unknown'})`);
          
          // Update lead with persona_id
          await supabase
            .from('leads')
            .update({ persona_id: archetype })
            .eq('id', lead.id);
        } else {
          console.log(`Lead ${lead.id} already has persona ${archetype}`);
        }

        // Step 2b: Get or create variants for this persona
        const { data: existingVariants } = await supabase
          .from('variants')
          .select('*')
          .eq('persona_id', archetype)
          .eq('lang', lead.lang || 'en')
          .limit(3);

        let variants = existingVariants || [];

        // If no variants exist, generate them
        if (variants.length === 0) {
          console.log(`Generating variants for persona ${archetype}...`);
          
          const subjectsResponse = await fetch(`${supabaseUrl}/functions/v1/generate-subjects`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              category: 'Preventive Health',
              lang: lead.lang || 'en',
            }),
          });

          if (subjectsResponse.ok) {
            const { subjects } = await subjectsResponse.json();
            
            const newVariants = [];
            // Store variants in database
            for (const subject of subjects) {
              const variantId = `${archetype}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              const { data: newVariant } = await supabase
                .from('variants')
                .insert({
                  id: variantId,
                  persona_id: archetype,
                  channel: 'email',
                  tone: 'professional',
                  lang: lead.lang || 'en',
                  content: subject,
                })
                .select()
                .single();

              if (newVariant) {
                newVariants.push(newVariant);
              }
            }
            variants = newVariants;
          }
        }

        if (variants.length === 0) {
          console.error(`No variants available for persona ${archetype}`);
          continue;
        }

        // Step 2c: Get variant stats and total clicks for bandit algorithm
        const { data: statsData } = await supabase
          .from('variant_stats')
          .select('*')
          .eq('persona_id', archetype);

        const stats: { [key: string]: { alpha: number; beta: number } } = {};
        statsData?.forEach(stat => {
          stats[stat.variant_id] = { alpha: stat.alpha, beta: stat.beta };
        });

        const { data: totalClicksData } = await supabase
          .rpc('get_total_clicks_for_persona', { p_persona_id: archetype });

        const totalClicks = totalClicksData || 0;

        // Step 2d: Select variant using bandit algorithm
        const selectedVariant = selectVariant(variants, stats, totalClicks);
        console.log(`Selected variant ${selectedVariant.id} for lead ${lead.id}`);

        // Step 2e: Generate AI-powered email body content
        console.log(`Generating AI email body for lead ${lead.id}...`);
        let emailContent;
        
        try {
          const bodyResponse = await fetch(`${supabaseUrl}/functions/v1/generate-email-body`, {
            method: 'POST',
            headers: {
              'Authorization': `******
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              persona_id: archetype,
              lead_name: lead.name,
              lang: lead.lang || 'en',
              subject_line: selectedVariant.content,
            }),
          });

          if (bodyResponse.ok) {
            const bodyData = await bodyResponse.json();
            emailContent = bodyData.email_content;
            console.log(`AI email content generated for lead ${lead.id}`);
          } else {
            // Fallback to static template if AI fails
            console.warn(`AI email generation failed for lead ${lead.id}, using fallback`);
            emailContent = getPersonaEmailContent(archetype, lead.lang || 'en', lead.name);
          }
        } catch (bodyError) {
          console.error(`Error generating AI email body for lead ${lead.id}:`, bodyError);
          // Fallback to static template
          emailContent = getPersonaEmailContent(archetype, lead.lang || 'en', lead.name);
        }

        // Step 2f: Prepare campaign data for n8n/Brevo
        campaignData.push({
          lead_id: lead.id,
          lead_name: lead.name,
          lead_email: lead.email,
          persona_id: archetype,
          variant_id: selectedVariant.id,
          subject: selectedVariant.content,
          lang: lead.lang || 'en',
          email_content: emailContent,
          ai_generated: emailContent !== getPersonaEmailContent(archetype, lead.lang || 'en', lead.name),
        });

        // Step 2g: Update last_email_sent_at timestamp
        await supabase
          .from('leads')
          .update({ last_email_sent_at: new Date().toISOString() })
          .eq('id', lead.id);

      } catch (error) {
        console.error(`Error processing lead ${lead.id}:`, error);
        
        // Log error to database
        await supabase.from('error_log').insert({
          workflow_name: 'campaign-send',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          payload: { lead_id: lead.id },
        });
      }
    }

    console.log(`Campaign send prepared for ${campaignData.length} leads`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Prepared ${campaignData.length} campaigns`,
        campaigns: campaignData,
        stats: {
          total_leads_checked: leadsToEmail.length,
          processed: campaignData.length,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in campaign-send function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
