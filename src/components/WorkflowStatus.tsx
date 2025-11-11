import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertCircle, Zap } from "lucide-react";

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: "active" | "pending" | "error";
  schedule?: string;
}

const workflows: Workflow[] = [
  {
    id: "flow-c",
    name: "Daily Campaign Send",
    description: "Sends personalized emails to new leads daily",
    status: "active",
    schedule: "10:00 AM IST Daily"
  },
  {
    id: "flow-d",
    name: "Event Sync",
    description: "Syncs email opens and clicks from Brevo",
    status: "active",
    schedule: "Every 10 minutes"
  },
  {
    id: "flow-f",
    name: "Report Generation",
    description: "Generates PDF reports with campaign insights",
    status: "pending",
    schedule: "Manual Trigger"
  }
];

const WorkflowStatus = () => {
  const getStatusIcon = (status: Workflow["status"]) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="w-5 h-5 text-healthcare-green" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: Workflow["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-healthcare-green/10 text-healthcare-green border-healthcare-green/20">Active</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending Setup</Badge>;
      case "error":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Error</Badge>;
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
            n8n Workflows
          </h3>
          <p className="text-sm text-muted-foreground">
            Automation status
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {workflows.map((workflow) => (
          <div
            key={workflow.id}
            className="flex items-start gap-4 p-4 bg-background/50 rounded-lg border border-border/50 hover:border-primary/20 transition-colors"
          >
            <div className="mt-0.5">
              {getStatusIcon(workflow.status)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-foreground">
                  {workflow.name}
                </h4>
                {getStatusBadge(workflow.status)}
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {workflow.description}
              </p>
              {workflow.schedule && (
                <p className="text-xs text-muted-foreground">
                  <Clock className="inline w-3 h-3 mr-1" />
                  {workflow.schedule}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Note:</strong> n8n workflows must be configured separately.
          See the{" "}
          <a 
            href="/n8n-workflows/README.md" 
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            n8n workflows documentation
          </a>
          {" "}for setup instructions.
        </p>
      </div>
    </Card>
  );
};

export default WorkflowStatus;
