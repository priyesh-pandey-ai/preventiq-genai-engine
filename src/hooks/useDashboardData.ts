import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardStats {
  totalLeads: number;
  totalCampaigns: number;
  totalClicks: number;
  clickRate: number;
  loading: boolean;
  error: string | null;
}

export const useDashboardData = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    totalCampaigns: 0,
    totalClicks: 0,
    clickRate: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true, error: null }));

        // Fetch total leads
        const { count: leadsCount, error: leadsError } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true });

        if (leadsError) throw leadsError;

        // Fetch total campaigns (assignments)
        const { count: campaignsCount, error: campaignsError } = await supabase
          .from('assignments')
          .select('*', { count: 'exact', head: true });

        if (campaignsError) throw campaignsError;

        // Fetch total clicks
        const { count: clicksCount, error: clicksError } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('type', 'click');

        if (clicksError) throw clicksError;

        const totalLeads = leadsCount || 0;
        const totalCampaigns = campaignsCount || 0;
        const totalClicks = clicksCount || 0;
        const clickRate = totalCampaigns > 0 
          ? Math.round((totalClicks / totalCampaigns) * 100) 
          : 0;

        setStats({
          totalLeads,
          totalCampaigns,
          totalClicks,
          clickRate,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard data';
        setStats(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
      }
    };

    fetchDashboardData();

    // Set up real-time subscriptions for updates
    const leadsSubscription = supabase
      .channel('leads-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'leads' },
        () => fetchDashboardData()
      )
      .subscribe();

    const assignmentsSubscription = supabase
      .channel('assignments-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'assignments' },
        () => fetchDashboardData()
      )
      .subscribe();

    const eventsSubscription = supabase
      .channel('events-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => fetchDashboardData()
      )
      .subscribe();

    return () => {
      leadsSubscription.unsubscribe();
      assignmentsSubscription.unsubscribe();
      eventsSubscription.unsubscribe();
    };
  }, []);

  return stats;
};
