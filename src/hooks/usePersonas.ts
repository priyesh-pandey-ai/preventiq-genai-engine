import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Persona {
  id: string;
  label: string;
  description: string;
  lang?: string;
  channels?: string[];
  tone_defaults?: string[];
  is_archetype?: boolean;
}

export const usePersonas = () => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPersonas = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('personas')
        .select('*')
        .eq('is_archetype', true)
        .order('id');

      if (fetchError) throw fetchError;

      setPersonas(data || []);
    } catch (err) {
      console.error("Error fetching personas:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch personas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonas();

    // Subscribe to changes
    const subscription = supabase
      .channel('personas-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'personas' },
        () => fetchPersonas()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { personas, loading, error, refetch: fetchPersonas };
};
