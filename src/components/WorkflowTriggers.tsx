import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Mail, FileText, Loader2, PlayCircle, RefreshCw } from "lucide-react";
import { useWorkflowTrigger } from "@/hooks/useWorkflowTrigger";

interface WorkflowTriggersProps {
  onTriggerComplete?: () => void;
}

export const WorkflowTriggers = ({ onTriggerComplete }: WorkflowTriggersProps) => {
  const { triggering, triggerCampaignSend, triggerGenerateReport, triggerFetchEvents } = useWorkflowTrigger();

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
                disabled={triggering}
                size="sm"
                className="gap-2"
              >
                {triggering ? (
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
                disabled={triggering}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                {triggering ? (
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

        {/* Fetch Events Button */}
        <div className="p-4 bg-background/50 rounded-lg border border-border/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="h-4 w-4 text-healthcare-blue" />
                <h4 className="font-semibold text-foreground">Fetch Events</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Trigger the `fetch-events` workflow to sync email events and update the dashboard.
              </p>
              <Button
                onClick={handleFetchEvents}
                disabled={triggering}
                size="sm"
                className="gap-2"
              >
                {triggering ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4" />
                    Fetch Events
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
