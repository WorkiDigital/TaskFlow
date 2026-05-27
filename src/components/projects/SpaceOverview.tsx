import { useState, useEffect, useRef } from "react";
import {
  Folder,
  Plus,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  PlayCircle,
  AlertTriangle,
  Activity,
  FileText,
  Search,
  Trash2,
  User,
  Kanban,
  CheckSquare,
  ChevronRight,
  BarChart2,
  ListTodo,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  getSpaceOverview,
  getSpaceTasks,
  getSpaceActivities,
  getSpaceTimeSummary,
  getSpaceFiles,
  createProject,
  updateProjectTask,
  type DbProjectColumn,
} from "@/services/projectsService";
import { Space, ProjectTask, TaskStatus, TaskPriority } from "@/data/mockProjects";
import { TeamMember } from "@/services/teamService";

interface SpaceOverviewProps {
  spaceId: string;
  spaceColumns: DbProjectColumn[];
  members: TeamMember[];
  onTaskClick: (task: ProjectTask) => void;
  onAddProject: (spaceId: string, name: string) => Promise<void>;
  onRefreshSidebar: () => void;
}

type TabType = "overview" | "tasks" | "board" | "activities" | "time" | "files";

export function SpaceOverview({
  spaceId,
  spaceColumns,
  members,
  onTaskClick,
  onAddProject,
  onRefreshSidebar,
}: SpaceOverviewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [loading, setLoading] = useState(true);
  const [newListDialogOpen, setNewListDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [creatingList, setCreatingList] = useState(false);
  const newListInputRef = useRef<HTMLInputElement>(null);

  // Data states
  const [overviewData, setOverviewData] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [timeLogs, setTimeLogs] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);

  // Filter/Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");

  const loadSpaceData = async () => {
    setLoading(true);
    try {
      // Carrega primeiro a visão geral essencial (space + métricas principais)
      const overview = await getSpaceOverview(spaceId);
      setOverviewData(overview);

      // Carrega os outros conjuntos de dados de forma assíncrona e isolada para máxima resiliência visual.
      // Desta forma, se qualquer consulta de tempo, atividades ou arquivos falhar ou retornar erro no banco,
      // a tela principal da Central da Pasta continuará carregando com sucesso!
      getSpaceTasks(spaceId)
        .then((res) => setTasks(res))
        .catch((err) => console.error("Erro ao carregar tarefas da pasta:", err));

      getSpaceActivities(spaceId)
        .then((res) => setActivities(res))
        .catch((err) => console.error("Erro ao carregar atividades da pasta:", err));

      getSpaceTimeSummary(spaceId)
        .then((res) => setTimeLogs(res))
        .catch((err) => console.error("Erro ao carregar logs de tempo da pasta:", err));

      getSpaceFiles(spaceId)
        .then((res) => setFiles(res))
        .catch((err) => console.error("Erro ao carregar arquivos da pasta:", err));
    } catch (e) {
      console.error("[SpaceOverview] Erro fatal ao carregar Central da Pasta:", e);
      toast.error("Erro ao carregar os dados principais da Central da Pasta.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpaceData();
  }, [spaceId]);

  const handleCreateList = () => {
    setNewListName("");
    setNewListDialogOpen(true);
    setTimeout(() => newListInputRef.current?.focus(), 50);
  };

  const handleCreateListConfirm = async () => {
    if (!newListName.trim()) return;
    setCreatingList(true);
    try {
      await onAddProject(spaceId, newListName.trim());
      await loadSpaceData();
      onRefreshSidebar();
      setNewListDialogOpen(false);
    } catch (e) {
      toast.error("Erro ao criar lista.");
    } finally {
      setCreatingList(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateProjectTask(taskId, { status: newStatus });
      toast.success("Status atualizado com sucesso!");
      // reload data locally
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
      loadSpaceData(); // update stats
    } catch (e) {
      toast.error("Erro ao atualizar status da tarefa.");
    }
  };

  if (loading || !overviewData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
        <Folder className="w-12 h-12 text-primary/30 animate-bounce mb-3" />
        <p className="text-sm animate-pulse font-medium">Carregando a Central da Pasta...</p>
      </div>
    );
  }

  const { space, projects, metrics } = overviewData;

  // Format active timer or total duration
  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  // Filter tasks for render
  const filteredTasks = tasks.filter((t) => {
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (projectFilter !== "all" && t.project_id !== projectFilter) return false;
    return true;
  });

  // Map to local mock type for compatibility with task detail drawer
  const mapToProjectTask = (dbTask: any): ProjectTask => {
    const member = members.find((m) => m.id === dbTask.assignee_id);
    return {
      id: dbTask.id,
      projectId: dbTask.project_id,
      columnId: dbTask.column_id ?? "col-1",
      status: (dbTask.status ?? "backlog") as TaskStatus,
      title: dbTask.title,
      description: dbTask.description ?? "",
      assignee: member?.full_name ?? member?.email ?? "Sem responsável",
      dueDate: dbTask.due_date ?? "",
      priority: (dbTask.priority ?? "medium") as TaskPriority,
      checklist: (dbTask.project_task_checklists ?? []).map((c: any) => ({
        id: c.id,
        title: c.title,
        done: c.is_done ?? false,
      })),
      comments: [],
      activity: [],
      tags: [],
    };
  };

  // Status mapping for color indicators
  const statusConfig: Record<TaskStatus, { label: string; color: string; bg: string }> = {
    backlog: { label: "Backlog", color: "text-slate-400 border-slate-500", bg: "bg-slate-500/10" },
    todo: { label: "A Fazer", color: "text-blue-400 border-blue-500", bg: "bg-blue-500/10" },
    in_progress: {
      label: "Em Progresso",
      color: "text-amber-400 border-amber-500",
      bg: "bg-amber-500/10",
    },
    review: {
      label: "Em Revisão",
      color: "text-purple-400 border-purple-500",
      bg: "bg-purple-500/10",
    },
    waiting: { label: "Aguardando", color: "text-rose-400 border-rose-500", bg: "bg-rose-500/10" },
    approved: {
      label: "Aprovado",
      color: "text-emerald-400 border-emerald-500",
      bg: "bg-emerald-500/10",
    },
    done: { label: "Finalizado", color: "text-teal-400 border-teal-500", bg: "bg-teal-500/10" },
  };

  return (
    <>
    <div className="flex-1 flex flex-col min-w-0 bg-[var(--color-background)] overflow-hidden">
      {/* ─── HEADER DA PASTA ─── */}
      <div className="bg-black/20 shrink-0 border-b border-white/5">
        <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg text-white font-bold",
                space.color || "bg-blue-500",
              )}
            >
              <Folder className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-wider uppercase font-semibold text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full">
                  Central da Pasta
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-foreground tracking-tight flex items-center gap-1.5 mt-0.5">
                {space.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Button Nova Lista (Touch target >= 44px) */}
            <Button
              onClick={handleCreateList}
              className="h-11 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Lista</span>
            </Button>
          </div>
        </div>

        {/* ─── CARDS DE RESUMO ─── */}
        <div className="px-6 pb-6 grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <div className="glass-card bg-white/[0.02] border border-white/5 rounded-xl p-3.5 flex flex-col justify-between group hover:border-white/10 transition-all">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Tarefas</span>
              <Layers className="w-4 h-4 text-muted-foreground/60" />
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-foreground leading-none">
                {metrics.totalTasks}
              </span>
              <span className="text-[10px] text-muted-foreground/70">itens</span>
            </div>
          </div>

          <div className="glass-card bg-white/[0.02] border border-white/5 rounded-xl p-3.5 flex flex-col justify-between group hover:border-amber-500/20 hover:bg-amber-500/[0.01] transition-all">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Em Progresso
              </span>
              <PlayCircle className="w-4 h-4 text-amber-500/60" />
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-amber-400 leading-none">
                {metrics.inProgressTasks}
              </span>
              <span className="text-[10px] text-muted-foreground/70">ativas</span>
            </div>
          </div>

          <div className="glass-card bg-white/[0.02] border border-white/5 rounded-xl p-3.5 flex flex-col justify-between group hover:border-red-500/20 hover:bg-red-500/[0.01] transition-all">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                Atrasadas
              </span>
              <AlertTriangle className="w-4 h-4 text-red-500/60" />
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-red-400 leading-none">
                {metrics.overdueTasks}
              </span>
              <span className="text-[10px] text-muted-foreground/70">alertas</span>
            </div>
          </div>

          <div className="glass-card bg-white/[0.02] border border-white/5 rounded-xl p-3.5 flex flex-col justify-between group hover:border-teal-500/20 hover:bg-teal-500/[0.01] transition-all">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                Concluídas
              </span>
              <CheckCircle2 className="w-4 h-4 text-teal-500/60" />
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-teal-400 leading-none">
                {metrics.completedTasks}
              </span>
              <span className="text-[10px] text-muted-foreground/70">concluídas</span>
            </div>
          </div>

          <div className="glass-card bg-white/[0.02] border border-white/5 rounded-xl p-3.5 flex flex-col justify-between group hover:border-primary/20 hover:bg-primary/[0.01] transition-all col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Tempo Logado
              </span>
              <Clock className="w-4 h-4 text-primary/60" />
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-primary leading-none">
                {formatDuration(metrics.totalTimeSeconds)}
              </span>
              <span className="text-[10px] text-muted-foreground/70">registrado</span>
            </div>
          </div>
        </div>

        {/* ─── ABAS (Scroll Horizontal no Mobile) ─── */}
        <div className="px-6 flex items-center overflow-x-auto border-t border-white/5 scrollbar-thin">
          <div className="flex gap-6 py-1">
            {(
              [
                { id: "overview", label: "Visão Geral", icon: BarChart2 },
                { id: "tasks", label: "Todas as Tarefas", icon: ListTodo },
                { id: "board", label: "Quadro", icon: Kanban },
                { id: "activities", label: "Atividades", icon: Activity },
                { id: "time", label: "Tempo", icon: Clock },
                { id: "files", label: "Arquivos", icon: FileText },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 pb-3 pt-2 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap px-1 outline-none",
                    isActive
                      ? "border-primary text-primary font-bold shadow-sm"
                      : "border-transparent text-muted-foreground hover:text-slate-200",
                  )}
                  style={{ minHeight: "44px" }} // Touch Target
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── CONTEÚDO DAS ABAS ─── */}
      <div className="flex-1 overflow-hidden flex bg-gradient-to-br from-background to-black/40 relative">
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
          {/* 1. VISÃO GERAL */}
          {activeTab === "overview" && (
            <div className="space-y-6 max-w-4xl">
              <div className="glass-card bg-black/10 border border-white/5 p-5 rounded-2xl">
                <h3 className="text-sm font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-primary" /> Descrição da Pasta
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {space.description ||
                    "Nenhuma descrição fornecida para esta pasta. Você pode editar os detalhes para adicionar instruções ou metas para a equipe."}
                </p>
              </div>

              {/* Lists (Listas dentro desta pasta) */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Listas Operacionais nesta Pasta ({projects.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {projects.map((project: any) => {
                    const projectTasks = tasks.filter((t) => t.project_id === project.id);
                    const doneTasks = projectTasks.filter((t) => t.status === "done");
                    const progress =
                      projectTasks.length > 0
                        ? Math.round((doneTasks.length / projectTasks.length) * 100)
                        : 0;

                    return (
                      <div
                        key={project.id}
                        className="glass-card bg-white/[0.01] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                              {project.name}
                            </h4>
                            <span
                              className={cn(
                                "text-[9px] uppercase px-2 py-0.5 rounded-full font-bold",
                                project.status === "active"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : project.status === "paused"
                                    ? "bg-amber-500/10 text-amber-400"
                                    : "bg-blue-500/10 text-blue-400",
                              )}
                            >
                              {project.status === "active"
                                ? "Ativo"
                                : project.status === "paused"
                                  ? "Pausado"
                                  : "Planejamento"}
                            </span>
                          </div>

                          <div className="mt-4 flex justify-between text-[11px] text-muted-foreground">
                            <span>Progresso Geral</span>
                            <span className="font-semibold text-primary">{progress}%</span>
                          </div>

                          <div className="mt-1.5 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="mt-5 flex items-center justify-between text-[10px] text-muted-foreground border-t border-white/5 pt-3">
                          <span>{projectTasks.length} tarefas associadas</span>
                          <span className="flex items-center gap-0.5 text-primary group-hover:translate-x-1 transition-transform">
                            Ver Lista <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {projects.length === 0 && (
                    <div className="col-span-full border border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                      <Folder className="w-8 h-8 text-muted-foreground/30 mb-2" />
                      <p className="text-xs font-semibold text-foreground">
                        Nenhuma lista operacional cadastrada
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 max-w-[280px] mt-1">
                        Crie sua primeira lista para adicionar e estruturar tarefas dentro desta
                        pasta.
                      </p>
                      <Button
                        onClick={handleCreateList}
                        variant="outline"
                        size="sm"
                        className="border-white/10 text-xs h-8 mt-3"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Criar Primeira Lista
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. TODAS AS TAREFAS (Tabela com scroll horizontal no mobile) */}
          {activeTab === "tasks" && (
            <div className="space-y-4">
              {/* Barra de Ações Rápidas */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filtrar tarefas pelo nome..."
                    className="h-10 pl-9 bg-white/5 border-none text-xs text-foreground focus-visible:ring-1"
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-white/5 border-none outline-none focus:ring-1 focus:ring-primary rounded-lg text-[11px] font-semibold text-slate-200 px-3 h-10 select-style cursor-pointer shrink-0"
                  >
                    <option value="all">Todos Status</option>
                    <option value="backlog">Backlog</option>
                    <option value="todo">A Fazer</option>
                    <option value="in_progress">Em Progresso</option>
                    <option value="review">Em Revisão</option>
                    <option value="waiting">Aguardando</option>
                    <option value="approved">Aprovado</option>
                    <option value="done">Finalizado</option>
                  </select>

                  <select
                    value={projectFilter}
                    onChange={(e) => setProjectFilter(e.target.value)}
                    className="bg-white/5 border-none outline-none focus:ring-1 focus:ring-primary rounded-lg text-[11px] font-semibold text-slate-200 px-3 h-10 select-style cursor-pointer max-w-[140px] truncate shrink-0"
                  >
                    <option value="all">Todas Listas</option>
                    {projects.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tabela Responsiva */}
              <div className="overflow-x-auto w-full glass-card border border-white/5 rounded-2xl scrollbar-thin">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full divide-y divide-white/5 text-left text-xs">
                    <thead className="bg-white/[0.02] text-muted-foreground uppercase font-bold text-[10px] tracking-wider">
                      <tr>
                        <th className="px-5 py-3">Tarefa</th>
                        <th className="px-5 py-3">Lista</th>
                        <th className="px-5 py-3">Responsável</th>
                        <th className="px-5 py-3">Prazo</th>
                        <th className="px-5 py-3 text-center">Prioridade</th>
                        <th className="px-5 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredTasks.map((t) => {
                        const mappedTask = mapToProjectTask(t);
                        const statusObj = statusConfig[mappedTask.status] || {
                          label: t.status,
                          color: "text-slate-200",
                          bg: "bg-slate-200/10",
                        };

                        return (
                          <tr
                            key={t.id}
                            onClick={() => onTaskClick(mappedTask)}
                            className="hover:bg-white/[0.01] transition-colors cursor-pointer"
                          >
                            <td className="px-5 py-3.5 font-semibold text-foreground max-w-[200px] truncate">
                              {t.title}
                            </td>
                            <td className="px-5 py-3.5 text-muted-foreground font-medium">
                              {t.projectName || "Sem lista"}
                            </td>
                            <td className="px-5 py-3.5 text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold uppercase text-primary shrink-0">
                                  {mappedTask.assignee.substring(0, 2)}
                                </div>
                                <span className="truncate max-w-[100px]">
                                  {mappedTask.assignee}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-muted-foreground font-medium">
                              {t.due_date ? new Date(t.due_date).toLocaleDateString("pt-BR") : "—"}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <span
                                className={cn(
                                  "text-[9px] px-2 py-0.5 rounded font-bold uppercase",
                                  t.priority === "urgent"
                                    ? "bg-red-500/10 text-red-400"
                                    : t.priority === "high"
                                      ? "bg-orange-500/10 text-orange-400"
                                      : t.priority === "medium"
                                        ? "bg-blue-500/10 text-blue-400"
                                        : "bg-slate-500/10 text-slate-400",
                                )}
                              >
                                {t.priority || "medium"}
                              </span>
                            </td>
                            <td
                              className="px-5 py-3.5 text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <select
                                value={t.status}
                                onChange={(e) =>
                                  handleStatusChange(t.id, e.target.value as TaskStatus)
                                }
                                className={cn(
                                  "bg-black/30 border-none outline-none focus:ring-1 focus:ring-primary rounded-lg text-[10px] font-bold px-2.5 py-1 text-slate-200 select-style cursor-pointer shrink-0",
                                  statusObj.color,
                                )}
                              >
                                <option value="backlog">Backlog</option>
                                <option value="todo">A Fazer</option>
                                <option value="in_progress">Em Progresso</option>
                                <option value="review">Em Revisão</option>
                                <option value="waiting">Aguardando</option>
                                <option value="approved">Aprovado</option>
                                <option value="done">Finalizado</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredTasks.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="text-center py-10 text-muted-foreground italic"
                          >
                            Nenhuma tarefa encontrada correspondente aos filtros ativos.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. QUADRO (KANBAN CONSOLIDADO) */}
          {activeTab === "board" && (
            <div className="h-full flex flex-col gap-4 overflow-hidden">
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin flex-1 min-h-[500px]">
                {spaceColumns.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center text-muted-foreground/40 italic text-xs">
                    Nenhuma coluna configurada nesta pasta.
                  </div>
                ) : (
                  spaceColumns.map((column) => {
                    const columnTasks = tasks.filter((t) => t.column_id === column.id);
                    return (
                      <div
                        key={column.id}
                        className="w-72 shrink-0 bg-white/[0.01] border border-white/5 rounded-2xl flex flex-col h-full max-h-[600px] overflow-hidden"
                      >
                        {/* Header da coluna */}
                        <div className="p-4 bg-white/[0.02] border-b border-white/5 flex items-center justify-between shrink-0">
                          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full inline-block"
                              style={{ backgroundColor: column.color ?? "#6b7280" }}
                            />
                            {column.icon} {column.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-semibold bg-white/5 px-2 py-0.5 rounded-full">
                            {columnTasks.length}
                          </span>
                        </div>

                        {/* Lista de cards */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-none">
                          {columnTasks.map((t) => {
                            const mapped = mapToProjectTask(t);
                            return (
                              <div
                                key={t.id}
                                onClick={() => onTaskClick(mapped)}
                                className="glass-card bg-black/20 p-3.5 border border-white/5 rounded-xl hover:border-white/15 hover:bg-white/[0.01] transition-all cursor-pointer space-y-3 group"
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <h5 className="text-xs font-semibold text-slate-200 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                                    {t.title}
                                  </h5>
                                </div>

                                <div className="flex items-center justify-between text-[9px] text-muted-foreground pt-1 border-t border-white/[0.03]">
                                  <span
                                    className="font-semibold text-primary truncate max-w-[120px]"
                                    title={t.projectName}
                                  >
                                    {t.projectName || "Geral"}
                                  </span>

                                  <div className="flex items-center gap-1">
                                    {t.due_date && (
                                      <span className="flex items-center gap-0.5 mr-1 font-medium text-muted-foreground/80">
                                        <Calendar className="w-3 h-3 text-muted-foreground/60" />
                                        {new Date(t.due_date).toLocaleDateString("pt-BR", {
                                          day: "2-digit",
                                          month: "2-digit",
                                        })}
                                      </span>
                                    )}
                                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-extrabold text-primary uppercase shrink-0">
                                      {mapped.assignee.substring(0, 2)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {columnTasks.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground/40 italic text-[10px]">
                              Vazio
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* 4. ATIVIDADES */}
          {activeTab === "activities" && (
            <div className="glass-card bg-black/20 p-6 border border-white/5 rounded-2xl max-w-2xl">
              <h3 className="font-bold text-xs text-foreground uppercase tracking-wider mb-5 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-primary animate-pulse" /> Linha do Tempo
                Consolidada
              </h3>

              <div className="relative before:absolute before:inset-0 before:left-3 before:-translate-x-px before:h-full before:w-0.5 before:bg-white/5 space-y-6">
                {activities.map((act) => (
                  <div key={act.id} className="relative pl-8 flex gap-3 text-xs">
                    {/* Timpoint Dot */}
                    <div className="absolute left-1.5 w-3.5 h-3.5 -translate-x-1/2 rounded-full bg-slate-900 border-2 border-primary flex items-center justify-center shadow shrink-0" />

                    <div className="flex flex-col gap-1">
                      <p className="text-slate-200 leading-tight">
                        <span className="font-extrabold text-primary mr-1.5">
                          {(act.metadata as any)?.user ?? "Usuário"}
                        </span>
                        <span className="text-muted-foreground mr-1.5">
                          {(act.metadata as any)?.action ?? act.type}
                        </span>
                        <span className="font-bold text-foreground">
                          "{(act.metadata as any)?.target ?? act.message}"
                        </span>
                      </p>
                      <span className="text-[9px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-muted-foreground/60" />
                        {new Date(act.created_at).toLocaleString("pt-BR")}
                      </span>
                    </div>
                  </div>
                ))}
                {activities.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-center pl-0">
                    <p className="text-xs text-muted-foreground italic">
                      Nenhuma atividade registrada na pasta.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. TEMPO (Logs de Tempo Consolidados com estado vazio premium) */}
          {activeTab === "time" && (
            <div className="space-y-6">
              {timeLogs.length > 0 ? (
                <div className="overflow-x-auto w-full glass-card border border-white/5 rounded-2xl scrollbar-thin max-w-4xl">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full divide-y divide-white/5 text-left text-xs">
                      <thead className="bg-white/[0.02] text-muted-foreground uppercase font-bold text-[10px] tracking-wider">
                        <tr>
                          <th className="px-5 py-3">Profissional</th>
                          <th className="px-5 py-3">Tarefa</th>
                          <th className="px-5 py-3">Lista</th>
                          <th className="px-5 py-3">Nota</th>
                          <th className="px-5 py-3">Data</th>
                          <th className="px-5 py-3 text-right">Duração</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {timeLogs.map((log) => {
                          const userName =
                            log.users?.full_name ?? log.users?.email ?? "Profissional";
                          return (
                            <tr key={log.id} className="hover:bg-white/[0.005] transition-colors">
                              <td className="px-5 py-3.5 text-foreground font-semibold flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold uppercase text-primary shrink-0">
                                  {userName.substring(0, 2)}
                                </div>
                                <span className="truncate max-w-[120px]">{userName}</span>
                              </td>
                              <td className="px-5 py-3.5 text-slate-200 font-medium max-w-[150px] truncate">
                                {log.task?.title || "Tarefa deletada"}
                              </td>
                              <td className="px-5 py-3.5 text-muted-foreground font-medium">
                                {log.project?.name || "Sem lista"}
                              </td>
                              <td className="px-5 py-3.5 text-muted-foreground max-w-[180px] truncate">
                                {log.note || (
                                  <span className="text-[10px] text-muted-foreground/45 italic">
                                    Sem nota
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-3.5 text-muted-foreground">
                                {new Date(log.created_at).toLocaleDateString("pt-BR")}
                              </td>
                              <td className="px-5 py-3.5 text-right font-extrabold text-primary">
                                {formatDuration(log.duration_seconds)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* ESTADO VAZIO PREMIUM COM CTA */
                <div className="max-w-md mx-auto border border-white/5 bg-black/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-2xl mt-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-inner">
                    <Clock className="w-7 h-7 text-primary animate-pulse" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">
                    Acompanhamento de Tempo inativo
                  </h4>
                  <p className="text-xs text-muted-foreground/80 leading-relaxed max-w-sm mt-2">
                    Esta pasta ainda não possui nenhum registro de tempo de foco ou horas manuais.
                    Inicie timers em tarefas individuais ou lance registros manuais de tempo nas
                    tarefas para gerenciar sua eficiência operacional.
                  </p>

                  <div className="mt-6 flex flex-col w-full gap-2.5">
                    <Button
                      onClick={() => setActiveTab("tasks")}
                      className="h-11 bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ListTodo className="w-4 h-4" />
                      Ir para Todas as Tarefas
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 6. ARQUIVOS (Logs de Arquivos Consolidados com estado vazio) */}
          {activeTab === "files" && (
            <div className="space-y-6">
              {files.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
                  {files.map((file) => {
                    const ext = file.name.split(".").pop() ?? "file";

                    return (
                      <div
                        key={file.id}
                        className="glass-card bg-black/10 p-4 border border-white/5 rounded-xl flex items-center justify-between gap-3 hover:border-white/10 transition-all group"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div
                            className={cn(
                              "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold uppercase",
                              ["png", "jpg", "jpeg", "svg"].includes(ext.toLowerCase())
                                ? "bg-emerald-500/10 text-emerald-400"
                                : ext.toLowerCase() === "pdf"
                                  ? "bg-red-500/10 text-red-400"
                                  : ext.toLowerCase() === "figma"
                                    ? "bg-purple-500/10 text-purple-400"
                                    : "bg-blue-500/10 text-blue-400",
                            )}
                          >
                            {ext.substring(0, 4)}
                          </div>

                          <div className="overflow-hidden">
                            <p
                              className="text-xs font-semibold text-foreground truncate"
                              title={file.name}
                            >
                              {file.name}
                            </p>
                            <p className="text-[9px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <span>{file.size || "—"}</span>
                              <span>·</span>
                              <span className="truncate max-w-[80px] font-medium text-primary">
                                {file.project?.name}
                              </span>
                            </p>
                          </div>
                        </div>

                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/5 rounded transition-all shrink-0 cursor-pointer"
                        >
                          <ArrowUpRight className="w-4 h-4 text-primary" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* ESTADO VAZIO PREMIUM */
                <div className="max-w-md mx-auto border border-white/5 bg-black/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-2xl mt-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
                    <FileText className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">Nenhum arquivo na pasta</h4>
                  <p className="text-xs text-muted-foreground/80 leading-relaxed max-w-sm mt-2">
                    Não existem documentos, briefings, imagens ou PDFs carregados nas listas desta
                    pasta. Use a seção de Arquivos de cada projeto/lista individual para anexar os
                    recursos necessários.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>

    <Dialog open={newListDialogOpen} onOpenChange={setNewListDialogOpen}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nova Lista</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="new-list-name">Nome da lista</Label>
          <Input
            id="new-list-name"
            ref={newListInputRef}
            placeholder="Ex: Sprint 01, Website, Campanha..."
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void handleCreateListConfirm(); }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setNewListDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={() => void handleCreateListConfirm()} disabled={!newListName.trim() || creatingList}>
            {creatingList ? "Criando..." : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
