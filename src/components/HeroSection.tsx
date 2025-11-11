import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { analytics } from "@/lib/analytics";

const HeroSection = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCTAClick = (label: string) => {
    analytics.trackCTA(label, 'hero_section');
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Gradient */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-hero"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse-glow"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl relative z-10 text-center py-12 sm:py-24 animate-fade-in">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-foreground mb-6 leading-tight">
          AI that helps you drive preventive health action{" "}
          <span className="bg-gradient-primary bg-clip-text text-transparent">before it's too late.</span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
          PreventIQ turns your outreach data into personalized preventive campaigns — using GenAI to
          craft messages that patients and employees actually act on.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Button
            size="lg"
            onClick={() => {
              handleCTAClick('hero_start_pilot');
              scrollToSection("signup");
            }}
            className="w-full sm:w-auto text-base sm:text-lg px-8 sm:px-10 py-7 bg-gradient-button hover:scale-105 hover:shadow-glow transition-all font-semibold rounded-full"
          >
            Start Free Trial
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              handleCTAClick('hero_watch_demo');
              scrollToSection("demo");
            }}
            className="w-full sm:w-auto text-base sm:text-lg px-8 sm:px-10 py-7 bg-background/80 backdrop-blur-sm border-2 hover:bg-background hover:border-primary transition-all font-semibold rounded-full"
          >
            <Play className="mr-2 h-5 w-5" />
            Watch 90-sec Demo
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Built for clinics, diagnostics & corporates • Powered by Gemini AI • Runs on real data
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
