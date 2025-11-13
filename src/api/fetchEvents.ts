import { supabase } from '../supabaseClient';

export async function fetchUserEvents(userEmail: string) {
  const { data, error } = await supabase
    .from('events')
    .select('event_type, meta, ts')
    .eq('email', userEmail)
    .order('ts', { ascending: false });

  if (error) {
    console.error('Error fetching events:', error);
    throw error;
  }

  return data;
}