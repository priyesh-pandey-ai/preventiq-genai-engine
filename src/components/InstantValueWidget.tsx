import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const InstantValueWidget = () => {
  const [category, setCategory] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<string[]>([]);

  const generateSubjects = async () => {
    if (!category) {
      toast.error("Please select a campaign type");
      return;
    }

    setLoading(true);
    setSubjects([]);

    try {
      const { data, error } = await supabase.functions.invoke('generate-subjects', {
        body: { category, lang: 'en' }
      });

      if (error) throw error;

      if (data?.subjects && Array.isArray(data.subjects)) {
        setSubjects(data.subjects);
        toast.success("Generated 3 subject lines!");
        
        // Cache in localStorage
        localStorage.setItem(`subjects_${category}`, JSON.stringify({
          subjects: data.subjects,
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      console.error('Error generating subjects:', error);
      toast.error("Failed to generate subjects. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="instant-value" className="py-20 px-4 bg-background">
      <div className="container max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-healthcare-teal-light/20 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Try It Now - Free</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            See the Power of AI Marketing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get 3 personalized email subject lines instantly. No signup required.
          </p>
        </div>

        <Card className="p-8 shadow-large bg-gradient-card border-border">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Select Campaign Type
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full bg-background border-2">
                  <SelectValue placeholder="Choose a preventive health campaign..." />
                </SelectTrigger>
                <SelectContent className="bg-background border-2 z-50">
                  <SelectItem value="Diabetes Screening">Diabetes Screening</SelectItem>
                  <SelectItem value="Heart Health Checkup">Heart Health Checkup</SelectItem>
                  <SelectItem value="General Wellness Package">General Wellness Package</SelectItem>
                  <SelectItem value="Cancer Screening">Cancer Screening</SelectItem>
                  <SelectItem value="Women's Health">Women's Health</SelectItem>
                  <SelectItem value="Men's Health">Men's Health</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={generateSubjects}
              disabled={loading || !category}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg shadow-medium hover:shadow-glow transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Get 3 Free Subject Lines
                </>
              )}
            </Button>

            {subjects.length > 0 && (
              <div className="mt-8 space-y-4 animate-slide-up">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  Your AI-Generated Subject Lines:
                </h3>
                {subjects.map((subject, index) => (
                  <div 
                    key={index}
                    className="p-4 bg-background border-2 border-primary/20 rounded-lg hover:border-primary/40 transition-colors"
                  >
                    <p className="text-foreground font-medium">{subject}</p>
                  </div>
                ))}
                <p className="text-sm text-muted-foreground text-center mt-4">
                  These are just examples. Sign up to get personalized campaigns for your clinic!
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
};
