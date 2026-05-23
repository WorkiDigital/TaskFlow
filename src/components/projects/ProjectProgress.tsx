import { ProjectTask } from "@/data/mockProjects";
import { Progress } from "@/components/ui/progress";

interface ProjectProgressProps {
  tasks: ProjectTask[];
}

export function ProjectProgress({ tasks }: ProjectProgressProps) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const inProgressTasks = tasks.filter((t) => t.status !== "done" && t.status !== "backlog").length;

  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="glass-card p-4 rounded-xl flex-1 flex flex-col justify-center">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-muted-foreground">Progresso do Projeto</h4>
        <span className="text-sm font-bold text-success">{progress}%</span>
      </div>
      <Progress value={progress} className="h-2 mb-3 bg-white/5" />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{totalTasks} tarefas totais</span>
        <span>{completedTasks} concluídas</span>
        <span>{inProgressTasks} em andamento</span>
      </div>
    </div>
  );
}
