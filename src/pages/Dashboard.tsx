import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, BarChart3, Mail, Users, TrendingUp, Activity, UserCircle, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDashboardData } from "@/hooks/useDashboardData";
import { usePersonas } from "@/hooks/usePersonas";
import WorkflowStatus from "@/components/WorkflowStatus";
import RecentLeads from "@/components/RecentLeads";
import WelcomeGuide from "@/components/WelcomeGuide";
import { PersonaCard } from "@/components/PersonaCard";
import { PersonaEditor } from "@/components/PersonaEditor";
import { CustomerImport } from "@/components/CustomerImport";
import { CustomerList } from "@/components/CustomerList";

const Dashboard = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const dashboardStats = useDashboardData();
  const { personas, loading: personasLoading, refetch: refetchPersonas } = usePersonas();
  const [selectedPersona, setSelectedPersona] = useState<{
    id: string;
    label: string;
    description: string;
    tone_defaults?: string[];
    channels?: string[];
  } | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [personaLeadCounts, setPersonaLeadCounts] = useState<Record<string, number>>({});
  const [customerRefreshKey, setCustomerRefreshKey] = useState(0);

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

  // Fetch lead counts per persona
  useEffect(() => {
    const fetchPersonaLeadCounts = async () => {
      try {
        const { data, error } = await supabase
          .from('assignments')
          .select('persona_id');

        if (error) throw error;

        const counts: Record<string, number> = {};
        data?.forEach((assignment) => {
          const personaId = assignment.persona_id;
          if (personaId) {
            counts[personaId] = (counts[personaId] || 0) + 1;
          }
        });

        setPersonaLeadCounts(counts);
      } catch (error) {
        console.error("Error fetching persona lead counts:", error);
      }
    };

    fetchPersonaLeadCounts();
  }, []);

  const handleEditPersona = (persona: typeof selectedPersona) => {
    setSelectedPersona(persona);
    setIsEditorOpen(true);
  };

  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setSelectedPersona(null);
  };

  const handlePersonaSave = () => {
    refetchPersonas();
  };

  const handleImportComplete = () => {
    setCustomerRefreshKey(prev => prev + 1);
  };

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

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="personas" className="gap-2">
              <UserCircle className="h-4 w-4" />
              Personas
            </TabsTrigger>
            <TabsTrigger value="customers" className="gap-2">
              <Database className="h-4 w-4" />
              Customers
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Show Welcome Guide if no data exists */}
            {!dashboardStats.loading && 
             dashboardStats.totalLeads === 0 && 
             dashboardStats.totalCampaigns === 0 && (
              <WelcomeGuide 
                hasError={!!dashboardStats.error}
                errorMessage={dashboardStats.error || undefined}
                onNavigateToPersonas={() => {
                  const personasTab = document.querySelector('[value="personas"]');
                  if (personasTab instanceof HTMLElement) {
                    personasTab.click();
                  }
                }}
                onNavigateToCustomers={() => {
                  const customersTab = document.querySelector('[value="customers"]');
                  if (customersTab instanceof HTMLElement) {
                    customersTab.click();
                  }
                }}
              />
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 bg-card border-2 border-border/50 rounded-xl hover:border-primary/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Campaigns Sent</p>
                    <p className="text-2xl font-heading font-bold text-foreground">
                      {dashboardStats.loading ? (
                        <Activity className="h-5 w-5 animate-pulse" />
                      ) : (
                        dashboardStats.totalCampaigns
                      )}
                    </p>
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
                    <p className="text-2xl font-heading font-bold text-foreground">
                      {dashboardStats.loading ? (
                        <Activity className="h-5 w-5 animate-pulse" />
                      ) : (
                        dashboardStats.totalLeads
                      )}
                    </p>
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
                    <p className="text-2xl font-heading font-bold text-foreground">
                      {dashboardStats.loading ? (
                        <Activity className="h-5 w-5 animate-pulse" />
                      ) : (
                        `${dashboardStats.clickRate}%`
                      )}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card border-2 border-border/50 rounded-xl hover:border-primary/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-healthcare-purple/10 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-healthcare-purple" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Clicks</p>
                    <p className="text-2xl font-heading font-bold text-foreground">
                      {dashboardStats.loading ? (
                        <Activity className="h-5 w-5 animate-pulse" />
                      ) : (
                        dashboardStats.totalClicks
                      )}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Workflow Status and Recent Leads */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WorkflowStatus />
              <RecentLeads />
            </div>

            {/* Quick Actions */}
            <Card className="p-8 text-center bg-gradient-card border-2 border-border/50 rounded-2xl">
              <div className="max-w-3xl mx-auto">
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-primary text-primary-foreground mb-6 shadow-soft">
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-sm font-semibold">Quick Actions</span>
                </div>
                <h3 className="text-2xl font-heading font-bold text-foreground mb-4">
                  Get Started with PreventIQ
                </h3>
                <div className="flex gap-4 justify-center flex-wrap">
                  <Button 
                    variant="outline"
                    onClick={() => navigate("/")}
                    className="rounded-full font-semibold"
                  >
                    Back to Home
                  </Button>
                  <Button 
                    onClick={() => document.querySelector('[value="personas"]')?.dispatchEvent(new Event('click', { bubbles: true }))}
                    className="rounded-full font-semibold bg-gradient-button"
                  >
                    Manage Personas
                  </Button>
                  <Button 
                    onClick={() => document.querySelector('[value="customers"]')?.dispatchEvent(new Event('click', { bubbles: true }))}
                    className="rounded-full font-semibold bg-gradient-button"
                  >
                    Import Customers
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Personas Tab */}
          <TabsContent value="personas" className="space-y-6">
            <Card className="p-6 bg-gradient-card border-2 border-border/50 rounded-xl">
              <h3 className="text-xl font-heading font-bold text-foreground mb-2">
                Customer Personas
              </h3>
              <p className="text-muted-foreground mb-6">
                Manage the 6 core customer archetypes used to personalize your marketing campaigns.
                Click edit to customize descriptions and tone for each persona.
              </p>
            </Card>

            {personasLoading ? (
              <div className="flex items-center justify-center py-12">
                <Activity className="h-8 w-8 animate-pulse text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {personas.map((persona) => (
                  <PersonaCard
                    key={persona.id}
                    persona={persona}
                    onEdit={handleEditPersona}
                    leadCount={personaLeadCounts[persona.id] || 0}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6">
            <CustomerImport onImportComplete={handleImportComplete} />
            <CustomerList key={customerRefreshKey} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Persona Editor Dialog */}
      <PersonaEditor
        persona={selectedPersona}
        isOpen={isEditorOpen}
        onClose={handleEditorClose}
        onSave={handlePersonaSave}
      />
    </div>
  );
};

export default Dashboard;
