import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BrevoEvent {
  messageId: string;
  event: 'delivered' | 'opened' | 'clicked' | 'bounced' | 'spam' | 'invalid_email';
  email: string;
  date: string;
  subject?: string;
  link?: string;
  tag?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, events } = await req.json();

    // Action 1: Get cursor for n8n to poll Brevo API
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
          message: 'Use this timestamp to poll Brevo API',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action 2: Process events from n8n (after polling Brevo)
    if (action === 'process_events') {
      console.log(`Processing ${events?.length || 0} events from Brevo...`);

      if (!events || !Array.isArray(events) || events.length === 0) {
        return new Response(
          JSON.stringify({ message: 'No events to process', processed: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let processedCount = 0;
      let errorCount = 0;
      const errors: any[] = [];

      for (const event of events as BrevoEvent[]) {
        try {
          // Find assignment by Brevo message ID (corr_id)
          const { data: assignment, error: assignmentError } = await supabase
            .from('assignments')
            .select('id, persona_id, variant_subject_id, lead_id')
            .eq('corr_id', event.messageId)
            .single();

          if (assignmentError || !assignment) {
            console.warn(`Assignment not found for messageId: ${event.messageId}`);
            errorCount++;
            errors.push({ messageId: event.messageId, error: 'Assignment not found' });
            continue;
          }

          // Map Brevo event types to our event types
          let eventType: string;
          switch (event.event) {
            case 'delivered':
              eventType = 'delivered';
              // Update assignment status
              await supabase
                .from('assignments')
                .update({ status: 'delivered' })
                .eq('id', assignment.id);
              break;
            case 'opened':
              eventType = 'open';
              break;
            case 'clicked':
              eventType = 'click';
              break;
            case 'bounced':
            case 'spam':
            case 'invalid_email':
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
                brevo_event: event.event,
                link: event.link,
                tag: event.tag,
                email: event.email,
              },
              ts: new Date(event.date).toISOString(),
            });

          // Ignore duplicate key errors (23505)
          if (eventInsertError && eventInsertError.code !== '23505') {
            console.error(`Error inserting event for assignment ${assignment.id}:`, eventInsertError);
            errorCount++;
            errors.push({ messageId: event.messageId, error: eventInsertError.message });
            continue;
          }

          // Update variant stats for bandit algorithm
          if (eventType === 'click' && assignment.variant_subject_id) {
            // Increment alpha (success count)
            const { error: alphaError } = await supabase.rpc('increment_variant_alpha', {
              p_persona_id: assignment.persona_id,
              p_variant_id: assignment.variant_subject_id,
            });

            if (alphaError) {
              console.error(`Error incrementing alpha for variant ${assignment.variant_subject_id}:`, alphaError);
            } else {
              console.log(`Incremented alpha for variant ${assignment.variant_subject_id}`);
            }
          } else if (eventType === 'delivered' && assignment.variant_subject_id) {
            // Increment beta (failure count) - this is a send without a click (yet)
            // Note: We'll only increment beta once per assignment to avoid overcounting
            const { data: existingClick } = await supabase
              .from('events')
              .select('id')
              .eq('assignment_id', assignment.id)
              .eq('type', 'click')
              .single();

            if (!existingClick) {
              const { error: betaError } = await supabase.rpc('increment_variant_beta', {
                p_persona_id: assignment.persona_id,
                p_variant_id: assignment.variant_subject_id,
              });

              if (betaError) {
                console.error(`Error incrementing beta for variant ${assignment.variant_subject_id}:`, betaError);
              }
            }
          }

          processedCount++;
        } catch (error) {
          console.error('Error processing event:', error);
          errorCount++;
          errors.push({
            messageId: event.messageId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          // Log to error_log table
          await supabase.from('error_log').insert({
            workflow_name: 'sync-events',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            payload: event,
          });
        }
      }

      // Update sync_state cursor to current time
      const { error: updateCursorError } = await supabase
        .from('sync_state')
        .upsert({
          source: 'email_events',
          last_ts: new Date().toISOString(),
        });

      if (updateCursorError) {
        console.error('Error updating sync_state cursor:', updateCursorError);
      }

      console.log(`Event sync complete: ${processedCount} processed, ${errorCount} errors`);

      return new Response(
        JSON.stringify({
          success: true,
          processed: processedCount,
          errors: errorCount,
          error_details: errors.length > 0 ? errors : undefined,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Invalid action
    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "get_cursor" or "process_events"' }),
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
