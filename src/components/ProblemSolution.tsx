import { Card } from "@/components/ui/card";
import { X, Check } from "lucide-react";

const ProblemSolution = () => {
  return (
    <section className="py-16 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
            Preventive care fails because reminders are generic.
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            80% of preventive outreach goes unopened. Messages sound robotic, so people ignore them.
            PreventIQ uses GenAI to make every message personal, relevant, and timely.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="p-6 bg-card/50 border-border relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <div className="bg-destructive/20 p-2 rounded-full">
                <X className="h-5 w-5 text-destructive" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-muted-foreground mb-4">Generic Message</h3>
            <div className="bg-muted/20 p-4 rounded-lg border border-muted">
              <p className="text-sm text-muted-foreground leading-relaxed">
                "Dear Customer, It's time for your annual health checkup. Book your appointment now.
                Click here."
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              ❌ No personalization • Ignores context • Gets ignored
            </p>
          </Card>

          <Card className="p-6 bg-card border-primary/30 relative overflow-hidden shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all">
            <div className="absolute top-4 right-4">
              <div className="bg-success/20 p-2 rounded-full">
                <Check className="h-5 w-5 text-success" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-primary mb-4">AI-Personalized Message</h3>
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/30">
              <p className="text-sm text-foreground leading-relaxed">
                "नमस्ते राजेश जी, पिछले साल की तरह इस बार भी हम आपकी सेहत का ध्यान रखना चाहेंगे। क्या आप इस सप्ताह अपनी डायबिटीज स्क्रीनिंग के लिए आ सकते हैं? बुकिंग के लिए यहाँ क्लिक करें।"
              </p>
            </div>
            <p className="text-xs text-success mt-3">
              ✅ Named & localized • Relevant history • Clear action
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolution;
