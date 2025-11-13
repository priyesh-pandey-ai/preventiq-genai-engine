import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rocket, Users, Mail, BarChart3, CheckCircle2, AlertCircle, Settings } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";

interface WelcomeGuideProps {
  hasError?: boolean;
  errorMessage?: string;
  onNavigateToPersonas?: () => void;
  onNavigateToCustomers?: () => void;
  onNavigateToSettings?: () => void;
}

const WelcomeGuide = ({ 
  hasError = false, 
  errorMessage, 
  onNavigateToPersonas,
  onNavigateToCustomers,
  onNavigateToSettings
}: WelcomeGuideProps) => {
  const { profile } = useUserProfile();
  const hasProfile = profile?.org_type && profile?.city;

  return (
    <Card className="p-8 bg-gradient-card border-2 border-border/50 rounded-2xl">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-primary mb-4">
            <Rocket className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-heading font-bold text-foreground mb-2">
            Welcome to PreventIQ!
          </h2>
          <p className="text-muted-foreground text-lg">
            Let's get you started with your first campaign
          </p>
        </div>

        {/* Error Alert */}
        {hasError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-600 mb-1">
                  Connection Error
                </h4>
                <p className="text-sm text-red-500/80">
                  {errorMessage || "Unable to load dashboard data. Please check your connection and try again."}
                </p>
                <p className="text-xs text-red-500/70 mt-2">
                  If the problem persists, please contact support or check the{" "}
                  <a href="#" className="underline hover:text-red-600">debugging guide</a>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Getting Started Steps */}
        <div className="space-y-4 mb-8">
          {/* Step 0: Complete Profile (if not done) */}
          {!hasProfile && (
            <div className="flex items-start gap-4 p-5 bg-yellow-500/5 rounded-lg border-2 border-yellow-500/30 hover:border-yellow-500/50 transition-all">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-500/10 flex-shrink-0">
                <span className="text-lg font-bold text-yellow-600">!</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-heading font-bold text-foreground">
                    Complete Your Profile First
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Set up your organization details so customers automatically inherit your organization type. 
                  This saves time when importing customers.
                </p>
                {onNavigateToSettings && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={onNavigateToSettings}
                    className="rounded-full border-yellow-500/30 hover:border-yellow-500/50"
                  >
                    Complete Profile
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="flex items-start gap-4 p-5 bg-background/50 rounded-lg border border-border/50 hover:border-primary/30 transition-all">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 flex-shrink-0">
              <span className="text-lg font-bold text-primary">1</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="font-heading font-bold text-foreground">
                  Set Up Your Customer Personas
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                PreventIQ uses 6 core customer archetypes to personalize your campaigns. 
                Review and customize the default personas to match your target audience.
              </p>
              {onNavigateToPersonas && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onNavigateToPersonas}
                  className="rounded-full"
                >
                  View Personas
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 bg-background/50 rounded-lg border border-border/50 hover:border-primary/30 transition-all">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/10 flex-shrink-0">
              <span className="text-lg font-bold text-accent">2</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-5 h-5 text-accent" />
                <h3 className="font-heading font-bold text-foreground">
                  Import Your Customers
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Upload your customer list via CSV or add them manually. 
                Once imported, our AI will automatically classify them into personas 
                and prepare personalized campaigns.
              </p>
              {onNavigateToCustomers && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onNavigateToCustomers}
                  className="rounded-full"
                >
                  Import Customers
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 bg-background/50 rounded-lg border border-border/50 hover:border-healthcare-green/30 transition-all">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-healthcare-green/10 flex-shrink-0">
              <span className="text-lg font-bold text-healthcare-green">3</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-healthcare-green" />
                <h3 className="font-heading font-bold text-foreground">
                  Watch Your Campaigns Take Off
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Once you've imported customers, our automated workflows will handle the rest. 
                Watch real-time analytics appear on your dashboard as campaigns are sent 
                and customers engage with your content.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="p-5 bg-primary/5 rounded-lg border border-primary/10">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-foreground">Quick Tips:</p>
              <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                <li>Start with a small batch of customers to test your setup</li>
                <li>Review the AI-generated personas and customize them to your brand voice</li>
                <li>Check the workflow status to ensure automation is running smoothly</li>
                <li>Monitor the Recent Leads section to see new signups in real-time</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default WelcomeGuide;
