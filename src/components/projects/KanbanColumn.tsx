import { KanbanCard } from "./KanbanCard";
import type { ProjectStatus, ProjectTask } from "@/lib/types";

interface KanbanColumnProps {
  title: string;
  status: ProjectStatus;
  tasks: ProjectTask[];
  onTaskClick?: (t: ProjectTask) => void;
}

export function KanbanColumn({ title, tasks, onTaskClick }: KanbanColumnProps) {
  return (
    <div className="glass-panel flex w-72 shrink-0 flex-col rounded-2xl p-3 sm:w-80">
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-muted-foreground">{tasks.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {tasks.map((t) => (
          <KanbanCard key={t.id} task={t} onClick={() => onTaskClick?.(t)} />
        ))}
        {tasks.length === 0 && (
          <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
            Nenhuma tarefa
          </p>
        )}
      </div>
    </div>
  );
}
