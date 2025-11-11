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
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-primary text-primary-foreground mb-6 shadow-soft">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold">Try It Now - Free</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
            See the Power of AI Marketing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get 3 personalized email subject lines instantly. No signup required.
          </p>
        </div>

        <Card className="p-8 md:p-10 shadow-large bg-card border-2 border-border/50 hover:border-primary/20 transition-all rounded-2xl">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                Select Campaign Type
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full bg-background border-2 h-12 rounded-lg hover:border-primary/40 transition-colors">
                  <SelectValue placeholder="Choose a preventive health campaign..." />
                </SelectTrigger>
                <SelectContent className="bg-background border-2 z-50 rounded-lg">
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
              className="w-full bg-gradient-button hover:shadow-glow text-primary-foreground py-7 text-lg font-semibold shadow-medium transition-all rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating with AI...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Get 3 Free Subject Lines
                </>
              )}
            </Button>

            {loading && (
              <div className="space-y-3 animate-fade-in">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted rounded-lg shimmer"></div>
                ))}
              </div>
            )}

            {subjects.length > 0 && !loading && (
              <div className="mt-8 space-y-4 animate-slide-up">
                <h3 className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  Your AI-Generated Subject Lines:
                </h3>
                {subjects.map((subject, index) => (
                  <div 
                    key={index}
                    className="p-5 bg-gradient-card border-2 border-primary/30 rounded-xl hover:border-primary hover:shadow-soft transition-all cursor-default group"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <p className="text-foreground font-medium leading-relaxed group-hover:text-primary transition-colors">{subject}</p>
                  </div>
                ))}
                <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                  <p className="text-sm text-foreground text-center font-medium">
                    ✨ These are just examples. <span className="text-primary font-semibold">Sign up</span> to get personalized campaigns for your clinic!
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
};
