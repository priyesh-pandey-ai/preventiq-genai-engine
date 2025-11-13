import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { User, Mail, MapPin, Building2, Activity, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Customer {
  id: number;
  name: string;
  email: string;
  city: string;
  org_type: string;
  lang: string;
  created_at: string;
  persona_id?: string;
  persona_label?: string;
}

export const CustomerList = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        // Fetch leads with their persona assignments
        const { data: leads, error: leadsError } = await supabase
          .from('leads')
          .select('id, name, email, city, org_type, lang, created_at')
          .order('created_at', { ascending: false })
          .limit(50);

        if (leadsError) throw leadsError;

        // Fetch assignments to get persona info
        const { data: assignments, error: assignmentsError } = await supabase
          .from('assignments')
          .select('lead_id, persona_id, personas(label)');

        if (assignmentsError) throw assignmentsError;

        // Create a map of lead_id to persona info
        const personaMap = new Map();
        assignments?.forEach((assignment: { lead_id: number; persona_id: string; personas: { label: string } | null }) => {
          if (!personaMap.has(assignment.lead_id)) {
            personaMap.set(assignment.lead_id, {
              persona_id: assignment.persona_id,
              persona_label: assignment.personas?.label
            });
          }
        });

        // Merge the data
        const customersWithPersonas = leads?.map(lead => ({
          ...lead,
          persona_id: personaMap.get(lead.id)?.persona_id,
          persona_label: personaMap.get(lead.id)?.persona_label
        })) || [];

        setCustomers(customersWithPersonas);
      } catch (error) {
        console.error("Error fetching customers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();

    // Subscribe to changes
    const subscription = supabase
      .channel('customers-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        () => fetchCustomers()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <Card className="p-6 bg-card border-2 border-border/50 rounded-xl">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (customers.length === 0) {
    return (
      <Card className="p-6 bg-card border-2 border-border/50 rounded-xl">
        <div className="text-center py-8">
          <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground mb-2">No Customers Yet</h3>
          <p className="text-sm text-muted-foreground">
            Import customers using the form above to get started
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card border-2 border-border/50 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-heading font-bold text-foreground">
          Customer List
        </h3>
        <Badge variant="secondary">
          {customers.length} total
        </Badge>
      </div>
      
      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-3">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="p-4 bg-background/50 rounded-lg border border-border/50 hover:border-primary/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{customer.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {customer.email}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-1">
                  {customer.persona_label ? (
                    <Badge variant="outline" className="bg-healthcare-blue/10 text-healthcare-blue border-healthcare-blue/30">
                      <Activity className="h-3 w-3 mr-1" />
                      {customer.persona_label}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-muted/50 text-muted-foreground">
                      Not Assigned
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{customer.city}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  <span>{customer.org_type}</span>
                </div>
              </div>
              
              <div className="mt-2 text-xs text-muted-foreground">
                Added: {new Date(customer.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
