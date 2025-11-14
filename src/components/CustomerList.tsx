import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { User, Mail, MapPin, Building2, Activity, Loader2, Send, UserPlus, Sparkles, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  age?: number;
  last_email_sent_at?: string;
  ai_insights?: {
    engagement_level?: string;
    conversion_likelihood?: string;
    messaging_strategy?: string;
    best_send_time?: string;
  };
}

interface Persona {
  id: string;
  label: string;
}

export const CustomerList = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<{[key: number]: string}>({});

  const fetchCustomers = async () => {
    try {
      // Fetch leads with their persona info from leads table
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select(`
          id, 
          name, 
          email, 
          city, 
          org_type, 
          lang, 
          created_at, 
          persona_id,
          age,
          last_email_sent_at,
          ai_insights,
          personas(label)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (leadsError) throw leadsError;

      // Map the data
      const customersWithPersonas = leads?.map(lead => ({
        ...lead,
        persona_label: (lead.personas as any)?.label
      })) || [];

      setCustomers(customersWithPersonas);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonas = async () => {
    try {
      const { data, error } = await supabase
        .from('personas')
        .select('id, label')
        .eq('is_archetype', true)
        .order('label');

      if (error) throw error;
      setPersonas(data || []);
    } catch (error) {
      console.error("Error fetching personas:", error);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchPersonas();

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

  const handleClassifyPersona = async (leadId: number) => {
    setActionLoading(prev => ({ ...prev, [leadId]: 'classify' }));
    try {
      const lead = customers.find(c => c.id === leadId);
      if (!lead) return;

      const { data, error } = await supabase.functions.invoke('classify-persona', {
        body: {
          lead_id: leadId,
          city: lead.city,
          org_type: lead.org_type,
          age: lead.age,
          lang: lead.lang
        }
      });

      if (error) throw error;

      // Update the lead with the persona
      const { error: updateError } = await supabase
        .from('leads')
        .update({ persona_id: data.archetype })
        .eq('id', leadId);

      if (updateError) throw updateError;

      toast.success(`Lead classified as ${data.archetype}`, {
        description: data.method ? `Method: ${data.method}` : undefined
      });
      fetchCustomers();
    } catch (error: any) {
      console.error("Error classifying lead:", error);
      toast.error("Failed to classify lead", {
        description: error.message
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [leadId]: '' }));
    }
  };

  const handleAssignPersona = async (leadId: number, personaId: string) => {
    setActionLoading(prev => ({ ...prev, [leadId]: 'assign' }));
    try {
      const { error } = await supabase
        .from('leads')
        .update({ persona_id: personaId })
        .eq('id', leadId);

      if (error) throw error;

      toast.success("Persona assigned successfully");
      fetchCustomers();
    } catch (error: any) {
      console.error("Error assigning persona:", error);
      toast.error("Failed to assign persona", {
        description: error.message
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [leadId]: '' }));
    }
  };

  const handleEnrichLead = async (leadId: number) => {
    setActionLoading(prev => ({ ...prev, [leadId]: 'enrich' }));
    try {
      const { data, error } = await supabase.functions.invoke('enrich-lead', {
        body: { lead_id: leadId }
      });

      if (error) throw error;

      // Refresh customer list to get updated ai_insights from database
      await fetchCustomers();

      toast.success("Lead enriched with AI insights (saved to database)", {
        description: `Conversion: ${data.insights.conversion_likelihood}, Engagement: ${data.insights.engagement_level}`
      });
    } catch (error: any) {
      console.error("Error enriching lead:", error);
      toast.error("Failed to enrich lead", {
        description: error.message
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [leadId]: '' }));
    }
  };

  const handleSendEmail = async (leadId: number) => {
    setActionLoading(prev => ({ ...prev, [leadId]: 'email' }));
    try {
      const lead = customers.find(c => c.id === leadId);
      if (!lead) return;

      if (!lead.persona_id) {
        toast.error("Please assign a persona first");
        setActionLoading(prev => ({ ...prev, [leadId]: '' }));
        return;
      }

      // Trigger campaign-send with specific lead
      const { data, error } = await supabase.functions.invoke('campaign-send', {
        body: { 
          lead_ids: [leadId] // Pass specific lead ID
        }
      });

      if (error) throw error;

      if (data && data.campaigns && data.campaigns.length > 0) {
        toast.success("Email sent successfully", {
          description: `Campaign email queued for ${lead.name}`
        });
      } else {
        toast.info("Email scheduled", {
          description: "Email will be processed in the next campaign run"
        });
      }

      // Update last_email_sent_at
      await supabase
        .from('leads')
        .update({ last_email_sent_at: new Date().toISOString() })
        .eq('id', leadId);

      fetchCustomers();
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast.error("Failed to send email", {
        description: error.message
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [leadId]: '' }));
    }
  };

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
        <div>
          <h3 className="text-xl font-heading font-bold text-foreground">
            Customer List
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage leads, assign personas, and trigger AI actions
          </p>
        </div>
        <Badge variant="secondary">
          {customers.length} total
        </Badge>
      </div>
      
      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-3">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="p-4 bg-background/50 rounded-lg border border-border/50 hover:border-primary/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{customer.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {customer.email}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  {customer.persona_label ? (
                    <Badge variant="outline" className="bg-healthcare-blue/10 text-healthcare-blue border-healthcare-blue/30">
                      <Activity className="h-3 w-3 mr-1" />
                      {customer.persona_label}
                    </Badge>
                  ) : (
                    <Select
                      onValueChange={(value) => handleAssignPersona(customer.id, value)}
                      disabled={actionLoading[customer.id] === 'assign'}
                    >
                      <SelectTrigger className="w-[180px] h-7 text-xs">
                        <SelectValue placeholder="Assign Persona" />
                      </SelectTrigger>
                      <SelectContent>
                        {personas.map((persona) => (
                          <SelectItem key={persona.id} value={persona.id}>
                            {persona.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{customer.city}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  <span>{customer.org_type}</span>
                </div>
              </div>

              {/* Email Status & AI Insights */}
              {(customer.last_email_sent_at || customer.ai_insights) && (
                <div className="mb-3 p-3 bg-muted/30 rounded-lg border border-border/30">
                  {customer.last_email_sent_at && (
                    <div className="flex items-center gap-2 text-xs mb-2">
                      <Badge variant="secondary" className="bg-green-500/10 text-green-700 border-green-500/30">
                        <Mail className="h-3 w-3 mr-1" />
                        Email Sent
                      </Badge>
                      <span className="text-muted-foreground">
                        {new Date(customer.last_email_sent_at).toLocaleDateString()} at{' '}
                        {new Date(customer.last_email_sent_at).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                  
                  {customer.ai_insights && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <Sparkles className="h-3 w-3 text-purple-500" />
                        <span className="font-semibold text-foreground">AI Insights:</span>
                      </div>
                      {customer.ai_insights.conversion_likelihood && (
                        <div className="text-xs text-muted-foreground ml-5">
                          <span className="font-medium">Conversion:</span> {customer.ai_insights.conversion_likelihood}
                        </div>
                      )}
                      {customer.ai_insights.engagement_level && (
                        <div className="text-xs text-muted-foreground ml-5">
                          <span className="font-medium">Engagement:</span> {customer.ai_insights.engagement_level}
                        </div>
                      )}
                      {customer.ai_insights.messaging_strategy && (
                        <div className="text-xs text-muted-foreground ml-5">
                          <span className="font-medium">Strategy:</span> {customer.ai_insights.messaging_strategy}
                        </div>
                      )}
                      {customer.ai_insights.best_send_time && (
                        <div className="text-xs text-muted-foreground ml-5">
                          <span className="font-medium">Best Time:</span> {customer.ai_insights.best_send_time}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleClassifyPersona(customer.id)}
                  disabled={!!actionLoading[customer.id]}
                  className="gap-2 h-7 text-xs"
                >
                  {actionLoading[customer.id] === 'classify' ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  AI Classify
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEnrichLead(customer.id)}
                  disabled={!!actionLoading[customer.id]}
                  className="gap-2 h-7 text-xs"
                >
                  {actionLoading[customer.id] === 'enrich' ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  AI Insights
                </Button>

                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleSendEmail(customer.id)}
                  disabled={!!actionLoading[customer.id] || !customer.persona_id}
                  className="gap-2 h-7 text-xs"
                >
                  {actionLoading[customer.id] === 'email' ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                  Send Email
                </Button>
              </div>
              
              <div className="mt-2 text-xs text-muted-foreground">
                Added: {new Date(customer.created_at).toLocaleDateString()}
                {customer.age && <span className="ml-2">• Age: {customer.age}</span>}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
