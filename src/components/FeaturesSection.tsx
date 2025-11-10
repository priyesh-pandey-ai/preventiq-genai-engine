import { Card } from "@/components/ui/card";
import { Users, MessageSquare, TrendingUp, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Persona Engine",
    description: "Builds micro-personas based on tone, language, and motivation for each recipient.",
  },
  {
    icon: MessageSquare,
    title: "Localized Copy Generator",
    description: "Crafts messages in English and Hindi with compliant CTAs that drive action.",
  },
  {
    icon: TrendingUp,
    title: "Smart A/B Optimizer",
    description: "Tests variants and auto-learns what works to maximize engagement rates.",
  },
  {
    icon: BarChart3,
    title: "ROI Dashboard",
    description: "Measures engagement metrics and generates weekly PDF reports with insights.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-16 sm:py-24 bg-card/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Everything you need to personalize preventive marketing.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="p-6 bg-card border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group"
              >
                <div className="mb-4 inline-block p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
