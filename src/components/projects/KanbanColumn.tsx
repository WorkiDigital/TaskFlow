import { ProjectTask, TaskStatus } from "@/data/mockProjects";
import { KanbanCard } from "./KanbanCard";
import { Plus, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface KanbanColumnProps {
  title: string;
  status: TaskStatus;
  tasks: ProjectTask[];
  onTaskClick: (task: ProjectTask) => void;
  onAddTask?: (status: TaskStatus) => void;
}

export function KanbanColumn({ title, status, tasks, onTaskClick, onAddTask }: KanbanColumnProps) {
  const handleCreateTask = () => {
    if (onAddTask) {
      onAddTask(status);
    } else {
      toast.info("Criar tarefa em " + title);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-black/20 p-3 border border-white/5 shrink-0 w-[320px] min-h-[520px] max-h-[calc(100vh-260px)]">
      <div className="flex items-center justify-between px-1 sticky top-0 z-10">
        <h3 className="font-semibold text-sm text-foreground">{title}</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-white/10" onClick={handleCreateTask} title="Nova tarefa">
            <Plus className="w-4 h-4" />
          </Button>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-medium text-foreground">
            {tasks.length}
          </span>
        </div>
      </div>
      
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto custom-scrollbar pb-2 px-1">
        {/* Nova tarefa Button directly in the list if preferred, but adding at the top is cleaner. We will keep it in header and also an optional fast add at bottom. */}
        
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} onClick={onTaskClick} />
        ))}
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center p-6 mt-2 rounded-xl border border-dashed border-white/10 bg-white/[0.02] text-center">
            <ListTodo className="w-6 h-6 text-muted-foreground/50 mb-2" />
            <p className="text-xs font-medium text-muted-foreground">Nenhuma tarefa aqui</p>
            <p className="text-[10px] text-muted-foreground/70 mt-1 mb-3">Clique para começar</p>
            <Button variant="outline" size="sm" className="h-7 text-xs bg-transparent border-white/10 hover:bg-white/5" onClick={handleCreateTask}>
              <Plus className="w-3 h-3 mr-1" /> Nova tarefa
            </Button>
          </div>
        )}
        
        {/* Fast Add Bottom Button for populated lists */}
        {tasks.length > 0 && (
          <Button variant="ghost" className="w-full h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 justify-start mt-1" onClick={handleCreateTask}>
            <Plus className="w-3 h-3 mr-2" /> Nova tarefa
          </Button>
        )}
      </div>
    </div>
  );
}
