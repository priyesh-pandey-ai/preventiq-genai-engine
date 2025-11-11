import { Button } from "@/components/ui/button";

const Footer = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground">
            <p>© {currentYear} PreventIQ</p>
            <div className="flex items-center gap-4">
              <button className="hover:text-foreground transition-colors">Privacy Policy</button>
              <span className="hidden sm:inline">•</span>
              <button 
                onClick={() => window.location.href = "/login"}
                className="hover:text-foreground transition-colors font-medium"
              >
                Login
              </button>
            </div>
          </div>
          <Button 
            onClick={() => scrollToSection("signup")} 
            variant="outline" 
            size="sm"
            className="rounded-full font-semibold hover:border-primary hover:text-primary"
          >
            Start Free Trial
          </Button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
