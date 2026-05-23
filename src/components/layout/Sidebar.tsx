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

export const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, subtitle: "Visão geral da agência" },
  { to: "/clients", label: "Clientes", icon: Users, subtitle: "Sua carteira de clientes" },
  { to: "/onboarding", label: "Onboarding", icon: Rocket, subtitle: "Novos clientes em jornada" },
  { to: "/contracts", label: "Contratos", icon: FileText, subtitle: "Documentos e assinaturas" },
  { to: "/projects", label: "Projetos", icon: KanbanSquare, subtitle: "Entregas em andamento" },
  { to: "/templates", label: "Templates", icon: Layers, subtitle: "Modelos operacionais de projeto" },
  { to: "/settings", label: "Configurações", icon: Settings, subtitle: "Sua agência e equipe" },
] as const;

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const currentPath = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="flex h-full w-full flex-col gap-6 border-r border-border bg-sidebar/60 p-4 backdrop-blur-xl lg:w-64">
      <Link to="/dashboard" onClick={onNavigate} className="flex items-center gap-2 px-2 pt-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-[var(--shadow-glow)]">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Agência Prime</p>
          <p className="text-[11px] text-muted-foreground">Plataforma SaaS</p>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const active = currentPath === item.to || currentPath.startsWith(item.to + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                active
                  ? "bg-primary/15 text-foreground shadow-[inset_0_0_0_1px_oklch(0.68_0.19_285/0.35)]"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
              )}
            >
              <Icon className={cn("h-4 w-4 transition-colors", active && "text-primary")} />
              <span className="font-medium">{item.label}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>

      <div className="glass-panel rounded-xl p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Plano Pro</p>
        <p className="mt-1">Renovação em 18 dias</p>
      </div>
    </aside>
  );
}
