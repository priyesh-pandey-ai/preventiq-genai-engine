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

    // Get optional lead_ids from request body
    const requestBody = req.headers.get('content-type')?.includes('application/json') 
      ? await req.json() 
      : {};
    const specificLeadIds = requestBody.lead_ids;

    // Step 1: Get leads to process (not emailed in last 24 hours or never emailed)
    let query = supabase
      .from('leads')
      .select('id, name, email, city, org_type, lang, age, persona_id')
      .is('is_test', false);

    if (specificLeadIds && specificLeadIds.length > 0) {
      // Process specific leads if provided
      query = query.in('id', specificLeadIds);
    } else {
      // Default: process leads not emailed in 24h
      query = query
        .or('last_email_sent_at.is.null,last_email_sent_at.lt.' + new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(10); // Process max 10 leads per run (with 7s delay = ~70s total)
    }

    const { data: leadsToEmail, error: leadsError } = await query;

    if (leadsError) throw leadsError;

    if (!leadsToEmail || leadsToEmail.length === 0) {
      console.log('No leads found to email');
      return new Response(
        JSON.stringify({ message: 'No leads to process', processed: 0, campaigns: [] }),
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

        // Step 2f: Prepare campaign data
        const campaignItem = {
          lead_id: lead.id,
          lead_name: lead.name,
          lead_email: lead.email,
          persona_id: archetype,
          variant_id: selectedVariant.id,
          subject: selectedVariant.content,
          lang: lead.lang || 'en',
          email_content: emailContent,
          ai_generated: emailContent !== getPersonaEmailContent(archetype, lead.lang || 'en', lead.name),
        };

        campaignData.push(campaignItem);

        // Step 2g: Create assignment record BEFORE sending email
        const { data: assignment, error: assignmentError } = await supabase
          .from('assignments')
          .insert({
            lead_id: lead.id,
            persona_id: archetype,
            variant_id: selectedVariant.id,
            status: 'pending',
          })
          .select()
          .single();

        if (assignmentError) {
          console.error(`Error creating assignment for lead ${lead.id}:`, assignmentError);
          continue;
        }

        console.log(`Created assignment ${assignment.id} for lead ${lead.id}`);

        // Step 2h: Send email via Brevo API
        const brevoApiKey = Deno.env.get('BREVO_API_KEY');
        if (!brevoApiKey) {
          console.error('BREVO_API_KEY not set, skipping email send');
          continue;
        }

        try {
          const trackingUrl = `${supabaseUrl}/functions/v1/track-click/${assignment.id}`;
          
          const emailBody = {
            sender: {
              name: "PreventIQ",
              email: "p24priyesh@gmail.com"
            },
            to: [{
              email: lead.email,
              name: lead.name
            }],
            subject: selectedVariant.content,
            htmlContent: `<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;'><div style='background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);'><p style='font-size: 16px; color: #333; margin-bottom: 15px;'>${emailContent.greeting || 'Hello there,'}</p><p style='font-size: 15px; color: #555; line-height: 1.6; margin-bottom: 15px;'>${emailContent.body_paragraph_1 || emailContent.intro || 'We have something special for you.'}</p><p style='font-size: 15px; color: #555; line-height: 1.6; margin-bottom: 20px;'>${emailContent.body_paragraph_2 || emailContent.body || ''}</p><div style='text-align: center; margin: 30px 0;'><a href='${trackingUrl}' style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);'>${emailContent.call_to_action || emailContent.cta || 'Learn More'}</a></div><p style='font-size: 14px; color: #777; font-style: italic; margin-top: 20px;'>${emailContent.closing || 'Your health matters to us.'}</p><div style='margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;'><p style='font-size: 14px; color: #999; margin: 5px 0;'>Best regards,</p><p style='font-size: 14px; color: #999; margin: 5px 0; font-weight: 600;'>The PreventIQ Team</p></div></div><div style='text-align: center; margin-top: 20px;'><p style='font-size: 12px; color: #999;'>✨ ${campaignItem.ai_generated ? 'Personalized with AI' : 'Crafted for you'} ✨</p></div></div>`,
            tags: [`campaign`, `persona_${archetype}`, `variant_${selectedVariant.id}`, campaignItem.ai_generated ? 'ai-generated' : 'template']
          };

          const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'api-key': brevoApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailBody),
          });

          if (!brevoResponse.ok) {
            const errorText = await brevoResponse.text();
            throw new Error(`Brevo API error: ${brevoResponse.status} - ${errorText}`);
          }

          const brevoResult = await brevoResponse.json();
          console.log(`Email sent via Brevo for lead ${lead.id}, messageId: ${brevoResult.messageId}`);

          // Step 2i: Update assignment with message_id and status
          await supabase
            .from('assignments')
            .update({
              message_id: brevoResult.messageId,
              status: 'sent',
            })
            .eq('id', assignment.id);

          // Step 2j: Update last_email_sent_at timestamp
          await supabase
            .from('leads')
            .update({ last_email_sent_at: new Date().toISOString() })
            .eq('id', lead.id);

          console.log(`Successfully sent email to ${lead.email}`);

        } catch (emailError) {
          console.error(`Error sending email for lead ${lead.id}:`, emailError);
          
          // Update assignment status to failed
          await supabase
            .from('assignments')
            .update({ status: 'failed' })
            .eq('id', assignment.id);

          throw emailError;
        }

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
