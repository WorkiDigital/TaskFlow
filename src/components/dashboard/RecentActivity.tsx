import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Activity } from "@/lib/types";
import { mockActivities } from "@/lib/mock-data";
import { FileText, UserPlus, Rocket, KanbanSquare } from "lucide-react";

const iconMap = {
  contract: FileText,
  client: UserPlus,
  onboarding: Rocket,
  project: KanbanSquare,
} as const;

export function RecentActivity() {
  const [items, setItems] = useState<Activity[] | null>(null);

  useEffect(() => {
    console.log("[Dashboard] carregando atividades recentes");
    const t = setTimeout(() => setItems(mockActivities), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <GlassCard className="h-full">
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
      ) : (
        <ul className="space-y-3">
          {items.map((a) => {
            const Icon = iconMap[a.type];
            return (
              <li key={a.id} className="flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/5">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{a.message}</p>
                  <p className="text-xs text-muted-foreground">{a.timestamp}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </GlassCard>
  );
}
