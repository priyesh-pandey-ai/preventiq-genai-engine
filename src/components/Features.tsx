import { Card } from "@/components/ui/card";
import { Brain, Target, BarChart3, Zap, Users, Lock } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Personalization",
    description: "Every email is tailored to patient personas using advanced AI, ensuring maximum engagement.",
  },
  {
    icon: Target,
    title: "Smart Segmentation",
    description: "Automatically classify leads into personas and deliver the right message to the right person.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Track opens, clicks, and conversions. Get AI-powered insights to optimize your campaigns.",
  },
  {
    icon: Zap,
    title: "Zero-Effort Automation",
    description: "Set it and forget it. Our platform handles everything from lead capture to follow-ups.",
  },
  {
    icon: Users,
    title: "Patient-Centric Design",
    description: "Built specifically for preventive healthcare, respecting patient privacy and preferences.",
  },
  {
    icon: Lock,
    title: "HIPAA Compliant",
    description: "Enterprise-grade security ensures your patient data is always protected and compliant.",
  },
];

export const Features = () => {
  return (
    <section className="py-20 px-4 bg-background">
      <div className="container max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Everything You Need to Scale Healthcare Marketing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stop spending hours on marketing. Let AI do the heavy lifting while you focus on patient care.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="p-6 bg-gradient-card border-border hover:shadow-large transition-all hover:-translate-y-1 duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4 shadow-medium">
                  <Icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
