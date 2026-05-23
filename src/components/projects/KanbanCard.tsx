import { ProjectTask } from "@/data/mockProjects";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, MessageSquare, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface KanbanCardProps {
  task: ProjectTask;
  onClick: (task: ProjectTask) => void;
}

const priorityColors = {
  low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  urgent: "bg-red-500/10 text-red-500 border-red-500/20",
};

const priorityLabels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
};

export function KanbanCard({ task, onClick }: KanbanCardProps) {
  const completedChecklist = task.checklist?.filter(c => c.done).length || 0;
  const totalChecklist = task.checklist?.length || 0;
  const hasChecklist = totalChecklist > 0;
  const commentCount = task.comments?.length || 0;

  return (
    <div
      onClick={() => onClick(task)}
      className="group flex flex-col gap-3 glass-card p-4 cursor-pointer hover:shadow-[var(--shadow-glow)] transition-all duration-300 transform hover:-translate-y-1 bg-[var(--color-card)] border-white/5 hover:border-primary/50 select-none"
    >
      <div className="flex justify-between items-start">
        <div className="flex gap-1.5 flex-wrap">
          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 uppercase font-semibold tracking-wider ${priorityColors[task.priority]}`}>
            {priorityLabels[task.priority]}
          </Badge>
          {task.tags?.map(tag => (
            <Badge key={tag} variant="outline" className="text-[9px] px-1.5 py-0 bg-white/5 border-white/10 text-muted-foreground">
              {tag}
            </Badge>
          ))}
        </div>
        <button className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
      
      <div>
        <h4 className="text-sm font-semibold text-foreground leading-tight mb-1">{task.title}</h4>
        {task.description && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mb-2">
            {task.description}
          </p>
        )}
        {task.customFields?.clientApproval === 'Pendente' && (
           <span className="text-[10px] text-orange-400 font-medium">Aguardando Cliente</span>
        )}
      </div>
      
      <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-2 border-t border-white/5">
        <div className="flex items-center gap-3">
          {hasChecklist && (
            <div className="flex items-center gap-1" title="Checklist">
              <CheckCircle2 className={`w-3.5 h-3.5 ${completedChecklist === totalChecklist ? 'text-success' : ''}`} />
              <span className="text-[10px]">{completedChecklist}/{totalChecklist}</span>
            </div>
          )}
          {commentCount > 0 && (
            <div className="flex items-center gap-1" title="Comentários">
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="text-[10px]">{commentCount}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <div className={`flex items-center gap-1 text-[10px] font-medium ${new Date(task.dueDate) < new Date() ? 'text-red-400' : ''}`}>
              <Clock className="w-3 h-3" />
              <span>{new Date(task.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
            </div>
          )}
          <Avatar className="h-6 w-6 border border-border">
            <AvatarFallback className="text-[10px] bg-primary/20 text-primary-foreground font-bold">
              {task.assignee}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}
