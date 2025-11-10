import { Card } from "@/components/ui/card";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "The Hindi campaign doubled our open rates.",
    author: "HR Head",
    role: "Corporate Wellness",
  },
  {
    quote: "Finally, preventive health feels human.",
    author: "Clinic Owner",
    role: "Bengaluru",
  },
  {
    quote: "Setup took minutes — AI did the rest.",
    author: "Marketing Lead",
    role: "Diagnostics Chain",
  },
];

const Testimonials = () => {
  return (
    <section className="py-16 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Teams already seeing engagement lift.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="p-6 bg-card border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all"
            >
              <Quote className="h-8 w-8 text-primary/30 mb-4" />
              <p className="text-foreground mb-4 leading-relaxed">"{testimonial.quote}"</p>
              <div className="border-t border-border pt-4">
                <p className="text-sm font-semibold text-foreground">{testimonial.author}</p>
                <p className="text-xs text-muted-foreground">{testimonial.role}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
