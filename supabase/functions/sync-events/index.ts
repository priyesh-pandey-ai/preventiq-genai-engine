import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Resend webhook event types
// https://resend.com/docs/api-reference/webhooks/event-types
interface ResendEvent {
  type: 'email.sent' | 'email.delivered' | 'email.delivery_delayed' | 'email.complained' | 'email.bounced' | 'email.opened' | 'email.clicked';
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    click?: {
      link: string;
      timestamp: string;
    };
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();

    // Handle Resend webhook events directly
    // Resend sends events one at a time to the webhook
    if (body.type && body.data) {
      console.log(`Received Resend webhook: ${body.type}`);
      
      const event = body as ResendEvent;
      
      try {
        // Find assignment by Resend email ID (corr_id)
        const { data: assignment, error: assignmentError } = await supabase
          .from('assignments')
          .select('id, persona_id, variant_subject_id, lead_id')
          .eq('corr_id', event.data.email_id)
          .single();

        if (assignmentError || !assignment) {
          console.warn(`Assignment not found for email_id: ${event.data.email_id}`);
          return new Response(
            JSON.stringify({ message: 'Assignment not found', email_id: event.data.email_id }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Map Resend event types to our event types
        let eventType: string;
        let shouldUpdateStats = false;

        switch (event.type) {
          case 'email.sent':
            eventType = 'sent';
            await supabase
              .from('assignments')
              .update({ status: 'sent', sent_at: new Date(event.created_at).toISOString() })
              .eq('id', assignment.id);
            break;
          
          case 'email.delivered':
            eventType = 'delivered';
            await supabase
              .from('assignments')
              .update({ status: 'delivered' })
              .eq('id', assignment.id);
            break;
          
          case 'email.opened':
            eventType = 'open';
            break;
          
          case 'email.clicked':
            eventType = 'click';
            shouldUpdateStats = true;
            break;
          
          case 'email.bounced':
          case 'email.complained':
          case 'email.delivery_delayed':
            eventType = 'failed';
            await supabase
              .from('assignments')
              .update({ status: 'failed' })
              .eq('id', assignment.id);
            break;
          
          default:
            eventType = 'other';
        }

        // Insert event (ON CONFLICT DO NOTHING prevents duplicates)
        const { error: eventInsertError } = await supabase
          .from('events')
          .insert({
            assignment_id: assignment.id,
            type: eventType,
            meta: {
              resend_event: event.type,
              email_id: event.data.email_id,
              link: event.data.click?.link,
              to: event.data.to[0],
            },
            ts: new Date(event.created_at).toISOString(),
          });

        // Ignore duplicate key errors (23505)
        if (eventInsertError && eventInsertError.code !== '23505') {
          console.error(`Error inserting event:`, eventInsertError);
          throw eventInsertError;
        }

        // Update variant stats for bandit algorithm
        if (shouldUpdateStats && assignment.variant_subject_id) {
          // Increment alpha (success count) for clicks
          const { error: alphaError } = await supabase.rpc('increment_variant_alpha', {
            p_persona_id: assignment.persona_id,
            p_variant_id: assignment.variant_subject_id,
          });

          if (alphaError) {
            console.error(`Error incrementing alpha:`, alphaError);
          } else {
            console.log(`Incremented alpha for variant ${assignment.variant_subject_id}`);
          }
        } else if (eventType === 'delivered' && assignment.variant_subject_id) {
          // Check if there's already a click event
          const { data: existingClick } = await supabase
            .from('events')
            .select('id')
            .eq('assignment_id', assignment.id)
            .eq('type', 'click')
            .single();

          // Only increment beta if no click has happened yet
          if (!existingClick) {
            const { error: betaError } = await supabase.rpc('increment_variant_beta', {
              p_persona_id: assignment.persona_id,
              p_variant_id: assignment.variant_subject_id,
            });

            if (betaError) {
              console.error(`Error incrementing beta:`, betaError);
            }
          }
        }

        console.log(`Processed ${event.type} event for assignment ${assignment.id}`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Event processed',
            event_type: eventType,
            assignment_id: assignment.id,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (error) {
        console.error('Error processing Resend event:', error);
        
        // Log to error_log table
        await supabase.from('error_log').insert({
          workflow_name: 'sync-events',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          payload: event,
        });

        throw error;
      }
    }

    // Legacy support: Batch processing via n8n (if needed)
    const { action, events } = body;

    if (action === 'get_cursor') {
      console.log('Getting cursor for event sync...');

      const { data: syncState, error: cursorError } = await supabase
        .from('sync_state')
        .select('last_ts')
        .eq('source', 'email_events')
        .single();

      if (cursorError && cursorError.code !== 'PGRST116') {
        throw cursorError;
      }

      const lastTs = syncState?.last_ts || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      return new Response(
        JSON.stringify({
          last_ts: lastTs,
          message: 'Cursor retrieved (for manual polling if needed)',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Invalid request
    return new Response(
      JSON.stringify({ error: 'Invalid request. Expected Resend webhook event or action parameter.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-events function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
