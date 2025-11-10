import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const SignupSection = () => {
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
      const { data, error } = await supabase.functions.invoke('lead-intake', {
        body: formData
      });

      if (error) throw error;

      console.log('Lead submission successful:', data);
      toast.success("Welcome to PreventIQ! Check your email for next steps.");
      navigate("/thanks");
    } catch (error: any) {
      console.error('Error submitting form:', error);
      
      // Handle specific error cases
      if (error.message?.includes('already registered')) {
        toast.error("This email is already registered");
      } else if (error.message?.includes('Invalid email')) {
        toast.error("Please enter a valid email address");
      } else {
        toast.error("Failed to submit. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="signup" className="py-16 sm:py-24 bg-card/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Start a Free Pilot
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Join our pilot to send one personalized preventive campaign and receive insights in 48 hours.
            We'll send one message and one short survey — no spam, no obligations.
          </p>
        </div>

        <Card className="p-6 sm:p-8 bg-card border-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-background border-border"
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-background border-border"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="org_type">Organisation Type *</Label>
                <select
                  id="org_type"
                  name="org_type"
                  required
                  value={formData.org_type}
                  onChange={(e) => setFormData({ ...formData, org_type: e.target.value })}
                  className="w-full h-10 px-3 rounded-md bg-background border border-border text-foreground"
                >
                  <option value="">Select type</option>
                  <option value="Clinic">Clinic</option>
                  <option value="PHC">PHC</option>
                  <option value="Diagnostics">Diagnostics</option>
                  <option value="Campus/HR">Campus/HR</option>
                  <option value="Hospital">Hospital</option>
                  <option value="Wellness Center">Wellness Center</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lang">Preferred Language *</Label>
                <select
                  id="lang"
                  name="lang"
                  required
                  value={formData.lang}
                  onChange={(e) => setFormData({ ...formData, lang: e.target.value })}
                  className="w-full h-10 px-3 rounded-md bg-background border border-border text-foreground"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                name="city"
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="bg-background border-border"
                placeholder="Your city"
              />
            </div>

            <div className="flex items-start space-x-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
              <p className="leading-tight">
                I agree to receive one preventive message and one survey. We respect your privacy and you can unsubscribe anytime.
              </p>
            </div>

            <Button 
              type="submit"
              disabled={loading}
              size="lg" 
              className="w-full transition-all hover:scale-105"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Start Free Pilot"
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

export default SignupSection;
