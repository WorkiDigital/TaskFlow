import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Rocket,
  FileText,
  KanbanSquare,
  Settings,
  Sparkles,
  Workflow,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkspaceSwitcher } from "@/components/workspaces/WorkspaceSwitcher";

export const navItems = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    subtitle: "Visão geral da agência",
  },
  { to: "/clients", label: "Clientes", icon: Users, subtitle: "Sua carteira de clientes" },
  { to: "/onboarding", label: "Onboarding", icon: Rocket, subtitle: "Novos clientes em jornada" },
  { to: "/contracts", label: "Contratos", icon: FileText, subtitle: "Documentos e assinaturas" },
  { to: "/projects", label: "Projetos", icon: KanbanSquare, subtitle: "Entregas em andamento" },
  {
    to: "/templates",
    label: "Templates",
    icon: Layers,
    subtitle: "Modelos operacionais de projeto",
  },
  { to: "/automations", label: "Automacoes", icon: Workflow, subtitle: "Fluxos e execucoes" },
  { to: "/settings", label: "Configurações", icon: Settings, subtitle: "Sua agência e equipe" },
] as const;

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const currentPath = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="flex h-full w-full flex-col gap-6 border-r border-border bg-sidebar/60 p-4 backdrop-blur-xl">
      <Link
        to="/dashboard"
        onClick={onNavigate}
        className="flex min-h-11 items-center gap-2 rounded-xl px-2 pt-2 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label="Ir para o dashboard do TaskFlow"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-[var(--shadow-glow)]">
          <Sparkles className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold">Agência Prime</p>
          <p className="truncate text-xs text-muted-foreground">Plataforma SaaS</p>
        </div>
      </Link>

      <div className="px-2">
        <WorkspaceSwitcher />
      </div>

      <nav className="flex flex-1 flex-col gap-1" aria-label="Navegação principal">
        {navItems.map((item) => {
          const active = currentPath === item.to || currentPath.startsWith(item.to + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                active
                  ? "bg-primary/15 text-foreground shadow-[inset_0_0_0_1px_oklch(0.68_0.19_285/0.35)]"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0 transition-colors", active && "text-primary")} aria-hidden="true" />
              <span className="truncate font-medium">{item.label}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />}
            </Link>
          );
        })}
      </nav>

      <div className="glass-panel rounded-xl p-3 text-xs text-muted-foreground" aria-label="Informações do plano">
        <p className="font-medium text-foreground">Plano Pro</p>
        <p className="mt-1">Renovação em 18 dias</p>
      </div>
    </aside>
  );
}
