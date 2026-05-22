import { createFileRoute } from "@tanstack/react-router";
import { Users, Rocket, FileText, KanbanSquare } from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { UpcomingDeadlines } from "@/components/dashboard/UpcomingDeadlines";
import { ContractsStatusCard } from "@/components/dashboard/ContractsStatusCard";
import { OnboardingProgressCard } from "@/components/dashboard/OnboardingProgressCard";
import { dashboardMetrics } from "@/lib/mock-data";
import { useEffect } from "react";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  useEffect(() => {
    console.log("[Dashboard] montado", dashboardMetrics);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Olá, Ana 👋</h2>
        <p className="text-sm text-muted-foreground">Aqui está o pulso da sua agência hoje.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Clientes ativos"
          value={dashboardMetrics.activeClients}
          icon={Users}
          tint="primary"
          delta={{ value: "+3", positive: true }}
        />
        <MetricCard
          label="Onboardings em andamento"
          value={dashboardMetrics.onboardingInProgress}
          icon={Rocket}
          tint="accent"
          delta={{ value: "+2", positive: true }}
        />
        <MetricCard
          label="Contratos pendentes"
          value={dashboardMetrics.pendingContracts}
          icon={FileText}
          tint="warning"
          delta={{ value: "-1", positive: false }}
        />
        <MetricCard
          label="Projetos ativos"
          value={dashboardMetrics.activeProjects}
          icon={KanbanSquare}
          tint="success"
          delta={{ value: "+4", positive: true }}
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
