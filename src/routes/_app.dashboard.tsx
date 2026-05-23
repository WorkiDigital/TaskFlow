import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Users, Rocket, FileText, KanbanSquare } from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { UpcomingDeadlines } from "@/components/dashboard/UpcomingDeadlines";
import { ContractsStatusCard } from "@/components/dashboard/ContractsStatusCard";
import { OnboardingProgressCard } from "@/components/dashboard/OnboardingProgressCard";
import { getDashboardMetrics, type DashboardMetrics } from "@/services/dashboardService";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    getDashboardMetrics()
      .then(setMetrics)
      .catch(e => console.error("[Dashboard] Erro ao carregar métricas:", e));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full px-4 py-6 md:px-8 md:py-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Visão Geral</h2>
        <p className="text-sm text-muted-foreground">Aqui está o pulso da sua agência hoje.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Clientes"
          value={metrics?.totalClients ?? 0}
          icon={Users}
          tint="primary"
        />
        <MetricCard
          label="Onboardings em andamento"
          value={metrics?.activeOnboardings ?? 0}
          icon={Rocket}
          tint="accent"
        />
        <MetricCard
          label="Contratos pendentes"
          value={metrics?.pendingContracts ?? 0}
          icon={FileText}
          tint="warning"
        />
        <MetricCard
          label="Projetos ativos"
          value={metrics?.activeProjects ?? 0}
          icon={KanbanSquare}
          tint="success"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
        <UpcomingDeadlines />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ContractsStatusCard />
        <OnboardingProgressCard />
      </div>
    </div>
  );
}
