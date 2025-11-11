import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Users, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Lead {
  id: number;
  name: string;
  email: string;
  city: string;
  org_type: string;
  created_at: string;
}

const RecentLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('leads')
          .select('id, name, email, city, org_type, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        setLeads(data || []);
      } catch (error) {
        console.error('Error fetching leads:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();

    // Set up real-time subscription
    const subscription = supabase
      .channel('recent-leads')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'leads' },
        () => fetchLeads()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <Card className="p-6 bg-card border-2 border-border/50 rounded-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-accent/10 rounded-lg">
          <Users className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h3 className="text-lg font-heading font-bold text-foreground">
            Recent Leads
          </h3>
          <p className="text-sm text-muted-foreground">
            Latest signups
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No leads yet</p>
          <p className="text-xs mt-1">New signups will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="p-3 bg-background/50 rounded-lg border border-border/50 hover:border-accent/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-foreground text-sm truncate">
                    {lead.name}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {lead.email}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {lead.city}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {lead.org_type}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(lead.created_at), 'MMM d, HH:mm')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default RecentLeads;
