import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get assignment_id from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const assignmentId = pathParts[pathParts.length - 1];

    if (!assignmentId || assignmentId === 'track-click') {
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${url.origin}/thanks`,
        },
      });
    }

    console.log('Tracking click for assignment:', assignmentId);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert click event (ON CONFLICT DO NOTHING prevents duplicates)
    const { error } = await supabase
      .from('events')
      .insert({
        assignment_id: parseInt(assignmentId),
        type: 'click',
        meta: {
          user_agent: req.headers.get('user-agent'),
          referer: req.headers.get('referer'),
        },
        ts: new Date().toISOString(),
      });

    if (error && error.code !== '23505') { // Ignore duplicate key errors
      console.error('Error inserting click event:', error);
    }

    // Update variant stats for bandit algorithm
    const { data: assignment } = await supabase
      .from('assignments')
      .select('persona_id, variant_subject_id')
      .eq('id', assignmentId)
      .single();

    if (assignment && assignment.variant_subject_id) {
      // Increment alpha (success count) for this variant
      await supabase.rpc('increment_variant_alpha', {
        p_persona_id: assignment.persona_id,
        p_variant_id: assignment.variant_subject_id,
      });
    }

    console.log('Click tracked successfully');

    // Redirect to thank you page
    const redirectUrl = `${url.origin}/thanks`;
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl,
      },
    });

  } catch (error) {
    console.error('Error in track-click function:', error);
    
    // Even on error, redirect to thanks page
    const url = new URL(req.url);
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `${url.origin}/thanks`,
      },
    });
  }
});
