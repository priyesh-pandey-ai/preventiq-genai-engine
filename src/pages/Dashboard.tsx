import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut, BarChart3, Mail, Users, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/login");
        return;
      }

      setUserEmail(session.user.email || "");
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground">
              PreventIQ Dashboard
            </h1>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="rounded-full font-medium"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-12">
        <div className="mb-8 animate-fade-in">
          <h2 className="text-3xl font-heading font-bold text-foreground mb-2">
            Welcome back!
          </h2>
          <p className="text-muted-foreground">{userEmail}</p>
        </div>

        {/* Placeholder Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="p-6 bg-card border-2 border-border/50 rounded-xl hover:border-primary/30 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Campaigns Sent</p>
                <p className="text-2xl font-heading font-bold text-foreground">0</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card border-2 border-border/50 rounded-xl hover:border-primary/30 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent/10 rounded-lg">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-heading font-bold text-foreground">0</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card border-2 border-border/50 rounded-xl hover:border-primary/30 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-healthcare-green/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-healthcare-green" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Click Rate</p>
                <p className="text-2xl font-heading font-bold text-foreground">0%</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card border-2 border-border/50 rounded-xl hover:border-primary/30 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-healthcare-purple/10 rounded-lg">
                <BarChart3 className="h-6 w-6 text-healthcare-purple" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">PMF Score</p>
                <p className="text-2xl font-heading font-bold text-foreground">-</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Coming Soon Section */}
        <Card className="p-12 text-center bg-gradient-card border-2 border-border/50 rounded-2xl">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-primary text-primary-foreground mb-6 shadow-soft">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm font-semibold">Coming Soon</span>
            </div>
            <h3 className="text-2xl font-heading font-bold text-foreground mb-4">
              Your Campaign Analytics Dashboard
            </h3>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Track your preventive healthcare campaigns, monitor engagement, and get AI-powered insights to optimize your outreach. Full analytics and reporting features are being built.
            </p>
            <Button 
              variant="outline"
              onClick={() => navigate("/")}
              className="rounded-full font-semibold"
            >
              Back to Home
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
