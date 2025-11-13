import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Mail, FileText, Loader2, PlayCircle, RefreshCw, Sparkles, TrendingUp, UserCheck } from "lucide-react";
import { useWorkflowTrigger } from "@/hooks/useWorkflowTrigger";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

interface WorkflowTriggersProps {
  onTriggerComplete?: () => void;
}

export const WorkflowTriggers = ({ onTriggerComplete }: WorkflowTriggersProps) => {
  const { triggeringCampaign, triggeringReport, triggeringEvents, triggerCampaignSend, triggerGenerateReport, triggerFetchEvents } = useWorkflowTrigger();
  const [classifyingAll, setClassifyingAll] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  const handleCampaignSend = async () => {
    const result = await triggerCampaignSend();
    if (result.success && onTriggerComplete) {
      onTriggerComplete();
    }
  };

  const handleGenerateReport = async () => {
    const result = await triggerGenerateReport();
    if (result.success && onTriggerComplete) {
      onTriggerComplete();
    }
  };

  const handleFetchEvents = async () => {
    const result = await triggerFetchEvents();
    if (result.success && onTriggerComplete) {
      onTriggerComplete();
    }
  };

  const handleClassifyAllLeads = async () => {
    setClassifyingAll(true);
    try {
      // Get all leads without persona_id
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id, city, org_type, age, lang')
        .is('persona_id', null)
        .limit(20);

      if (leadsError) throw leadsError;

      if (!leads || leads.length === 0) {
        toast.info("No unclassified leads found");
        return;
      }

      let classified = 0;
      for (const lead of leads) {
        try {
          const { data, error } = await supabase.functions.invoke('classify-persona', {
            body: {
              lead_id: lead.id,
              city: lead.city,
              org_type: lead.org_type,
              age: lead.age,
              lang: lead.lang
            }
          });

          if (error) throw error;

          // Update the lead with the persona
          await supabase
            .from('leads')
            .update({ persona_id: data.archetype })
            .eq('id', lead.id);

          classified++;
        } catch (error) {
          console.error(`Error classifying lead ${lead.id}:`, error);
        }
      }

      toast.success(`Classified ${classified} of ${leads.length} leads`, {
        description: "AI-powered persona assignment complete"
      });

      if (onTriggerComplete) {
        onTriggerComplete();
      }
    } catch (error: any) {
      console.error("Error classifying leads:", error);
      toast.error("Failed to classify leads", {
        description: error.message
      });
    } finally {
      setClassifyingAll(false);
    }
  };

  const handleOptimizeCampaigns = async () => {
    setOptimizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('optimize-campaigns');

      if (error) throw error;

      toast.success("Campaign optimization complete", {
        description: `Found ${data.recommendations?.top_opportunities?.length || 0} opportunities`
      });

      console.log("Optimization recommendations:", data);
    } catch (error: any) {
      console.error("Error optimizing campaigns:", error);
      toast.error("Failed to optimize campaigns", {
        description: error.message
      });
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <Card className="p-6 bg-card border-2 border-border/50 rounded-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-heading font-bold text-foreground">
            Manual Workflow Triggers
          </h3>
          <p className="text-sm text-muted-foreground">
            Process leads and generate reports on-demand
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="p-4 bg-background/50 rounded-lg border border-border/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-foreground">
                  Process Campaign Leads
                </h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Classify unassigned leads into personas and generate personalized email campaigns. 
                This processes up to 10 leads at a time.
              </p>
              <Button
                onClick={handleCampaignSend}
                disabled={triggeringCampaign}
                size="sm"
                className="gap-2"
              >
                {triggeringCampaign ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4" />
                    Process Leads Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4 bg-background/50 rounded-lg border border-border/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="h-4 w-4 text-healthcare-blue" />
                <h4 className="font-semibold text-foreground">
                  AI Classify All Unassigned Leads
                </h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Use AI to automatically classify all leads without persona assignments.
                Processes up to 20 leads using Azure OpenAI.
              </p>
              <Button
                onClick={handleClassifyAllLeads}
                disabled={classifyingAll}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                {classifyingAll ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Classifying...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Classify All
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4 bg-background/50 rounded-lg border border-border/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-healthcare-purple" />
                <h4 className="font-semibold text-foreground">
                  AI Campaign Optimization
                </h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Analyze campaign performance and get AI-powered recommendations for improvement.
                Identifies opportunities and suggests innovative ideas.
              </p>
              <Button
                onClick={handleOptimizeCampaigns}
                disabled={optimizing}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                {optimizing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Optimize Campaigns
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4 bg-background/50 rounded-lg border border-border/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-healthcare-green" />
                <h4 className="font-semibold text-foreground">
                  Generate Analytics Report
                </h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Generate a comprehensive PDF report with campaign insights, 
                engagement metrics, and AI-powered recommendations.
              </p>
              <Button
                onClick={handleGenerateReport}
                disabled={triggeringReport}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                {triggeringReport ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Sync Events Button */}
        <div className="p-4 bg-background/50 rounded-lg border border-border/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="h-4 w-4 text-healthcare-blue" />
                <h4 className="font-semibold text-foreground">Sync Email Events</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Sync email engagement events from Brevo (opens, clicks, bounces) 
                to update campaign analytics and track user interactions.
              </p>
              <Button
                onClick={handleFetchEvents}
                disabled={triggeringEvents}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                {triggeringEvents ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Sync Events Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Note:</strong> These functions process data immediately. 
          The full n8n workflow automation runs on schedule (daily at 9 AM for campaigns).
        </p>
      </div>
    </Card>
  );
};
