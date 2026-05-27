import { useMemo } from "react";
import { Space, Project, ProjectTask } from "@/data/mockProjects";
import { TeamMember } from "@/services/teamService";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Users,
  FolderOpen,
  TrendingUp,
  CalendarClock,
  ChevronRight,
} from "lucide-react";

interface WorkspaceOverviewProps {
  workspaceName: string;
  spaces: Space[];
  projects: Project[];
  members: TeamMember[];
  allTasks: ProjectTask[];
  onSpaceSelect: (id: string) => void;
  onProjectSelect: (id: string) => void;
}

const priorityWeight: Record<string, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function WorkspaceOverview({
  workspaceName,
  spaces,
  projects,
  members,
  allTasks,
  onSpaceSelect,
  onProjectSelect,
}: WorkspaceOverviewProps) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const activeTasks = useMemo(
    () => allTasks.filter((t) => t.status !== "done" && t.status !== "approved"),
    [allTasks],
  );

  const overdueTasks = useMemo(
    () =>
      activeTasks
        .filter((t) => t.dueDate && new Date(t.dueDate) < now)
        .sort(
          (a, b) =>
            new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime(),
        ),
    [activeTasks],
  );

  const atRiskProjects = useMemo(() => {
    return projects.filter((p) => {
      const projectTasks = allTasks.filter((t) => t.projectId === p.id);
      const hasOverdue = projectTasks.some(
        (t) =>
          t.dueDate &&
          new Date(t.dueDate) < now &&
          t.status !== "done" &&
          t.status !== "approved",
      );
      return hasOverdue;
    });
  }, [projects, allTasks]);

  const completedToday = useMemo(
    () =>
      allTasks.filter((t) => {
        if (t.status !== "done" && t.status !== "approved") return false;
        // We don't have completed_at in ProjectTask so we use a heuristic
        return true;
      }).length,
    [allTasks],
  );

  // Task distribution per member
  const tasksByMember = useMemo(() => {
    const map: Record<string, { name: string; total: number; overdue: number }> = {};
    for (const task of activeTasks) {
      if (!task.assignee) continue;
      if (!map[task.assignee]) {
        map[task.assignee] = { name: task.assignee, total: 0, overdue: 0 };
      }
      map[task.assignee].total++;
      if (task.dueDate && new Date(task.dueDate) < now) {
        map[task.assignee].overdue++;
      }
    }
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 6);
  }, [activeTasks]);

  // Stats per space
  const spaceStats = useMemo(() => {
    return spaces.map((space) => {
      const spaceProjects = projects.filter((p) => p.spaceId === space.id);
      const spaceProjectIds = new Set(spaceProjects.map((p) => p.id));
      const spaceTasks = allTasks.filter((t) => spaceProjectIds.has(t.projectId));
      const spaceOverdue = spaceTasks.filter(
        (t) =>
          t.dueDate &&
          new Date(t.dueDate) < now &&
          t.status !== "done" &&
          t.status !== "approved",
      );
      return {
        space,
        projectCount: spaceProjects.length,
        taskCount: spaceTasks.length,
        overdueCount: spaceOverdue.length,
      };
    });
  }, [spaces, projects, allTasks]);

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-8 pt-8 pb-6 border-b border-white/5 bg-black/10">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{workspaceName}</h1>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5" />
                {spaces.length} {spaces.length === 1 ? "espaço" : "espaços"}
              </span>
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                {projects.length} {projects.length === 1 ? "lista" : "listas"}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {members.length} {members.length === 1 ? "membro" : "membros"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-8">
        {/* ── Metric cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={<CheckCircle2 className="w-4 h-4 text-green-400" />}
            label="Tarefas ativas"
            value={activeTasks.length}
            sub={`${allTasks.length} total`}
            color="green"
          />
          <MetricCard
            icon={<AlertTriangle className="w-4 h-4 text-red-400" />}
            label="Atrasadas"
            value={overdueTasks.length}
            sub={overdueTasks.length > 0 ? "Atenção necessária" : "Tudo em dia"}
            color={overdueTasks.length > 0 ? "red" : "green"}
          />
          <MetricCard
            icon={<TrendingUp className="w-4 h-4 text-orange-400" />}
            label="Projetos em risco"
            value={atRiskProjects.length}
            sub={`de ${projects.length} listas`}
            color={atRiskProjects.length > 0 ? "orange" : "green"}
          />
          <MetricCard
            icon={<Users className="w-4 h-4 text-primary" />}
            label="Membros ativos"
            value={tasksByMember.length}
            sub={`${members.length} total`}
            color="blue"
          />
        </div>

        {/* ── Main grid ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overdue tasks */}
          <section className="glass-card border border-white/10 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-red-400" />
              Tarefas atrasadas
              {overdueTasks.length > 0 && (
                <Badge variant="outline" className="text-[10px] text-red-400 border-red-400/30 bg-red-400/10 ml-auto">
                  {overdueTasks.length}
                </Badge>
              )}
            </h2>
            {overdueTasks.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-8 h-8 text-green-400/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Nenhuma tarefa atrasada.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto no-scrollbar">
                {overdueTasks.slice(0, 10).map((task) => {
                  const daysLate = Math.floor(
                    (now.getTime() - new Date(task.dueDate!).getTime()) / 86400000,
                  );
                  return (
                    <button
                      key={task.id}
                      onClick={() => onProjectSelect(task.projectId)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-white/3 hover:bg-white/5 border border-white/5 hover:border-white/10 transition-all text-left group"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{task.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {task.assignee || "Sem responsável"} ·{" "}
                          {new Date(task.dueDate!).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[9px] shrink-0 border-red-400/20 text-red-400 bg-red-400/5"
                      >
                        {daysLate}d
                      </Badge>
                      <ChevronRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Team workload */}
          <section className="glass-card border border-white/10 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Carga por membro
            </h2>
            {tasksByMember.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-6">
                Nenhuma tarefa atribuída.
              </p>
            ) : (
              <div className="space-y-3">
                {tasksByMember.map((item) => {
                  const pct = activeTasks.length > 0
                    ? Math.round((item.total / activeTasks.length) * 100)
                    : 0;
                  return (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-5 h-5">
                            <AvatarFallback className="text-[9px] bg-primary/20">
                              {item.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">{item.name}</span>
                          {item.overdue > 0 && (
                            <Badge
                              variant="outline"
                              className="text-[9px] border-red-400/20 text-red-400 bg-red-400/5 px-1"
                            >
                              {item.overdue} atras.
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {item.total} tarefa{item.total !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            item.overdue > 0 ? "bg-orange-400" : "bg-primary",
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* ── Spaces grid ──────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-muted-foreground" />
            Espaços
          </h2>
          {spaces.length === 0 ? (
            <div className="glass-card border border-dashed border-white/10 rounded-xl p-10 text-center">
              <FolderOpen className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum espaço criado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {spaceStats.map(({ space, projectCount, taskCount, overdueCount }) => (
                <button
                  key={space.id}
                  onClick={() => onSpaceSelect(space.id)}
                  className="glass-card border border-white/10 hover:border-primary/30 rounded-xl p-5 text-left transition-all group hover:bg-primary/5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 bg-primary/10">
                      <span>📁</span>
                    </div>
                    {overdueCount > 0 && (
                      <Badge
                        variant="outline"
                        className="text-[9px] border-red-400/20 text-red-400 bg-red-400/5"
                      >
                        {overdueCount} atras.
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold mb-1 group-hover:text-primary transition-colors">
                    {space.name}
                  </h3>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {projectCount} {projectCount === 1 ? "lista" : "listas"}
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {taskCount} {taskCount === 1 ? "tarefa" : "tarefas"}
                    </span>
                  </div>
                  {taskCount > 0 && (
                    <div className="mt-3 h-1 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/60"
                        style={{
                          width: `${Math.round(
                            ((taskCount - overdueCount) / taskCount) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── At-risk projects ─────────────────────────────────────────────── */}
        {atRiskProjects.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-400" />
              Listas em risco
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {atRiskProjects.map((p) => {
                const ptasks = allTasks.filter((t) => t.projectId === p.id);
                const overdue = ptasks.filter(
                  (t) =>
                    t.dueDate &&
                    new Date(t.dueDate) < now &&
                    t.status !== "done" &&
                    t.status !== "approved",
                );
                return (
                  <button
                    key={p.id}
                    onClick={() => onProjectSelect(p.id)}
                    className="glass-card border border-orange-400/20 rounded-xl p-4 text-left hover:border-orange-400/40 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold truncate flex-1">{p.name}</p>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground shrink-0" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-2">{p.clientName}</p>
                    <Badge
                      variant="outline"
                      className="text-[9px] border-orange-400/30 text-orange-400 bg-orange-400/5"
                    >
                      {overdue.length} tarefa{overdue.length !== 1 ? "s" : ""} atrasada{overdue.length !== 1 ? "s" : ""}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ── MetricCard ────────────────────────────────────────────────────────────────

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
  color: "green" | "red" | "orange" | "blue";
}

const colorMap: Record<string, string> = {
  green: "border-green-500/20 bg-green-500/5",
  red: "border-red-500/20 bg-red-500/5",
  orange: "border-orange-500/20 bg-orange-500/5",
  blue: "border-primary/20 bg-primary/5",
};

function MetricCard({ icon, label, value, sub, color }: MetricCardProps) {
  return (
    <div
      className={cn(
        "glass-card border rounded-xl p-5 space-y-2",
        colorMap[color] ?? "border-white/10",
      )}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-3xl font-bold tabular-nums">{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}
