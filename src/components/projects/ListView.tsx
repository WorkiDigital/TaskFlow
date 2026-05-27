import { useState } from "react";
import { ProjectTask } from "@/data/mockProjects";
import { type DbProjectColumn } from "@/services/projectsService";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  CheckCircle2,
  MoreHorizontal,
  Folder,
  Plus,
  Pencil,
  Copy,
  UserPlus,
  Trash2,
  ChevronRight,
  ChevronDown,
  GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface ListViewProps {
  columns: DbProjectColumn[];
  tasks: ProjectTask[];
  onTaskClick: (task: ProjectTask) => void;
  onAddTask?: (columnId: string) => void;
  onTaskAction?: (
    action: "edit" | "duplicate" | "change_assignee" | "delete",
    task: ProjectTask,
  ) => void;
}

const priorityColors: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-500",
  medium: "bg-yellow-500/10 text-yellow-500",
  high: "bg-orange-500/10 text-orange-500",
  urgent: "bg-red-500/10 text-red-500",
};

const priorityLabels: Record<string, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
};

function TaskRow({
  task,
  subtasks,
  allTasks,
  indent,
  onTaskClick,
  onTaskAction,
}: {
  task: ProjectTask;
  subtasks: ProjectTask[];
  allTasks: ProjectTask[];
  indent: number;
  onTaskClick: (t: ProjectTask) => void;
  onTaskAction?: ListViewProps["onTaskAction"];
}) {
  const [expanded, setExpanded] = useState(false);
  const hasSubtasks = subtasks.length > 0;
  const completedChecklist = task.checklist?.filter((c) => c.done).length || 0;
  const totalChecklist = task.checklist?.length || 0;

  return (
    <>
      <tr
        onClick={() => onTaskClick(task)}
        className="group hover:bg-white/5 cursor-pointer transition-colors"
      >
        {/* Tarefa */}
        <td className="py-1.5 pr-3" style={{ paddingLeft: `${indent * 20 + 12}px` }}>
          <div className="flex items-center gap-2">
            {/* Expand arrow */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (hasSubtasks) setExpanded((v) => !v);
              }}
              aria-label={
                hasSubtasks
                  ? expanded
                    ? "Recolher subtarefas"
                    : "Expandir subtarefas"
                  : undefined
              }
              className={cn(
                "w-4 h-4 shrink-0 flex items-center justify-center rounded transition-colors",
                hasSubtasks
                  ? "text-muted-foreground hover:text-foreground hover:bg-white/10 cursor-pointer"
                  : "text-transparent cursor-default",
              )}
            >
              {hasSubtasks &&
                (expanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                ))}
            </button>

            <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />

            <div>
              <p className="font-medium text-[13px] text-foreground line-clamp-1">
                {task.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {hasSubtasks && (
                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <GitBranch className="w-2.5 h-2.5" />
                    {subtasks.filter((s) => s.status === "done").length}/{subtasks.length}
                  </span>
                )}
                {totalChecklist > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    {completedChecklist}/{totalChecklist} checks
                  </span>
                )}
                {task.description && !hasSubtasks && !totalChecklist && (
                  <span className="text-[10px] text-muted-foreground line-clamp-1">
                    {task.description}
                  </span>
                )}
              </div>
            </div>
          </div>
        </td>

        {/* Responsável */}
        <td className="py-1.5 px-3">
          {task.assignee ? (
            <div className="flex items-center gap-2">
              <Avatar className="w-5 h-5">
                <AvatarFallback className="text-[9px] bg-primary/20">
                  {task.assignee.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-[11px] text-muted-foreground">{task.assignee}</span>
            </div>
          ) : (
            <span className="text-muted-foreground/30 text-[11px]">—</span>
          )}
        </td>

        {/* Prioridade */}
        <td className="py-1.5 px-3">
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] uppercase font-semibold border-transparent px-1.5 py-0",
              priorityColors[task.priority],
            )}
          >
            {priorityLabels[task.priority]}
          </Badge>
        </td>

        {/* Prazo */}
        <td className="py-1.5 px-3 whitespace-nowrap">
          {task.dueDate ? (
            <span
              className={cn(
                "text-[11px] font-medium",
                new Date(task.dueDate) < new Date() ? "text-red-400" : "text-muted-foreground",
              )}
            >
              {new Date(task.dueDate).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
              })}
            </span>
          ) : (
            <span className="text-muted-foreground/30">—</span>
          )}
        </td>

        {/* Tags */}
        <td className="py-1.5 px-3">
          <div className="flex flex-wrap gap-1">
            {task.tags?.slice(0, 2).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-[9px] px-1.5 py-0 bg-white/5 text-muted-foreground"
              >
                {tag}
              </Badge>
            ))}
            {(task.tags?.length || 0) > 2 && (
              <Badge
                variant="secondary"
                className="text-[9px] px-1.5 py-0 bg-white/5 text-muted-foreground"
              >
                +{task.tags.length - 2}
              </Badge>
            )}
          </div>
        </td>

        {/* Ações */}
        <td className="py-1.5 px-3 text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100"
                aria-label="Ações da tarefa"
              >
                <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onTaskAction?.("edit", task); }}
              >
                <Pencil className="mr-2 h-4 w-4" /> Editar tarefa
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onTaskAction?.("change_assignee", task); }}
              >
                <UserPlus className="mr-2 h-4 w-4" /> Alterar responsável
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onTaskAction?.("duplicate", task); }}
              >
                <Copy className="mr-2 h-4 w-4" /> Duplicar tarefa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onTaskAction?.("delete", task); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Excluir tarefa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>

      {/* Subtask rows — inline, indented, flat (no further nesting) */}
      {expanded &&
        subtasks.map((sub) => (
          <TaskRow
            key={sub.id}
            task={sub}
            subtasks={[]}
            allTasks={allTasks}
            indent={indent + 1}
            onTaskClick={onTaskClick}
            onTaskAction={onTaskAction}
          />
        ))}
    </>
  );
}

export function ListView({ columns, tasks, onTaskClick, onAddTask, onTaskAction }: ListViewProps) {
  // Only root tasks (no parent) shown at top level
  const rootTasks = tasks.filter((t) => !t.parentTaskId);

  if (rootTasks.length === 0 && tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center glass-card border border-dashed border-white/10 bg-black/10 rounded-xl">
        <Folder className="w-12 h-12 text-muted-foreground/30 mb-4 animate-pulse" />
        <h3 className="font-semibold text-base text-slate-200">Esta lista está vazia</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-6 max-w-sm leading-relaxed">
          Não existem tarefas criadas nesta lista. Comece a organizar suas entregas agora mesmo!
        </p>
        <Button
          onClick={() => onAddTask?.(columns[0]?.id ?? "")}
          className="min-h-[44px] text-xs font-semibold px-4 cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Adicionar Primeira Tarefa
        </Button>
      </div>
    );
  }

  // Group root tasks by column
  const groupedTasks = [...columns]
    .sort((a, b) => a.position - b.position)
    .map((col) => ({
      id: col.id,
      title: col.title,
      color: col.color ?? "#6b7280",
      icon: col.icon ?? "📋",
      tasks: rootTasks.filter((t) => t.columnId === col.id),
    }));

  return (
    <div className="flex flex-col gap-6">
      {groupedTasks.map((group) => {
        if (group.tasks.length === 0) return null;

        return (
          <div key={group.id} className="space-y-2 animate-in fade-in-50 duration-300">
            {/* Group Header */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-sm inline-block"
                  style={{ backgroundColor: group.color }}
                />
                <h3 className="font-semibold text-sm">
                  {group.icon} {group.title}
                </h3>
                <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">
                  {group.tasks.length}
                </span>
              </div>

              {onAddTask && (
                <button
                  onClick={() => onAddTask(group.id)}
                  className="text-xs text-primary/80 hover:text-primary flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar tarefa</span>
                </button>
              )}
            </div>

            {/* List Table */}
            <div className="border border-white/10 rounded-xl overflow-hidden bg-black/20 glass-card overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-white/5 text-xs text-muted-foreground">
                  <tr>
                    <th className="font-medium py-1.5 px-3 w-1/2">Tarefa</th>
                    <th className="font-medium py-1.5 px-3">Responsável</th>
                    <th className="font-medium py-1.5 px-3">Prioridade</th>
                    <th className="font-medium py-1.5 px-3">Prazo</th>
                    <th className="font-medium py-1.5 px-3">Tags</th>
                    <th className="py-1.5 px-3 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {group.tasks.map((task) => {
                    const subtasks = tasks.filter((t) => t.parentTaskId === task.id);
                    return (
                      <TaskRow
                        key={task.id}
                        task={task}
                        subtasks={subtasks}
                        allTasks={tasks}
                        indent={0}
                        onTaskClick={onTaskClick}
                        onTaskAction={onTaskAction}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
