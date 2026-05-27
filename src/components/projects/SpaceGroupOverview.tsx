import { useMemo } from "react";
import { Space, Project, ProjectTask } from "@/data/mockProjects";
import { TeamMember } from "@/services/teamService";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Folder,
  FolderOpen,
  Hash,
  Layers,
  Users,
  CalendarClock,
} from "lucide-react";

interface SpaceGroupOverviewProps {
  spaceId: string;
  spaceName: string;
  folders: Space[];
  allProjects: Project[];
  allTasks: ProjectTask[];
  members: TeamMember[];
  onFolderSelect: (id: string) => void;
  onProjectSelect: (id: string) => void;
}

export function SpaceGroupOverview({
  spaceId,
  spaceName,
  folders,
  allProjects,
  allTasks,
  members,
  onFolderSelect,
  onProjectSelect,
}: SpaceGroupOverviewProps) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // All project IDs in this space (direct + under folders)
  const folderIds = new Set(folders.map((f) => f.id));
  const spaceProjectIds = useMemo(
    () =>
      new Set(
        allProjects
          .filter((p) => p.spaceId === spaceId || folderIds.has(p.spaceId))
          .map((p) => p.id),
      ),
    [allProjects, spaceId, folders],
  );

  const spaceTasks = useMemo(
    () => allTasks.filter((t) => spaceProjectIds.has(t.projectId)),
    [allTasks, spaceProjectIds],
  );

  const activeTasks = useMemo(
    () => spaceTasks.filter((t) => t.status !== "done" && t.status !== "approved"),
    [spaceTasks],
  );

  const overdueTasks = useMemo(
    () =>
      activeTasks
        .filter((t) => t.dueDate && new Date(t.dueDate) < now)
        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()),
    [activeTasks],
  );

  // Stats per folder
  const folderStats = useMemo(() => {
    return folders.map((folder) => {
      const fProjects = allProjects.filter((p) => p.spaceId === folder.id);
      const fProjectIds = new Set(fProjects.map((p) => p.id));
      const fTasks = allTasks.filter((t) => fProjectIds.has(t.projectId));
      const fActive = fTasks.filter((t) => t.status !== "done" && t.status !== "approved");
      const fOverdue = fActive.filter((t) => t.dueDate && new Date(t.dueDate) < now);
      const fDone = fTasks.filter((t) => t.status === "done" || t.status === "approved");
      return {
        folder,
        projectCount: fProjects.length,
        taskCount: fTasks.length,
        activeCount: fActive.length,
        overdueCount: fOverdue.length,
        doneCount: fDone.length,
        completionPct: fTasks.length > 0 ? Math.round((fDone.length / fTasks.length) * 100) : 0,
      };
    });
  }, [folders, allProjects, allTasks]);

  // Direct projects (under root space, not inside any folder)
  const directProjects = useMemo(
    () => allProjects.filter((p) => p.spaceId === spaceId),
    [allProjects, spaceId],
  );

  const totalProjects = allProjects.filter(
    (p) => p.spaceId === spaceId || folderIds.has(p.spaceId),
  ).length;

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-8 pt-8 pb-6 border-b border-white/5 bg-black/10">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{spaceName}</h1>
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Folder className="w-3 h-3" />
                {folders.length} {folders.length === 1 ? "pasta" : "pastas"}
              </span>
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3" />
                {totalProjects} {totalProjects === 1 ? "lista" : "listas"}
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {spaceTasks.length} {spaceTasks.length === 1 ? "tarefa" : "tarefas"}
              </span>
              {overdueTasks.length > 0 && (
                <span className="flex items-center gap-1 text-red-400">
                  <AlertTriangle className="w-3 h-3" />
                  {overdueTasks.length} atrasada{overdueTasks.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-8">
        {/* ── Folder cards ─────────────────────────────────────────────────── */}
        {folders.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider text-[11px]">
              <Folder className="w-3.5 h-3.5" />
              Pastas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {folderStats.map(
                ({
                  folder,
                  projectCount,
                  taskCount,
                  activeCount,
                  overdueCount,
                  completionPct,
                }) => (
                  <button
                    key={folder.id}
                    onClick={() => onFolderSelect(folder.id)}
                    className="glass-card border border-white/10 hover:border-primary/30 rounded-xl p-5 text-left transition-all group hover:bg-primary/5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm shrink-0">
                        📁
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
                    <h3 className="text-sm font-semibold mb-1 group-hover:text-primary transition-colors truncate">
                      {folder.name}
                    </h3>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {projectCount} {projectCount === 1 ? "lista" : "listas"}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {taskCount} tarefas
                      </span>
                    </div>
                    {taskCount > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground">{activeCount} ativas</span>
                          <span className="text-muted-foreground">{completionPct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              overdueCount > 0 ? "bg-orange-400" : "bg-primary",
                            )}
                            style={{ width: `${completionPct}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-3 text-[10px] text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Abrir pasta</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </button>
                ),
              )}
            </div>
          </section>
        )}

        {/* ── Direct lists under this space (no folder) ────────────────────── */}
        {directProjects.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider text-[11px]">
              <Hash className="w-3.5 h-3.5" />
              Listas diretas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {directProjects.map((p) => {
                const ptasks = allTasks.filter((t) => t.projectId === p.id);
                const pOverdue = ptasks.filter(
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
                    className="glass-card border border-white/10 hover:border-primary/30 rounded-xl p-4 text-left transition-all group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Hash className="w-3.5 h-3.5 text-primary/50 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors">
                          {p.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {ptasks.length} tarefa{ptasks.length !== 1 ? "s" : ""}
                          {pOverdue.length > 0 && (
                            <span className="text-red-400 ml-1.5">
                              · {pOverdue.length} atrasada{pOverdue.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground shrink-0 transition-colors" />
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Two-column bottom grid ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overdue tasks */}
          <section className="glass-card border border-white/10 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-red-400" />
              Tarefas atrasadas neste espaço
              {overdueTasks.length > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] text-red-400 border-red-400/30 bg-red-400/10 ml-auto"
                >
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
              <div className="space-y-2 max-h-[260px] overflow-y-auto no-scrollbar">
                {overdueTasks.slice(0, 8).map((task) => {
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
                        <p className="text-[10px] text-muted-foreground">
                          {task.assignee || "Sem responsável"}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[9px] shrink-0 border-red-400/20 text-red-400 bg-red-400/5"
                      >
                        {daysLate}d
                      </Badge>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Pasta comparison bars */}
          <section className="glass-card border border-white/10 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Tarefas por pasta
            </h2>
            {folderStats.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-6">
                Nenhuma pasta criada.
              </p>
            ) : (
              <div className="space-y-3">
                {folderStats
                  .filter((s) => s.taskCount > 0)
                  .sort((a, b) => b.taskCount - a.taskCount)
                  .map((s) => {
                    const maxTasks = Math.max(...folderStats.map((f) => f.taskCount), 1);
                    const barPct = Math.round((s.taskCount / maxTasks) * 100);
                    return (
                      <button
                        key={s.folder.id}
                        onClick={() => onFolderSelect(s.folder.id)}
                        className="w-full space-y-1 text-left group"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium truncate max-w-[160px] group-hover:text-primary transition-colors">
                            {s.folder.name}
                          </span>
                          <span className="text-muted-foreground text-[10px]">
                            {s.taskCount} tarefa{s.taskCount !== 1 ? "s" : ""}
                            {s.overdueCount > 0 && (
                              <span className="text-red-400 ml-1">· {s.overdueCount} atras.</span>
                            )}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              s.overdueCount > 0 ? "bg-orange-400/70" : "bg-primary/60",
                            )}
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                {folderStats.every((s) => s.taskCount === 0) && (
                  <p className="text-xs text-muted-foreground italic text-center py-4">
                    Nenhuma tarefa nas pastas.
                  </p>
                )}
              </div>
            )}

            {/* Members with tasks in this space */}
            {activeTasks.length > 0 && (
              <div className="pt-4 border-t border-white/5">
                <h3 className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Users className="w-3 h-3" /> Responsáveis ativos
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Array.from(
                    new Set(activeTasks.map((t) => t.assignee).filter(Boolean)),
                  )
                    .slice(0, 8)
                    .map((name) => {
                      const count = activeTasks.filter((t) => t.assignee === name).length;
                      return (
                        <div
                          key={name}
                          className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-2 py-0.5"
                        >
                          <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                            {name!.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                            {name}
                          </span>
                          <span className="text-[9px] text-muted-foreground/60">{count}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Empty state */}
        {folders.length === 0 && directProjects.length === 0 && (
          <div className="glass-card border border-dashed border-white/10 rounded-xl p-12 text-center">
            <FolderOpen className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Este espaço está vazio.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Use o menu lateral para criar pastas e listas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
