import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2.0.0';

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

    // Initialize clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured. Please add RESEND_API_KEY secret.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    // Get lead details
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single();

    if (leadError || !lead) {
      throw new Error('Lead not found');
    }

    console.log('Sending welcome email to:', lead.email);

    // Classify the lead into a persona
    const { data: classifyData } = await supabase.functions.invoke('classify-persona', {
      body: {
        lead_id: lead.id,
        city: lead.city,
        org_type: lead.org_type,
        lang: lead.lang,
      },
    });

    const archetype = classifyData?.archetype || 'ARCH_PRO';
    console.log('Lead classified as:', archetype);

    // Get persona details
    const { data: persona } = await supabase
      .from('personas')
      .select('*')
      .eq('id', archetype)
      .single();

    // Generate personalized email content using AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    let emailSubject = '🎉 Welcome to PreventIQ - Your Healthcare Marketing Partner';
    let emailBody = `
      <h1>Welcome to PreventIQ, ${lead.name}!</h1>
      <p>Thank you for joining PreventIQ. We're excited to help ${lead.org_type} transform your healthcare marketing.</p>
      <p><strong>What happens next?</strong></p>
      <ul>
        <li>Our AI is analyzing your profile to create personalized campaigns</li>
        <li>You'll receive your first campaign preview within 24 hours</li>
        <li>Track engagement and optimize automatically</li>
      </ul>
      <p>Click below to explore your dashboard:</p>
      <p><a href="${supabaseUrl.replace('https://', 'https://app.')}/dashboard" style="display: inline-block; padding: 12px 24px; background: #00B5D8; color: white; text-decoration: none; border-radius: 6px;">Go to Dashboard</a></p>
      <p>Have questions? Reply to this email anytime.</p>
      <p>Best regards,<br>The PreventIQ Team</p>
    `;

    // If AI is available, generate personalized content
    if (LOVABLE_API_KEY && persona) {
      const prompt = `Generate a personalized welcome email for a ${persona.description} lead named ${lead.name} from ${lead.city} who runs a ${lead.org_type}.

The email should:
1. Be warm and professional
2. Highlight benefits relevant to their archetype
3. Include a clear next step
4. Be under 150 words

Return JSON: {"subject": "...", "body_html": "..."}`;

      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'You are a healthcare marketing expert. Always respond with valid JSON.' },
              { role: 'user', content: prompt }
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content;
          if (content) {
            const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
            const parsed = JSON.parse(cleanContent);
            if (parsed.subject && parsed.body_html) {
              emailSubject = parsed.subject;
              emailBody = parsed.body_html;
            }
          }
        }
      } catch (aiError) {
        console.error('AI generation failed, using default email:', aiError);
      }
    }

    // Build tracking URL
    const trackingUrl = `${supabaseUrl}/functions/v1/track-click`;

    // Create assignment record
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .insert({
        lead_id: lead.id,
        persona_id: archetype,
        status: 'sending',
      })
      .select()
      .single();

    if (assignmentError) {
      throw assignmentError;
    }

    // Add tracking link to email
    const clickTrackingLink = `${trackingUrl}/${assignment.id}`;
    emailBody = emailBody.replace(
      /href="([^"]+)"/g,
      `href="${clickTrackingLink}"`
    );

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: 'PreventIQ <onboarding@resend.dev>',
      to: [lead.email],
      subject: emailSubject,
      html: emailBody,
    });

    console.log('Email sent successfully:', emailResponse);

    const emailId = emailResponse.data?.id || 'unknown';

    // Update assignment with email ID
    await supabase
      .from('assignments')
      .update({
        corr_id: emailId,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', assignment.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Welcome email sent',
        email_id: emailId,
        assignment_id: assignment.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-welcome-email function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
