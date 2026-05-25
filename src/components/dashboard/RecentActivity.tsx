import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, UserPlus, Rocket, KanbanSquare } from "lucide-react";
import { getRecentActivity, type RecentActivityItem } from "@/services/dashboardService";

const iconMap = {
  contract: FileText,
  client: UserPlus,
  onboarding: Rocket,
  project: KanbanSquare,
} as const;

function formatTimestamp(ts: string) {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `há ${diffD}d`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function RecentActivity() {
  const [items, setItems] = useState<RecentActivityItem[] | null>(null);

  useEffect(() => {
    getRecentActivity()
      .then(setItems)
      .catch((e) => {
        console.error("[Dashboard] atividades:", e);
        setItems([]);
      });
  }, []);

  return (
    <GlassCard className="flex flex-col flex-1 h-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Atividades recentes</h3>
        <StatusBadge tone="primary">Ao vivo</StatusBadge>
      </div>

      {!items ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Nenhuma atividade registrada ainda.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((a) => {
            const Icon = iconMap[a.type];
            return (
              <li
                key={a.id}
                className="flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/5"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{a.message}</p>
                  <p className="text-xs text-muted-foreground">{formatTimestamp(a.timestamp)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </GlassCard>
  );
}
