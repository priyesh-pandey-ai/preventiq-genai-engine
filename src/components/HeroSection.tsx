import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

const HeroSection = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCTAClick = (label: string) => {
    // Track CTA clicks with Google Analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'click', {
        event_category: 'cta',
        event_label: label
      });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Gradient */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl relative z-10 text-center py-12 sm:py-24">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
          AI that helps you drive preventive health action{" "}
          <span className="text-primary">before it's too late.</span>
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
            className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-6 transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/25"
          >
            Start Free Pilot
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              handleCTAClick('hero_watch_demo');
              scrollToSection("demo");
            }}
            className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-6 bg-transparent border-secondary text-secondary-foreground hover:bg-secondary/10 transition-all"
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
