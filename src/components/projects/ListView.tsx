import { ProjectTask, mockProjectColumns, TaskStatus } from "@/data/mockProjects";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle2, MoreHorizontal, Folder, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ListViewProps {
  tasks: ProjectTask[];
  onTaskClick: (task: ProjectTask) => void;
  onAddTask?: (status: TaskStatus) => void;
}

const priorityColors = {
  low: "bg-blue-500/10 text-blue-500",
  medium: "bg-yellow-500/10 text-yellow-500",
  high: "bg-orange-500/10 text-orange-500",
  urgent: "bg-red-500/10 text-red-500",
};

const priorityLabels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
};

export function ListView({ tasks, onTaskClick, onAddTask }: ListViewProps) {
  // If the project is completely empty, show a premium Empty State
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center glass-card border border-dashed border-white/10 bg-black/10 rounded-xl">
        <Folder className="w-12 h-12 text-muted-foreground/30 mb-4 animate-pulse" />
        <h3 className="font-semibold text-base text-slate-200">Esta lista está vazia</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-6 max-w-sm leading-relaxed">
          Não existem tarefas criadas nesta lista (projeto). Comece a organizar suas entregas agora mesmo!
        </p>
        <Button 
          onClick={() => onAddTask?.("todo")}
          className="h-8 text-xs font-semibold px-4 cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Adicionar Primeira Tarefa
        </Button>
      </div>
    );
  }

  // Group tasks by status
  const groupedTasks = mockProjectColumns.map(col => ({
    ...col,
    tasks: tasks.filter(t => t.status === col.status)
  }));

  return (
    <div className="flex flex-col gap-6">
      {groupedTasks.map(group => {
        // In ClickUp style, we can show status headers even if they are empty, but to avoid visual clutter
        // we'll show populated ones AND at least the 'todo' group as a placeholder if everything else is empty.
        if (group.tasks.length === 0) return null;
        
        return (
          <div key={group.id} className="space-y-2 animate-in fade-in-50 duration-300">
            {/* Group Header */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-sm", group.color)} />
                <h3 className="font-semibold text-sm">{group.title}</h3>
                <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">
                  {group.tasks.length}
                </span>
              </div>
              
              {onAddTask && (
                <button
                  onClick={() => onAddTask(group.status)}
                  className="text-xs text-primary/80 hover:text-primary flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar tarefa</span>
                </button>
              )}
            </div>

            {/* List Table */}
            <div className="border border-white/10 rounded-xl overflow-hidden bg-black/20 glass-card">
              <table className="w-full text-left text-sm">
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
                  {group.tasks.map(task => {
                    const completedChecklist = task.checklist?.filter(c => c.done).length || 0;
                    const totalChecklist = task.checklist?.length || 0;

                    return (
                      <tr 
                        key={task.id} 
                        onClick={() => onTaskClick(task)}
                        className="group hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        <td className="py-1.5 px-3">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
                            <div>
                              <p className="font-medium text-[13px] text-foreground line-clamp-1">{task.title}</p>
                              {(totalChecklist > 0 || task.description) && (
                                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                                  {totalChecklist > 0 && <span className="mr-2">{completedChecklist}/{totalChecklist} checks</span>}
                                  {task.description && <span>{task.description}</span>}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-1.5 px-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-5 h-5">
                              <AvatarFallback className="text-[9px] bg-primary/20">{task.assignee}</AvatarFallback>
                            </Avatar>
                            <span className="text-[11px] text-muted-foreground">{task.assignee}</span>
                          </div>
                        </td>
                        <td className="py-1.5 px-3">
                          <Badge variant="outline" className={cn("text-[9px] uppercase font-semibold border-transparent px-1.5 py-0", priorityColors[task.priority])}>
                            {priorityLabels[task.priority]}
                          </Badge>
                        </td>
                        <td className="py-1.5 px-3 whitespace-nowrap">
                          {task.dueDate ? (
                            <span className={cn(
                              "text-[11px] font-medium",
                              new Date(task.dueDate) < new Date() ? 'text-red-400' : 'text-muted-foreground'
                            )}>
                              {new Date(task.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                            </span>
                          ) : <span className="text-muted-foreground">-</span>}
                        </td>
                        <td className="py-1.5 px-3">
                          <div className="flex flex-wrap gap-1">
                            {task.tags?.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-[9px] px-1.5 py-0 bg-white/5 text-muted-foreground">{tag}</Badge>
                            ))}
                            {(task.tags?.length || 0) > 2 && (
                              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-white/5 text-muted-foreground">+{task.tags.length - 2}</Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-1.5 px-3 text-right">
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                            <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                        </td>
                      </tr>
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
