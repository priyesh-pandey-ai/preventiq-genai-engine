import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { analytics } from "@/lib/analytics";

export const LeadForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    city: "",
    org_type: "",
    lang: "en",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.city || !formData.org_type) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.functions.invoke('lead-intake', {
        body: formData
      });

      if (error) throw error;

      analytics.trackFormSubmit('lead_intake', true);
      toast.success("Welcome to PreventIQ! Check your email for next steps.");
      navigate("/thanks");
    } catch (error) {
      console.error('Error submitting form:', error);
      analytics.trackFormSubmit('lead_intake', false);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="lead-form" className="py-20 px-4 bg-gradient-hero">
      <div className="container max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Start Your Free Trial
          </h2>
          <p className="text-lg text-muted-foreground">
            Join healthcare providers already using AI to grow their practice.
          </p>
        </div>

        <Card className="p-8 shadow-large bg-card border-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                Full Name *
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Dr. Jane Smith"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-background border-2"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email Address *
              </label>
              <Input
                id="email"
                type="email"
                placeholder="jane@clinic.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-background border-2"
                required
              />
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-foreground mb-2">
                City *
              </label>
              <Input
                id="city"
                type="text"
                placeholder="Mumbai"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="bg-background border-2"
                required
              />
            </div>

            <div>
              <label htmlFor="org_type" className="block text-sm font-medium text-foreground mb-2">
                Organization Type *
              </label>
              <Select value={formData.org_type} onValueChange={(value) => setFormData({ ...formData, org_type: value })}>
                <SelectTrigger className="bg-background border-2">
                  <SelectValue placeholder="Select your organization type..." />
                </SelectTrigger>
                <SelectContent className="bg-background border-2 z-50">
                  <SelectItem value="Clinic">Clinic</SelectItem>
                  <SelectItem value="Diagnostic Center">Diagnostic Center</SelectItem>
                  <SelectItem value="Hospital">Hospital</SelectItem>
                  <SelectItem value="Wellness Center">Wellness Center</SelectItem>
                  <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 mt-0.5 text-healthcare-green flex-shrink-0" />
              <p>
                By signing up, you agree to receive marketing emails from PreventIQ. We respect your privacy and you can unsubscribe anytime.
              </p>
            </div>

            <Button 
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg shadow-medium hover:shadow-glow transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Your Account...
                </>
              ) : (
                "Get Started Free"
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              No credit card required • HIPAA compliant • Cancel anytime
            </p>
          </form>
        </Card>
      </div>
    </section>
  );
};
