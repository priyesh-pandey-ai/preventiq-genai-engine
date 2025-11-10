import { Hero } from "@/components/Hero";
import { InstantValueWidget } from "@/components/InstantValueWidget";
import { Features } from "@/components/Features";
import { LeadForm } from "@/components/LeadForm";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <InstantValueWidget />
      <Features />
      <LeadForm />
      
      <footer className="py-8 px-4 bg-card border-t border-border">
        <div className="container max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p>© 2025 PreventIQ. All rights reserved. | HIPAA Compliant Healthcare Marketing Platform</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
