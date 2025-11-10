import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export const Hero = () => {
  const scrollToWidget = () => {
    const widget = document.getElementById("instant-value");
    widget?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center px-4 py-20 bg-gradient-hero overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-healthcare-teal/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-healthcare-blue/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }} />
      </div>

      <div className="container max-w-6xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card shadow-soft mb-8 animate-slide-up">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">AI-Powered Marketing Automation</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          Healthcare Marketing,
          <br />
          <span className="bg-gradient-primary bg-clip-text text-transparent">Effortlessly Personalized</span>
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: "0.2s" }}>
          PreventIQ uses AI to create, personalize, and optimize preventive healthcare campaigns—so you can focus on patient care, not marketing tasks.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <Button 
            size="lg" 
            className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-large hover:shadow-glow transition-all"
            onClick={scrollToWidget}
          >
            Try Free Subject Lines
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="text-lg px-8 py-6 border-2 hover:bg-secondary transition-all"
            onClick={() => {
              const form = document.getElementById("lead-form");
              form?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Get Started Free
          </Button>
        </div>

        {/* Trust indicators */}
        <div className="mt-16 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-healthcare-green rounded-full" />
            <span>No Credit Card Required</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-healthcare-green rounded-full" />
            <span>Setup in 5 Minutes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-healthcare-green rounded-full" />
            <span>HIPAA Compliant</span>
          </div>
        </div>
      </div>
    </section>
  );
};
