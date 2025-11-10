import { Card } from "@/components/ui/card";
import { Upload, Sparkles, Send, BarChart2, FileText } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Upload your list",
    description: "Names, emails, language preference",
  },
  {
    icon: Sparkles,
    title: "AI builds personas & creatives",
    description: "Via Gemini",
  },
  {
    icon: Send,
    title: "Run campaigns",
    description: "Email/WhatsApp via Brevo",
  },
  {
    icon: BarChart2,
    title: "Measure engagement",
    description: "Opens, clicks, replies",
  },
  {
    icon: FileText,
    title: "Get insights",
    description: "Weekly AI-generated PDF report",
  },
];

const HowItWorks = () => {
  return (
    <section id="how" className="py-16 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            How PreventIQ Fits Into Your Workflow
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                <Card className="p-6 bg-card border-border text-center hover:border-primary/50 transition-all h-full">
                  <div className="mb-4 inline-block p-3 bg-primary/10 rounded-full">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </Card>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-border"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
