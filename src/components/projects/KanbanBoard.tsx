import { useState } from "react";
import { KanbanColumn } from "./KanbanColumn";
import type { ProjectStatus, ProjectTask } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const columns: { status: ProjectStatus; title: string }[] = [
  { status: "backlog", title: "Backlog" },
  { status: "in_progress", title: "Em andamento" },
  { status: "review", title: "Revisão" },
  { status: "done", title: "Concluído" },
];

export function KanbanBoard({ tasks }: { tasks: ProjectTask[] }) {
  const [selected, setSelected] = useState<ProjectTask | null>(null);

  console.log("[KanbanBoard] render", tasks.length);

  return (
    <>
      <div className="-mx-4 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0">
        <div className="flex gap-4">
          {columns.map((col) => (
            <KanbanColumn
              key={col.status}
              title={col.title}
              status={col.status}
              tasks={tasks.filter((t) => t.status === col.status)}
              onTaskClick={(t) => setSelected(t)}
            />
          ))}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="glass-card border-border">
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
            <DialogDescription>
              Cliente: {selected?.clientName} · Responsável: {selected?.assignee}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              Detalhes da tarefa apareceriam aqui. Esta é uma visualização de demonstração.
            </p>
            {selected?.dueDate && (
              <p>
                <span className="text-muted-foreground">Vencimento:</span>{" "}
                {new Date(selected.dueDate).toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
