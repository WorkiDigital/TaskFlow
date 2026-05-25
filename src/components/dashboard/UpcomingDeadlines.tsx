import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays } from "lucide-react";
import { getUpcomingDeadlines, type UpcomingDeadlineItem } from "@/services/dashboardService";
import { cn } from "@/lib/utils";

export function UpcomingDeadlines() {
  const [items, setItems] = useState<UpcomingDeadlineItem[] | null>(null);

  useEffect(() => {
    getUpcomingDeadlines()
      .then(setItems)
      .catch((e) => {
        console.error("[Dashboard] prazos:", e);
        setItems([]);
      });
  }, []);

  return (
    <GlassCard className="flex flex-col flex-1 h-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Próximos prazos</h3>
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
      </div>

      {!items ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Nenhum prazo nos próximos 14 dias.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/30 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{d.title}</p>
                <p className="truncate text-xs text-muted-foreground">{d.projectName}</p>
              </div>
              <div className="shrink-0 text-right">
                <p
                  className={cn(
                    "text-xs font-semibold",
                    d.overdue
                      ? "text-destructive"
                      : d.daysLeft <= 2
                        ? "text-yellow-400"
                        : "text-muted-foreground",
                  )}
                >
                  {d.overdue
                    ? `${Math.abs(d.daysLeft)}d atrasado`
                    : d.daysLeft === 0
                      ? "hoje"
                      : `${d.daysLeft}d`}
                </p>
                <p className="text-xs text-muted-foreground">{d.dueDate}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
