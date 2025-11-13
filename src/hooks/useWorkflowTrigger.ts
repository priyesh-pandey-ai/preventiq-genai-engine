import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// n8n webhook URLs
const N8N_WEBHOOKS = {
  syncEvents: 'https://gaim-priyesh.app.n8n.cloud/webhook/sync-events',
  campaignSend: 'https://gaim-priyesh.app.n8n.cloud/webhook/campaign-send',
  generateReport: 'https://gaim-priyesh.app.n8n.cloud/webhook/generate-report',
};

export const useWorkflowTrigger = () => {
  const [triggering, setTriggering] = useState(false);

  const triggerCampaignSend = async () => {
    setTriggering(true);
    try {
      // First, get unassigned leads count
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: false })
        .is('is_test', false)
        .limit(10);

      if (leadsError) throw leadsError;

      // Filter out already assigned leads
      const leadIds = leads?.map(l => l.id) || [];
      const { data: assignments } = await supabase
        .from('assignments')
        .select('lead_id')
        .in('lead_id', leadIds);

      const assignedLeadIds = new Set(assignments?.map(a => a.lead_id) || []);
      const unassignedCount = leadIds.filter(id => !assignedLeadIds.has(id)).length;

      if (unassignedCount === 0) {
        toast.info("No unassigned leads to process");
        return { success: true, data: { message: "No leads to process" } };
      }

      // Call the n8n webhook
      const response = await fetch(N8N_WEBHOOKS.campaignSend, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.statusText}`);
      }

      const data = await response.json();

      toast.success(`Campaign workflow triggered for ${unassignedCount} leads`);
      return { success: true, data };
    } catch (error) {
      console.error("Error triggering campaign send:", error);
      toast.error("Failed to trigger campaign send");
      return { success: false, error };
    } finally {
      setTriggering(false);
    }
  };

  const triggerClassifyPersona = async (leadId: number) => {
    setTriggering(true);
    try {
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (leadError) throw leadError;

      const { data, error } = await supabase.functions.invoke('classify-persona', {
        body: {
          lead_id: leadId,
          city: lead.city,
          org_type: lead.org_type,
          lang: lead.lang || 'en'
        }
      });

      if (error) throw error;

      toast.success(`Lead classified as: ${data?.archetype || 'unknown'}`);
      return { success: true, data };
    } catch (error) {
      console.error("Error classifying persona:", error);
      toast.error("Failed to classify lead");
      return { success: false, error };
    } finally {
      setTriggering(false);
    }
  };

  const triggerGenerateReport = async () => {
    setTriggering(true);
    try {
      // Call the n8n webhook
      const response = await fetch(N8N_WEBHOOKS.generateReport, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.statusText}`);
      }

      const data = await response.json();

      toast.success("Report generation started");
      return { success: true, data };
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
      return { success: false, error };
    } finally {
      setTriggering(false);
    }
  };

  const triggerFetchEvents = async () => {
    setTriggering(true);
    try {
      // Call the n8n webhook
      const response = await fetch(N8N_WEBHOOKS.syncEvents, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.statusText}`);
      }

      const data = await response.json();

      toast.success("Events synced successfully!");
      return { success: true, data };
    } catch (error) {
      console.error("Error triggering sync-events workflow:", error);
      toast.error("Failed to sync events. Please try again.");
      return { success: false };
    } finally {
      setTriggering(false);
    }
  };

  return {
    triggering,
    triggerCampaignSend,
    triggerClassifyPersona,
    triggerGenerateReport,
    triggerFetchEvents,
  };
};
