import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-background/80 backdrop-blur-lg border-b border-border" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">PreventIQ</h1>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => scrollToSection("how")}
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Features
            </button>
            <Button 
              onClick={() => window.location.href = "/login"}
              variant="ghost"
              size="sm"
              className="font-medium"
            >
              Login
            </Button>
            <Button 
              onClick={() => scrollToSection("signup")} 
              size="sm"
              className="bg-gradient-button hover:shadow-glow transition-all"
            >
              Start Free Trial
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4 border-t border-border">
            <button
              onClick={() => scrollToSection("how")}
              className="block w-full text-left text-muted-foreground hover:text-foreground transition-colors py-2 font-medium"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className="block w-full text-left text-muted-foreground hover:text-foreground transition-colors py-2 font-medium"
            >
              Features
            </button>
            <Button 
              onClick={() => window.location.href = "/login"} 
              variant="outline"
              className="w-full"
            >
              Login
            </Button>
            <Button 
              onClick={() => scrollToSection("signup")} 
              className="w-full bg-gradient-button"
            >
              Start Free Trial
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
