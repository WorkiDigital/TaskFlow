import { useState } from "react";
import { ProjectTask } from "@/data/mockProjects";
import { KanbanCard } from "./KanbanCard";
import { Plus, ListTodo, MoreHorizontal, Settings2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DbProjectColumn } from "@/services/projectsService";

interface KanbanColumnProps {
  column: DbProjectColumn;
  tasks: ProjectTask[];
  onTaskClick: (task: ProjectTask) => void;
  onAddTask?: (columnId: string) => void;
  onTaskAction?: (
    action: "edit" | "duplicate" | "change_assignee" | "delete",
    task: ProjectTask,
  ) => void;
  onEditColumn?: (column: DbProjectColumn) => void;
  onDeleteColumn?: (columnId: string) => void;
}

export function KanbanColumn({
  column,
  tasks,
  onTaskClick,
  onAddTask,
  onTaskAction,
  onEditColumn,
  onDeleteColumn,
}: KanbanColumnProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const color = column.color ?? "#6b7280";
  const icon = column.icon ?? "📋";

  const handleDelete = () => {
    if (confirmDelete) {
      onDeleteColumn?.(column.id);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-black/20 p-3 border border-white/5 shrink-0 w-[300px] min-h-[520px] max-h-[calc(100vh-260px)]">
      {/* Header */}
      <div className="flex items-center gap-2 px-1 sticky top-0 z-10">
        {/* Color stripe */}
        <div className="w-1 h-5 rounded-full shrink-0" style={{ backgroundColor: color }} />

        {/* Icon */}
        <span className="text-base leading-none">{icon}</span>

        {/* Title */}
        <h3 className="font-semibold text-sm text-foreground flex-1 truncate">{column.title}</h3>

        {/* Count */}
        <span className="flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-white/10 text-[10px] font-medium text-foreground">
          {tasks.length}
        </span>

        {/* Add task */}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-white/10"
          onClick={() => onAddTask?.(column.id)}
          title="Nova tarefa"
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>

        {/* Column menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-white/10"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 bg-background border-border">
            <DropdownMenuItem
              onClick={() => onEditColumn?.(column)}
              className="gap-2 text-sm cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5" />
              Configurar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className={`gap-2 text-sm cursor-pointer ${
                confirmDelete ? "text-destructive focus:text-destructive" : ""
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {confirmDelete ? "Confirmar exclusão" : "Excluir coluna"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Automation indicators */}
      {(column.automation_config?.notify_whatsapp_client ||
        column.automation_config?.mark_project_done) && (
        <div className="flex gap-1 px-1">
          {column.automation_config.notify_whatsapp_client && (
            <span
              title="Notifica cliente via WhatsApp"
              className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20"
            >
              WhatsApp
            </span>
          )}
          {column.automation_config.mark_project_done && (
            <span
              title="Marca projeto como concluído"
              className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
            >
              Finaliza projeto
            </span>
          )}
        </div>
      )}

      {/* Tasks */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto custom-scrollbar pb-2 px-1">
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} onClick={onTaskClick} onAction={onTaskAction} />
        ))}

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center p-6 mt-2 rounded-xl border border-dashed border-white/10 bg-white/[0.02] text-center">
            <ListTodo className="w-6 h-6 text-muted-foreground/50 mb-2" />
            <p className="text-xs font-medium text-muted-foreground">Nenhuma tarefa aqui</p>
            <p className="text-[10px] text-muted-foreground/70 mt-1 mb-3">Clique para começar</p>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs bg-transparent border-white/10 hover:bg-white/5"
              onClick={() => onAddTask?.(column.id)}
            >
              <Plus className="w-3 h-3 mr-1" /> Nova tarefa
            </Button>
          </div>
        )}

        {tasks.length > 0 && (
          <Button
            variant="ghost"
            className="w-full h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 justify-start mt-1"
            onClick={() => onAddTask?.(column.id)}
          >
            <Plus className="w-3 h-3 mr-2" /> Nova tarefa
          </Button>
        )}
      </div>
    </div>
  );
}
