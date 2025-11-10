import { Button } from "@/components/ui/button";
import { CheckCircle2, Mail, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const Thanks = () => {
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-healthcare-green/10 mb-8 animate-slide-up">
          <CheckCircle2 className="w-10 h-10 text-healthcare-green" />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          Thank You for Joining PreventIQ!
        </h1>

        <p className="text-xl text-muted-foreground mb-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          We're excited to help you transform your healthcare marketing.
        </p>

        <div className="bg-card border-2 border-border rounded-lg p-8 mb-8 shadow-large animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-foreground mb-2">Check Your Email</h3>
              <p className="text-muted-foreground text-sm">
                We've sent you a welcome email with next steps to get your first AI-powered campaign running.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-foreground mb-2">What Happens Next?</h3>
              <p className="text-muted-foreground text-sm">
                Our AI is already analyzing your profile and will send you a personalized campaign preview within 24 hours.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <Link to="/">
            <Button variant="outline" size="lg" className="border-2">
              Return to Homepage
            </Button>
          </Link>
          
          <p className="text-sm text-muted-foreground">
            Questions? Email us at{" "}
            <a href="mailto:support@preventiq.com" className="text-primary hover:underline">
              support@preventiq.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Thanks;
