import { supabase } from '@/integrations/supabase/client';

export async function fetchUserEvents(userEmail: string) {
  // First, get the lead_id from the email
  const { data: leads, error: leadError } = await supabase
    .from('leads')
    .select('id')
    .eq('email', userEmail);

  if (leadError) {
    console.error('Error fetching lead:', leadError);
    throw leadError;
  }

  if (!leads || leads.length === 0) {
    return [];
  }

  const leadIds = leads.map(l => l.id);

  // Get assignments for these leads
  const { data: assignments, error: assignmentError } = await supabase
    .from('assignments')
    .select('id')
    .in('lead_id', leadIds);

  if (assignmentError) {
    console.error('Error fetching assignments:', assignmentError);
    throw assignmentError;
  }

  if (!assignments || assignments.length === 0) {
    return [];
  }

  const assignmentIds = assignments.map(a => a.id);

  // Get events for these assignments
  const { data, error } = await supabase
    .from('events')
    .select('type, meta, ts')
    .in('assignment_id', assignmentIds)
    .order('ts', { ascending: false });

  if (error) {
    console.error('Error fetching events:', error);
    throw error;
  }

  return data;
}