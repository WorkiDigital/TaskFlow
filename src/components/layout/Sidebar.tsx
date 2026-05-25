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
import { useSidebar } from "@/contexts/SidebarContext";

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
  const { isCollapsed } = useSidebar();

  return (
    <aside className={cn(
      "flex h-full w-full flex-col gap-6 border-r border-border bg-sidebar/60 p-4 backdrop-blur-xl transition-all duration-300 ease-in-out",
      isCollapsed && "p-3 items-center"
    )}>
      <Link
        to="/dashboard"
        onClick={onNavigate}
        className={cn(
          "flex min-h-11 items-center gap-2 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isCollapsed ? "justify-center w-full px-0 pt-0" : "px-2 pt-2"
        )}
        aria-label="Ir para o dashboard do TaskFlow"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-[var(--shadow-glow)]">
          <Sparkles className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
        </div>
        {!isCollapsed && (
          <div className="min-w-0 leading-tight animate-in fade-in duration-300">
            <p className="truncate text-sm font-semibold">Agência Prime</p>
            <p className="truncate text-xs text-muted-foreground">Plataforma SaaS</p>
          </div>
        )}
      </Link>

      <div className={cn("w-full", isCollapsed ? "px-0 flex justify-center" : "px-2")}>
        <WorkspaceSwitcher />
      </div>

      <nav className="flex flex-1 flex-col gap-1 w-full" aria-label="Navegação principal">
        {navItems.map((item) => {
          const active = currentPath === item.to || currentPath.startsWith(item.to + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "group flex min-h-11 items-center rounded-xl text-sm outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isCollapsed ? "justify-center px-0 w-10 h-10 mx-auto" : "gap-3 px-3 py-2 w-full",
                active
                  ? "bg-primary/15 text-foreground shadow-[inset_0_0_0_1px_oklch(0.68_0.19_285/0.35)]"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0 transition-colors", active && "text-primary")} aria-hidden="true" />
              {!isCollapsed && <span className="truncate font-medium animate-in fade-in duration-300">{item.label}</span>}
              {!isCollapsed && active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />}
            </Link>
          );
        })}
      </nav>

      {!isCollapsed ? (
        <div className="glass-panel rounded-xl p-3 text-xs text-muted-foreground animate-in fade-in duration-300" aria-label="Informações do plano">
          <p className="font-medium text-foreground">Plano Pro</p>
          <p className="mt-1">Renovação em 18 dias</p>
        </div>
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs text-primary font-semibold mx-auto cursor-help animate-in fade-in duration-300" title="Plano Pro: Renovação em 18 dias">
          Pro
        </div>
      )}
    </aside>
  );
}
