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
    const { user_id } = await req.json();

    // Only marketers (authenticated users) receive welcome emails
    // Leads receive campaign emails via the campaign-send workflow
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
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

    // Get user email from auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id);
    
    if (userError || !userData?.user) {
      throw new Error('User not found');
    }

    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      throw new Error('Profile not found');
    }

    const email = userData.user.email || '';
    // Resolve name with fallbacks: profiles -> auth user metadata -> raw meta -> email local-part
    const rawNameFromUserMeta = (userData.user as any)?.user_metadata?.name || (userData.user as any)?.raw_user_meta_data?.name;
    const derivedNameFromEmail = email ? email.split('@')[0].replace(/[._\-]/g, ' ') : '';
    let name = profile.name || rawNameFromUserMeta || derivedNameFromEmail || 'there';
    const orgType = profile.org_type || 'your organization';

    // Basic HTML escape to avoid injection in the email body
    const escapeHtml = (str: string) =>
      str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');

    name = escapeHtml(name);
    
    console.log('Sending marketer welcome email to:', email);

  // Build a safe subject that includes the recipient's name (using raw value, not HTML-escaped)
  const subjectName = (profile.name || rawNameFromUserMeta || derivedNameFromEmail || 'there').toString().trim();
  const emailSubject = `Welcome to PreventIQ, ${subjectName} — Your Elite Healthcare Marketing Partner`;

  const loginLink = `${supabaseUrl.replace('https://', 'https://app.')}/dashboard`;

  const emailBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Welcome to PreventIQ</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body { margin: 0; padding: 0; background-color: #F8F9FA; font-family: 'Inter', Arial, sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    a { text-decoration: none; }
    .header-bg { background-color: #0D3B66; }
    .main-card { background-color: #FFFFFF; border-radius: 10px; padding: 40px; box-shadow: 0 10px 30px -10px rgba(13, 59, 102, 0.2); }
    .headline { font-family: 'Playfair Display', serif; font-size: 32px !important; font-weight: 700; color: #1A2B4C; margin: 0 0 20px 0; }
    .subtext { font-family: 'Inter', Arial, sans-serif; font-size: 16px; line-height: 1.7; color: #334E68; margin: 0 0 25px 0; }
    .cta-button a { font-family: 'Inter', Arial, sans-serif; font-size: 17px; font-weight: 600; color: #FFFFFF; text-decoration: none; padding: 16px 35px; display: inline-block; border-radius: 8px; background-image: linear-gradient(to right, #2C7A7B 0%, #38B2AC 100%); box-shadow: 0 4px 15px rgba(44, 122, 123, 0.4); }
    .section-title { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: #1A2B4C; margin: 40px 0 20px 0; border-top: 1px solid #E0EFFF; padding-top: 30px; }
    .step-table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
    .step-icon { padding-right: 20px; vertical-align: top; }
    .step-text strong { font-family: 'Inter', Arial, sans-serif; font-size: 16px; font-weight: 700; color: #1A2B4C; display: block; margin-bottom: 5px; }
    .step-text { font-family: 'Inter', Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #334E68; }
    .footer-text { font-family: 'Inter', Arial, sans-serif; font-size: 12px; line-height: 1.6; color: #718096; }
    .link-style { color: #38B2AC; text-decoration: underline; }
    @media screen and (max-width: 600px) { .container { width: 100% !important; padding: 0 15px !important; } .main-card { padding: 30px !important; } .headline { font-size: 26px !important; } .subtext { font-size: 15px !important; line-height: 1.5 !important; } .cta-button a { padding: 14px 25px !important; font-size: 15px !important; } .section-title { font-size: 20px !important; } }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F9FA; font-family: 'Inter', Arial, sans-serif;">
  <span style="display: none; font-size: 1px; color: #F8F9FA; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden;">Unlock sophisticated healthcare marketing with PreventIQ.</span>
  <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #F8F9FA; padding: 30px 0;">
    <tr>
      <td align="center">
        <table class="container" width="600" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 600px; margin: 0 auto;">
          <tr>
            <td align="center" class="header-bg" style="padding: 25px 0; border-top-left-radius: 10px; border-top-right-radius: 10px;">
              <img src="https://res.cloudinary.com/dejaektkc/image/upload/ar_1:1,c_auto,g_auto,h_300,w_300/samples/food/dessert" alt="PreventIQ Logo" width="60" style="display: block; border: 0; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.2); outline: 2px solid #38B2AC;">
            </td>
          </tr>
          <tr>
            <td class="main-card" align="left">
              <h1 class="headline">Your Elite Journey with PreventIQ Begins!</h1>
              <p class="subtext">Dear ${name},</p>
              <p class="subtext">We are delighted to welcome you to the PreventIQ family. You are now equipped with an intelligent platform designed to elevate your preventive healthcare campaigns with unparalleled precision and personalization.</p>
              <p class="subtext">Prepare to transform how you connect with patients, drive engagement, and effortlessly fill your appointment schedules. This is not just marketing; it's a strategic advantage.</p>
              <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto 30px auto;"><tr><td align="center"><a href="${loginLink}" target="_blank" class="cta-button-link" style="font-family: 'Inter', Arial, sans-serif; font-size: 17px; font-weight: 600; color: #FFFFFF; text-decoration: none; padding: 16px 35px; display: inline-block; border-radius: 8px; background-image: linear-gradient(to right, #2C7A7B 0%, #38B2AC 100%); box-shadow: 0 4px 15px rgba(44, 122, 123, 0.4);">Access Your Exclusive Dashboard</a></td></tr></table>
              <h2 class="section-title">Your Next Steps to Success:</h2>
              <table class="step-table" border="0" cellpadding="0" cellspacing="0" role="presentation"><tr><td class="step-icon" width="50"><img src="https://placehold.co/40x40/E6FFFA/2C7A7B?text=1&font=Playfair%20Display" alt="1" width="40" style="display: block; border-radius: 50%;"></td><td class="step-text"><strong>Initiate Your First Campaign</strong>Log in and let our advanced AI begin classifying your audience for tailored engagement.</td></tr></table>
              <table class="step-table" border="0" cellpadding="0" cellspacing="0" role="presentation"><tr><td class="step-icon" width="50"><img src="https://placehold.co/40x40/E6FFFA/2C7A7B?text=2&font=Playfair%20Display" alt="2" width="40" style="display: block; border-radius: 50%;"></td><td class="step-text"><strong>Master the Platform</strong>Explore our <a href="${loginLink}" target="_blank" class="link-style">concise onboarding guide</a> to maximize PreventIQ's potential.</td></tr></table>
              <table class="step-table" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 0;"><tr><td class="step-icon" width="50"><img src="https://placehold.co/40x40/E6FFFA/2C7A7B?text=3&font=Playfair%20Display" alt="3" width="40" style="display: block; border-radius: 50%;"></td><td class="step-text"><strong>Personalized Guidance</strong>Schedule a <a href="${loginLink}" target="_blank" class="link-style">private onboarding session</a> with our experts for bespoke support.</td></tr></table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 30px 20px;">
              <p class="footer-text">You received this esteemed communication as a valued new member of PreventIQ.</p>
              <p class="footer-text">PreventIQ, Inc. &bull; Innovate Hub, Bangalore, IN &bull; <a href="${loginLink}" target="_blank" class="link-style">Manage Preferences</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: 'PreventIQ <onboarding@resend.dev>',
      to: [email],
      subject: emailSubject,
      html: emailBody,
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: 'Welcome email sent' }),
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
