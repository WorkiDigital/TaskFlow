import { cn } from "@/lib/utils";
import type { Priority, ProjectTask } from "@/lib/types";

const priorityTone: Record<Priority, string> = {
  low: "bg-info/15 text-info border-info/30",
  medium: "bg-warning/15 text-warning border-warning/30",
  high: "bg-destructive/15 text-destructive border-destructive/30",
};

const priorityLabel: Record<Priority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

export function KanbanCard({ task, onClick }: { task: ProjectTask; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="glass-card w-full p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40"
    >
      <p className="text-sm font-medium leading-snug">{task.title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{task.clientName}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", priorityTone[task.priority])}>
          {priorityLabel[task.priority]}
        </span>
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-[10px] font-semibold text-primary-foreground">
          {task.assignee}
        </div>
      </div>
    </button>
  );
}
