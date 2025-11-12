import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UserProfile {
  id: string;
  email: string;
  org_type?: string;
  city?: string;
  organization_name?: string;
  created_at?: string;
}

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setProfile(null);
        setLoading(false);
        return;
      }

      // Try to get profile from user metadata first
      const userMetadata = session.user.user_metadata;
      
      if (userMetadata && userMetadata.org_type) {
        setProfile({
          id: session.user.id,
          email: session.user.email || "",
          org_type: userMetadata.org_type,
          city: userMetadata.city,
          organization_name: userMetadata.organization_name,
        });
      } else {
        // Fallback: basic profile from session
        setProfile({
          id: session.user.id,
          email: session.user.email || "",
        });
      }

      setLoading(false);
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setError(err instanceof Error ? err.message : "Failed to load profile");
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          org_type: updates.org_type,
          city: updates.city,
          organization_name: updates.organization_name,
        }
      });

      if (error) throw error;

      toast.success("Profile updated successfully");
      await fetchProfile(); // Refresh profile
      return true;
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error("Failed to update profile");
      return false;
    }
  };

  useEffect(() => {
    fetchProfile();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch: fetchProfile,
  };
};
