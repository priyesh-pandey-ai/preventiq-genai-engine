import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, Mail, Lock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { analytics } from "@/lib/analytics";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup');
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    org_type: "",
    lang: "en",
    city: "",
    agree: false,
  });

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation for sign up
    if (isSignUp) {
      if (
        !formData.name ||
        !formData.email ||
        !formData.password ||
        !formData.org_type ||
        !formData.city ||
        !formData.agree
      ) {
        toast.error("Please fill in all fields and agree to the terms.");
        return;
      }
    } else {
      // Validation for sign in
      if (!formData.email || !formData.password) {
        toast.error("Please enter your email and password.");
        return;
      }
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
              org_type: formData.org_type,
              lang: formData.lang,
              city: formData.city,
            },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (signUpError) throw signUpError;

        // Send welcome email to the marketer using their user_id
        if (signUpData?.user?.id) {
          try {
            await supabase.functions.invoke("send-welcome-email", {
              body: { user_id: signUpData.user.id }
            });
          } catch (emailError) {
            console.error("Failed to send welcome email:", emailError);
            // Don't fail signup if email fails
          }
        }

        analytics.trackLogin("signup", true);
        toast.success("Account created! Please check your email to confirm.");
        setIsSignUp(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        analytics.trackLogin("signin", true);
        toast.success("Welcome back!");
        
        // Explicitly navigate to dashboard after successful login
        if (data.session) {
          navigate("/dashboard");
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      analytics.trackLogin(isSignUp ? "signup" : "signin", false);
      toast.error(error.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 hover:bg-background/80"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <Card className="p-8 md:p-10 shadow-large bg-card border-2 border-border/50 rounded-2xl backdrop-blur-sm">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
              PreventIQ
            </h1>
            <p className="text-muted-foreground">
              {isSignUp ? "Create your account" : "Welcome back"}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-12 border-2 rounded-lg"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org_type">Organisation Type *</Label>
                  <select
                    id="org_type"
                    value={formData.org_type}
                    onChange={(e) => setFormData({ ...formData, org_type: e.target.value })}
                    className="w-full h-12 px-3 rounded-md border-2"
                    required
                  >
                    <option value="">Select type</option>
                    <option value="Clinic">Clinic</option>
                    <option value="PHC">PHC</option>
                    <option value="Diagnostics">Diagnostics</option>
                    <option value="Campus/HR">Campus/HR</option>
                    <option value="Hospital">Hospital</option>
                    <option value="Wellness Center">Wellness Center</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lang">Preferred Language *</Label>
                  <select
                    id="lang"
                    value={formData.lang}
                    onChange={(e) => setFormData({ ...formData, lang: e.target.value })}
                    className="w-full h-12 px-3 rounded-md border-2"
                    required
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    type="text"
                    placeholder="Your city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="h-12 border-2 rounded-lg"
                    required
                  />
                </div>

                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="agree"
                    checked={formData.agree}
                    onChange={(e) => setFormData({ ...formData, agree: e.target.checked })}
                    className="w-5 h-5 border-2 rounded"
                    required
                  />
                  <Label htmlFor="agree" className="text-sm">
                    I agree to receive one preventive message and one survey. We respect your privacy and you can unsubscribe anytime.
                  </Label>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 h-12 border-2 rounded-lg"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 h-12 border-2 rounded-lg"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {!isSignUp && (
              <div className="text-right">
                <button
                  type="button"
                  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-button hover:shadow-glow text-primary-foreground py-6 text-base font-semibold rounded-full transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {isSignUp ? "Creating account..." : "Signing in..."}
                </>
              ) : (
                <>{isSignUp ? "Create Account" : "Sign In"}</>
              )}
            </Button>
          </form>

          {/* Toggle Sign Up / Sign In */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary hover:text-primary/80 font-semibold transition-colors"
                disabled={loading}
              >
                {isSignUp ? "Sign in" : "Create one"}
              </button>
            </p>
          </div>

          {/* Trust indicators */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-center text-muted-foreground">
              🔒 Secure authentication powered by Supabase
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
