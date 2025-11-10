import { Card } from "@/components/ui/card";
import { Shield } from "lucide-react";

const PrivacySection = () => {
  return (
    <section className="py-16 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <Card className="p-8 bg-card/50 border-primary/30 text-center">
          <div className="inline-block p-3 bg-primary/10 rounded-full mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Privacy First</h2>
          <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            PreventIQ never collects medical data. We only send one message and one follow-up survey
            per pilot. You can unsubscribe anytime.
          </p>
        </Card>
      </div>
    </section>
  );
};

export default PrivacySection;
