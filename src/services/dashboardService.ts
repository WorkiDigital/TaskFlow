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

export interface RecentActivityItem {
  id: string;
  type: "client" | "contract" | "onboarding" | "project";
  message: string;
  timestamp: string;
}

export interface UpcomingDeadlineItem {
  id: string;
  title: string;
  projectName: string;
  dueDate: string;
  daysLeft: number;
  overdue: boolean;
}

export interface ContractStatusCount {
  status: string;
  label: string;
  count: number;
  color: string;
}

export interface OnboardingProgressItem {
  id: string;
  clientName: string;
  status: string;
  completedSteps: number;
  totalSteps: number;
  progress: number;
}

// ─── Métricas principais ──────────────────────────────────────────────────────

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
    pendingContracts:
      contracts.data?.filter((c) => c.status === "pending" || c.status === "sent").length ?? 0,
    signedContracts: contracts.data?.filter((c) => c.status === "signed").length ?? 0,
    totalTasks: tasks.data?.length ?? 0,
    overdueTasks:
      tasks.data?.filter((t) => t.due_date && new Date(t.due_date) < now && t.status !== "done")
        .length ?? 0,
    activeProjects:
      projects.data?.filter((p) => p.status === "active" || p.status === "planning").length ?? 0,
    activeOnboardings:
      onboardingRuns.data?.filter((r) => r.status === "running" || r.status === "awaiting_form")
        .length ?? 0,
    totalClients: clients.data?.length ?? 0,
  };
}

// ─── Atividade recente ────────────────────────────────────────────────────────

export async function getRecentActivity(): Promise<RecentActivityItem[]> {
  const { agencyId } = await getCurrentUserAgency();

  const [clientsRes, contractsRes, onboardingsRes, projectsRes] = await Promise.allSettled([
    supabase
      .from("clients")
      .select("id, name, created_at")
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("contracts")
      .select("id, title, status, created_at")
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("onboarding_runs")
      .select("id, status, created_at, clients(name)")
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("projects")
      .select("id, name, created_at")
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const items: RecentActivityItem[] = [];

  if (clientsRes.status === "fulfilled" && clientsRes.value.data) {
    for (const c of clientsRes.value.data) {
      items.push({
        id: `client-${c.id}`,
        type: "client",
        message: `Novo cliente cadastrado: ${c.name}`,
        timestamp: c.created_at,
      });
    }
  }

  if (contractsRes.status === "fulfilled" && contractsRes.value.data) {
    for (const c of contractsRes.value.data) {
      const statusLabel =
        c.status === "signed"
          ? "assinado"
          : c.status === "sent"
            ? "enviado para assinatura"
            : "criado";
      const title = c.title && c.title.trim() ? c.title : "Contrato";
      items.push({
        id: `contract-${c.id}`,
        type: "contract",
        message: `${title} ${statusLabel}`,
        timestamp: c.created_at,
      });
    }
  }

  if (onboardingsRes.status === "fulfilled" && onboardingsRes.value.data) {
    for (const r of onboardingsRes.value.data) {
      const clientName = (r.clients as { name?: string } | null)?.name ?? "cliente";
      const statusLabel =
        r.status === "completed"
          ? "concluído"
          : r.status === "awaiting_form"
            ? "aguardando formulário"
            : r.status === "failed"
              ? "com falha"
              : "iniciado";
      items.push({
        id: `onboarding-${r.id}`,
        type: "onboarding",
        message: `Onboarding ${statusLabel}: ${clientName}`,
        timestamp: r.created_at,
      });
    }
  }

  if (projectsRes.status === "fulfilled" && projectsRes.value.data) {
    for (const p of projectsRes.value.data) {
      items.push({
        id: `project-${p.id}`,
        type: "project",
        message: `Projeto criado: ${p.name}`,
        timestamp: p.created_at,
      });
    }
  }

  return items
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);
}

// ─── Próximos prazos ──────────────────────────────────────────────────────────

export async function getUpcomingDeadlines(): Promise<UpcomingDeadlineItem[]> {
  const { agencyId } = await getCurrentUserAgency();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in14Days = new Date(today);
  in14Days.setDate(today.getDate() + 14);

  const { data } = await supabase
    .from("project_tasks")
    .select("id, title, due_date, status, projects(name)")
    .eq("agency_id", agencyId)
    .neq("status", "done")
    .not("due_date", "is", null)
    .lte("due_date", in14Days.toISOString().split("T")[0])
    .order("due_date", { ascending: true })
    .limit(6);

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return (data ?? []).map((t: any) => {
    const due = new Date(t.due_date);
    due.setHours(0, 0, 0, 0);
    const daysLeft = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return {
      id: t.id,
      title: t.title,
      projectName: (t.projects as { name?: string } | null)?.name ?? "—",
      dueDate: due.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      daysLeft,
      overdue: daysLeft < 0,
    };
  });
}

// ─── Status dos contratos ─────────────────────────────────────────────────────

export async function getContractStatusCounts(): Promise<ContractStatusCount[]> {
  const { agencyId } = await getCurrentUserAgency();

  const { data } = await supabase.from("contracts").select("status").eq("agency_id", agencyId);

  const raw = data ?? [];
  const counts: Record<string, number> = {};
  for (const c of raw) counts[c.status] = (counts[c.status] ?? 0) + 1;

  const STATUS_META: { status: string; label: string; color: string }[] = [
    { status: "draft", label: "Rascunho", color: "bg-muted-foreground/60" },
    { status: "sent", label: "Enviado", color: "bg-blue-500" },
    { status: "pending", label: "Pendente", color: "bg-yellow-500" },
    { status: "signed", label: "Assinado", color: "bg-emerald-500" },
    { status: "expired", label: "Expirado", color: "bg-destructive" },
  ];

  return STATUS_META.map((m) => ({ ...m, count: counts[m.status] ?? 0 }));
}

// ─── Progresso dos onboardings ────────────────────────────────────────────────

export async function getOnboardingProgress(): Promise<OnboardingProgressItem[]> {
  const { agencyId } = await getCurrentUserAgency();

  const { data: runs } = await supabase
    .from("onboarding_runs")
    .select("id, status, clients(name)")
    .eq("agency_id", agencyId)
    .in("status", ["running", "awaiting_form", "partial", "completed"])
    .order("created_at", { ascending: false })
    .limit(5);

  if (!runs || runs.length === 0) return [];

  const runIds = runs.map((r) => r.id);
  const { data: logs } = await supabase
    .from("onboarding_step_logs")
    .select("run_id, status")
    .in("run_id", runIds);

  return runs.map((r: any) => {
    const runLogs = (logs ?? []).filter((l) => l.run_id === r.id);
    const totalSteps = runLogs.length;
    const completedSteps = runLogs.filter((l) => l.status === "completed").length;
    const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
    return {
      id: r.id,
      clientName: (r.clients as { name?: string } | null)?.name ?? "—",
      status: r.status,
      completedSteps,
      totalSteps,
      progress,
    };
  });
}
