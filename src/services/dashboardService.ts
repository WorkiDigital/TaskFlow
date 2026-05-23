import { supabase } from "@/services/supabase";
import { getCurrentUserAgency } from "@/lib/auth";

export interface DashboardMetrics {
  totalContracts: number;
  pendingContracts: number;
  signedContracts: number;
  totalTasks: number;
  overdueTasks: number;
  activeProjects: number;
  activeOnboardings: number;
  totalClients: number;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const { agencyId } = await getCurrentUserAgency();

  const [contracts, tasks, projects, onboardingRuns, clients] = await Promise.all([
    supabase.from("contracts").select("id, status").eq("agency_id", agencyId),
    supabase.from("project_tasks").select("id, status, due_date").eq("agency_id", agencyId),
    supabase.from("projects").select("id, status").eq("agency_id", agencyId),
    supabase.from("onboarding_runs").select("id, status").eq("agency_id", agencyId),
    supabase.from("clients").select("id").eq("agency_id", agencyId),
  ]);

  const now = new Date();

  return {
    totalContracts: contracts.data?.length ?? 0,
    pendingContracts: contracts.data?.filter(c => c.status === "pending" || c.status === "sent").length ?? 0,
    signedContracts: contracts.data?.filter(c => c.status === "signed").length ?? 0,
    totalTasks: tasks.data?.length ?? 0,
    overdueTasks: tasks.data?.filter(t =>
      t.due_date && new Date(t.due_date) < now && t.status !== "done"
    ).length ?? 0,
    activeProjects: projects.data?.filter(p => p.status === "active" || p.status === "planning").length ?? 0,
    activeOnboardings: onboardingRuns.data?.filter(r => r.status === "in_progress").length ?? 0,
    totalClients: clients.data?.length ?? 0,
  };
}
