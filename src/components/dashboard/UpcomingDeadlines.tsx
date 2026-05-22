import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { mockDeadlines } from "@/lib/mock-data";
import { CalendarDays } from "lucide-react";

const toneMap = {
  contract: "primary",
  delivery: "warning",
  meeting: "info",
} as const;

export function UpcomingDeadlines() {
  return (
    <GlassCard className="h-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Próximos prazos</h3>
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
      </div>
      <ul className="space-y-3">
        {mockDeadlines.map((d) => (
          <li
            key={d.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/30 px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{d.title}</p>
              <p className="truncate text-xs text-muted-foreground">{d.clientName}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <StatusBadge tone={toneMap[d.type]}>{d.dueDate}</StatusBadge>
            </div>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
