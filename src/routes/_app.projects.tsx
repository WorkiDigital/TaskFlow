import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { KanbanBoard } from "@/components/projects/KanbanBoard";
import {
  ProjectTask,
  Project,
  Space,
  ProjectDoc,
  ProjectFile,
  ProjectActivity,
  TaskStatus,
  TaskPriority,
  ProjectStatus,
  mockProjectColumns,
} from "@/data/mockProjects";
import { ProjectSidebar } from "@/components/projects/ProjectSidebar";
import { SpaceOverview } from "@/components/projects/SpaceOverview";
import { ProjectViewTabs, ProjectViewType } from "@/components/projects/ProjectViewTabs";
import { TaskFiltersBar } from "@/components/projects/TaskFiltersBar";
import { AIScopeGenerator } from "@/components/projects/AIScopeGenerator";
import { ListView } from "@/components/projects/ListView";
import { CalendarView } from "@/components/projects/CalendarView";
import { TaskDetailsDrawer } from "@/components/projects/TaskDetailsDrawer";
import { CreateTaskModal } from "@/components/projects/CreateTaskModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, X, Trash2, Plus, Clock, Folder, FolderSync } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PromptDialog, ConfirmDialog } from "@/components/projects/CustomDialog";
import { teamService, TeamMember } from "@/services/teamService";
import {
  getProjectSpaces,
  getProjects,
  createProject,
  updateProject,
  createProjectSpace,
  deleteProjectSpace,
  deleteProject as deleteProjectDb,
  updateProjectSpace,
  updateProjectTask,
  getProjectDocs,
  createProjectDoc,
  updateProjectDoc,
  deleteProjectDoc,
  getProjectFiles,
  createProjectFile,
  deleteProjectFile,
  getProjectActivities,
  createProjectActivity,
  deleteProjectTask,
  createProjectTask,
  createProjectColumn,
  updateProjectColumn,
  deleteProjectColumn,
  seedDefaultColumns,
  type DbProjectColumn,
} from "@/services/projectsService";

// ── DB → local type mappers ────────────────────────────────────────────────
function mapDbToSpace(row: any): Space {
  return { id: row.id, name: row.name, color: row.color ?? "bg-blue-500" };
}

function mapDbToProject(row: any): Project {
  return {
    id: row.id,
    spaceId: row.space_id ?? "",
    name: row.name,
    clientName: row.description ?? "",
    status: (row.status ?? "planning") as ProjectStatus,
    progress: 0,
    startDate: row.created_at?.split("T")[0] ?? "",
    dueDate: "",
    members: [],
    templateOrigin: row.template_id ? "Template" : undefined,
  };
}

function mapDbToTask(row: any, membersList: TeamMember[]): ProjectTask {
  const member = membersList.find((m) => m.id === row.assignee_id);
  const taskStatus = (row.status ?? "backlog") as TaskStatus;
  return {
    id: row.id,
    projectId: row.project_id,
    columnId: row.column_id ?? "",
    status: taskStatus,
    title: row.title,
    description: row.description ?? "",
    assignee: member?.full_name ?? member?.email ?? "",
    dueDate: row.due_date ?? "",
    priority: (row.priority ?? "medium") as TaskPriority,
    checklist: (row.project_task_checklists ?? []).map((c: any) => ({
      id: c.id,
      title: c.title,
      done: c.is_done ?? false,
    })),
    comments: [],
    activity: [],
    tags: [],
  };
}

import { useWorkspace } from "@/contexts/WorkspaceContext";

export const Route = createFileRoute("/_app/projects")({
  component: ProjectsWorkspace,
});

function ProjectsWorkspace() {
  const { activeWorkspaceId, switchWorkspace } = useWorkspace();
  const [members, setMembers] = useState<TeamMember[]>([]);

  const [spacesList, setSpacesList] = useState<Space[]>([]);
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<"space" | "project">("project");
  const [loadingData, setLoadingData] = useState(true);

  const [activeView, setActiveView] = useState<ProjectViewType>("board");
  const [searchQuery, setSearchQuery] = useState("");

  // New filters state
  const [statusFilter, setStatusFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"title" | "dueDate" | "priority" | "none">("none");

  const [allTasks, setAllTasks] = useState<ProjectTask[]>([]);
  // columns per project: { [projectId]: DbProjectColumn[] }
  const [projectColumns, setProjectColumns] = useState<Record<string, DbProjectColumn[]>>({});

  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isAiPanelOpen, setAiPanelOpen] = useState(false);

  // Task creation state
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [createTaskDefaultStatus, setCreateTaskDefaultStatus] = useState<TaskStatus>("backlog");
  const [createTaskDefaultDueDate, setCreateTaskDefaultDueDate] = useState<string>("");

  // Docs, Files, and Activities states
  const [docsList, setDocsList] = useState<ProjectDoc[]>([]);
  const [filesList, setFilesList] = useState<ProjectFile[]>([]);
  const [activitiesList, setActivitiesList] = useState<ProjectActivity[]>([]);

  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const docSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Inline creation states for onboarding
  const [inlineSpaceName, setInlineSpaceName] = useState("");
  const [inlineProjectName, setInlineProjectName] = useState("");

  // Dialog state hooks for workspace main panel
  const [isPromptOpen, setPromptOpen] = useState(false);
  const [promptConfig, setPromptConfig] = useState<{
    title: string;
    description: string;
    placeholder: string;
    onConfirm: (val: string) => void;
  }>({ title: "", description: "", placeholder: "", onConfirm: () => {} });

  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  }>({ title: "", description: "", onConfirm: () => {} });

  const loadAll = async (cancelled?: { value: boolean }) => {
    setLoadingData(true);
    const [membersRes, spacesRes, projectsRes] = await Promise.allSettled([
      teamService.getAgencyMembers(),
      getProjectSpaces(),
      getProjects(),
    ]);

    if (cancelled?.value) return;

    const loadedMembers = membersRes.status === "fulfilled" ? membersRes.value : [];
    setMembers(loadedMembers);

    if (spacesRes.status === "fulfilled") {
      setSpacesList(spacesRes.value.map(mapDbToSpace));
    } else {
      console.error("[Projects] Erro ao carregar pastas:", spacesRes.reason);
    }

    if (projectsRes.status === "fulfilled") {
      const projects = projectsRes.value;
      const mappedProjects = projects.map(mapDbToProject);
      setProjectsList(mappedProjects);

      // Build columns map per project; seed defaults if none exist
      const colMap: Record<string, DbProjectColumn[]> = {};
      await Promise.all(
        projects.map(async (p: any) => {
          let cols: DbProjectColumn[] = (p.project_columns ?? []) as DbProjectColumn[];
          if (cols.length === 0) {
            try { cols = await seedDefaultColumns(p.id); } catch { /* ignore */ }
          }
          colMap[p.id] = cols.sort((a, b) => a.position - b.position);
        }),
      );
      setProjectColumns(colMap);

      // Map tasks — columnId comes from DB column_id now
      const allDbTasks = projects.flatMap((p: any) =>
        (p.project_tasks ?? []).map((t: any) => {
          const task = mapDbToTask(t, loadedMembers);
          // If column_id is missing, assign to first column of the project
          if (!task.columnId && colMap[p.id]?.[0]) {
            task.columnId = colMap[p.id][0].id;
          }
          return task;
        }),
      );
      setAllTasks(allDbTasks);
      setActiveProjectId((prev) => {
        if (prev && mappedProjects.some(p => p.id === prev)) return prev;
        return mappedProjects[0]?.id ?? null;
      });
    } else {
      console.error("[Projects] Erro ao carregar listas:", projectsRes.reason);
    }

    setLoadingData(false);
  };

  // Load members + spaces + projects
  useEffect(() => {
    const guard = { value: false };

    if (!activeWorkspaceId) {
      setProjectsList([]);
      setSpacesList([]);
      setAllTasks([]);
      setLoadingData(false);
      return;
    }

    loadAll(guard);

    return () => {
      guard.value = true;
    };
  }, [activeWorkspaceId]);

  // Load docs, files and activities whenever the active project changes
  useEffect(() => {
    if (!activeProjectId) {
      setDocsList([]);
      setFilesList([]);
      setActivitiesList([]);
      setSelectedDocId(null);
      return;
    }
    Promise.allSettled([
      getProjectDocs(activeProjectId),
      getProjectFiles(activeProjectId),
      getProjectActivities(activeProjectId),
    ])
      .then(([docsRes, filesRes, activitiesRes]) => {
        if (docsRes.status === "fulfilled") {
          setDocsList(
            docsRes.value.map((d: any) => ({
              id: d.id,
              projectId: d.project_id,
              title: d.title,
              content: d.content ?? "",
              updatedAt: d.updated_at ?? d.created_at,
            })),
          );
          setSelectedDocId((prev) => prev ?? docsRes.value[0]?.id ?? null);
        }
        if (filesRes.status === "fulfilled") {
          setFilesList(
            filesRes.value.map((f: any) => ({
              id: f.id,
              projectId: f.project_id,
              name: f.name,
              size: f.size ?? "—",
              type: f.name.split(".").pop() ?? "file",
              uploadedAt: f.created_at,
            })),
          );
        }
        if (activitiesRes.status === "fulfilled") {
          setActivitiesList(
            activitiesRes.value.map((a: any) => ({
              id: a.id,
              projectId: a.project_id,
              user: (a.metadata as any)?.user ?? "Sistema",
              action: (a.metadata as any)?.action ?? a.type,
              target: (a.metadata as any)?.target ?? "",
              timestamp: a.created_at,
            })),
          );
        }
      })
      .catch(() => {});
  }, [activeProjectId]);

  const activeProject = projectsList.find((p) => p.id === activeProjectId);

  // Persiste atividade no Supabase e atualiza estado local otimisticamente
  const logActivity = (
    projectId: string,
    user: string,
    action: string,
    target: string,
    type = "general",
  ) => {
    const optimistic: ProjectActivity = {
      id: `act-${Date.now()}`,
      projectId,
      user,
      action,
      target,
      timestamp: new Date().toISOString(),
    };
    setActivitiesList((prev) => [optimistic, ...prev]);
    createProjectActivity({
      project_id: projectId,
      type,
      message: `${user} ${action} ${target}`.trim(),
      metadata: { user, action, target },
    }).catch((e) => console.error("[Projects] Erro ao salvar atividade:", e));
  };

  // Filtered and sorted tasks
  const projectTasks = allTasks
    .filter((t) => {
      if (t.projectId !== activeProjectId) return false;
      if (
        searchQuery &&
        !t.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (assigneeFilter !== "all" && t.assignee !== assigneeFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "dueDate") {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === "priority") {
        const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      return 0;
    });

  // Extract unique assignees from tasks inside active project
  const activeProjectAssignees = Array.from(
    new Set(allTasks.filter((t) => t.projectId === activeProjectId).map((t) => t.assignee)),
  ).filter(Boolean);

  const handleTasksChange = (newTasks: ProjectTask[]) => {
    setAllTasks((prev) => {
      const updated = [...prev];
      newTasks.forEach((nt) => {
        const idx = updated.findIndex((t) => t.id === nt.id);
        if (idx !== -1) {
          if (updated[idx].status !== nt.status) {
            updateProjectTask(nt.id, { status: nt.status }).catch((e) =>
              console.error("[Projects] Erro ao mover tarefa:", e),
            );
          }
          updated[idx] = nt;
        }
      });
      return updated;
    });
  };

  const handleTaskClick = (task: ProjectTask) => {
    setSelectedTask(task);
    setDrawerOpen(true);
  };

  const handleUpdateTask = async (updatedTask: ProjectTask) => {
    const memberByName = members.find((m) => (m.full_name || m.email) === updatedTask.assignee);
    const oldTask = allTasks.find((t) => t.id === updatedTask.id);

    updateProjectTask(updatedTask.id, {
      title: updatedTask.title,
      description: updatedTask.description || undefined,
      status: updatedTask.status,
      priority: updatedTask.priority,
      due_date: updatedTask.dueDate || undefined,
      assignee_id: memberByName?.id,
      column_id: updatedTask.columnId || undefined,
    }).catch((e) => console.error("[Projects] Erro ao salvar tarefa:", e));

    setAllTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));

    // Fire column automations when task moves to a different column
    if (oldTask && updatedTask.columnId && oldTask.columnId !== updatedTask.columnId) {
      fireColumnAutomations(updatedTask.columnId, updatedTask);
    }

    // Auto update selected task for the drawer
    if (selectedTask?.id === updatedTask.id) {
      setSelectedTask(updatedTask);
    }

    if (oldTask && activeProjectId) {
      const changes: string[] = [];
      const statusLabels = {
        backlog: "Backlog",
        todo: "Para fazer",
        in_progress: "Em andamento",
        review: "Em revisão",
        waiting: "Aguardando cliente",
        approved: "Aprovado",
        done: "Finalizado",
      };

      if (oldTask.status !== updatedTask.status) {
        changes.push(`status para "${statusLabels[updatedTask.status] || updatedTask.status}"`);
      }
      if (oldTask.assignee !== updatedTask.assignee) {
        changes.push(`responsável para "${updatedTask.assignee}"`);
      }
      if (oldTask.priority !== updatedTask.priority) {
        changes.push(`prioridade para "${updatedTask.priority}"`);
      }
      if (oldTask.dueDate !== updatedTask.dueDate) {
        changes.push(`prazo para ${updatedTask.dueDate || "sem prazo"}`);
      }

      if (changes.length > 0) {
        logActivity(
          activeProjectId,
          "Você",
          `alterou ${changes.join(", ")} na tarefa`,
          updatedTask.title,
          "task_updated",
        );
      }
    }
  };

  const handleMoveTask = (task: ProjectTask, direction: "next" | "prev") => {
    console.log(`Move task ${task.id} ${direction}`);
  };

  // ── Column automation ──────────────────────────────────────────────────────
  const fireColumnAutomations = (columnId: string, task: ProjectTask) => {
    const cols = activeProjectId ? (projectColumns[activeProjectId] ?? []) : [];
    const col = cols.find((c) => c.id === columnId);
    if (!col?.automation_config) return;

    const { notify_assignee, notify_whatsapp_client, mark_project_done } = col.automation_config;

    if (notify_assignee && task.assignee) {
      toast.info(`${task.assignee} foi notificado sobre "${task.title}".`);
    }
    if (notify_whatsapp_client) {
      toast.success(`WhatsApp enviado ao cliente sobre "${task.title}" → ${col.title}.`);
    }
    if (mark_project_done && activeProjectId) {
      updateProject(activeProjectId, { status: "completed" }).catch(() => {});
      setProjectsList((prev) =>
        prev.map((p) => (p.id === activeProjectId ? { ...p, status: "completed" } : p)),
      );
      toast.success("Projeto marcado como concluído.");
    }
  };

  // ── Column CRUD handlers ───────────────────────────────────────────────────
  const handleAddColumn = async (
    data: Omit<DbProjectColumn, "id" | "project_id" | "agency_id" | "created_at" | "updated_at">,
  ) => {
    if (!activeProjectId) return;
    try {
      const created = await createProjectColumn({
        project_id: activeProjectId,
        title: data.title,
        position: data.position,
        color: data.color ?? undefined,
        icon: data.icon ?? undefined,
        is_final_column: data.is_final_column,
        automation_config: data.automation_config,
      });
      setProjectColumns((prev) => ({
        ...prev,
        [activeProjectId]: [...(prev[activeProjectId] ?? []), created as DbProjectColumn],
      }));
      toast.success("Coluna criada.");
    } catch (e) {
      toast.error("Erro ao criar coluna: " + String(e));
    }
  };

  const handleEditColumn = async (columnId: string, data: Partial<DbProjectColumn>) => {
    if (!activeProjectId) return;
    try {
      const updated = await updateProjectColumn(columnId, data);
      setProjectColumns((prev) => ({
        ...prev,
        [activeProjectId]: (prev[activeProjectId] ?? []).map((c) =>
          c.id === columnId ? (updated as DbProjectColumn) : c,
        ),
      }));
      toast.success("Coluna atualizada.");
    } catch (e) {
      toast.error("Erro ao atualizar coluna: " + String(e));
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!activeProjectId) return;
    const cols = projectColumns[activeProjectId] ?? [];
    if (cols.length <= 1) {
      toast.error("O projeto precisa ter ao menos uma coluna.");
      return;
    }
    try {
      await deleteProjectColumn(columnId);
      setProjectColumns((prev) => ({
        ...prev,
        [activeProjectId]: (prev[activeProjectId] ?? []).filter((c) => c.id !== columnId),
      }));
      toast.success("Coluna excluída.");
    } catch (e) {
      toast.error("Erro ao excluir coluna: " + String(e));
    }
  };

  const handleTaskAction = async (
    action: "edit" | "duplicate" | "change_assignee" | "delete",
    task: ProjectTask,
  ) => {
    if (action === "edit" || action === "change_assignee") {
      handleTaskClick(task);
    } else if (action === "delete") {
      setConfirmConfig({
        title: "Excluir Tarefa",
        description: `Deseja mesmo excluir a tarefa "${task.title}"? Esta ação não pode ser desfeita.`,
        isDestructive: true,
        onConfirm: async () => {
          try {
            await deleteProjectTask(task.id);
            setAllTasks((prev) => prev.filter((t) => t.id !== task.id));
            toast.success("Tarefa excluída.");
          } catch (e) {
            toast.error("Erro ao excluir tarefa: " + (e instanceof Error ? e.message : JSON.stringify(e)));
          }
        },
      });
      setConfirmOpen(true);
    } else if (action === "duplicate") {
      try {
        const memberByName = members.find((m) => (m.full_name || m.email) === task.assignee);
        const created = await createProjectTask({
          project_id: task.projectId,
          title: `${task.title} (Cópia)`,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assignee_id: memberByName?.id,
          due_date: task.dueDate || undefined,
        });
        const mapped = mapDbToTask(created, members);
        setAllTasks((prev) => [...prev, mapped]);
        toast.success("Tarefa duplicada.");
      } catch (e) {
        toast.error("Erro ao duplicar tarefa: " + String(e));
      }
    }
  };

  const handleCreateTask = async (newTask: ProjectTask) => {
    // Adiciona localmente imediatamente para UX responsivo
    setAllTasks((prev) => [newTask, ...prev]);

    // Recarrega tarefas do banco para garantir sincronismo
    try {
      const projects = await getProjects();
      const allDbTasks = projects.flatMap((p: any) =>
        (p.project_tasks ?? []).map((t: any) => mapDbToTask(t, members)),
      );
      setAllTasks(allDbTasks);
    } catch (e) {
      console.error("[Projects] Erro ao recarregar tarefas após criação:", e);
    }

    if (activeProjectId) {
      logActivity(activeProjectId, "Você", "criou a tarefa", newTask.title, "task_created");
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProjectDb(projectId);
      const updated = projectsList.filter((p) => p.id !== projectId);
      setProjectsList(updated);
      setAllTasks((prev) => prev.filter((t) => t.projectId !== projectId));
      if (activeProjectId === projectId) setActiveProjectId(updated[0]?.id || null);
      toast.success("Lista excluída.");
    } catch (e) {
      toast.error("Erro ao excluir lista: " + String(e));
    }
  };

  const handleEditProject = async (projectId: string, newName: string) => {
    try {
      await updateProject(projectId, { name: newName });
      setProjectsList((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, name: newName } : p)),
      );
      toast.success("Nome da lista atualizado.");
    } catch (e) {
      toast.error("Erro ao atualizar lista: " + String(e));
    }
  };

  const handleAddProject = async (spaceId: string, name: string) => {
    try {
      const created = await createProject({ space_id: spaceId, name });
      const newProject = mapDbToProject(created);
      setProjectsList((prev) => [...prev, newProject]);
      setActiveProjectId(newProject.id);
      setActiveViewMode("project");
      toast.success(`Lista "${name}" criada!`);
    } catch (e: any) {
      const msg = e?.message ?? e?.details ?? String(e);
      console.error("[handleAddProject] erro completo:", e);
      toast.error("Erro ao criar lista: " + msg);
    }
  };

  const handleDeleteSpace = async (spaceId: string) => {
    try {
      await deleteProjectSpace(spaceId);
      setSpacesList((prev) => prev.filter((s) => s.id !== spaceId));
      setProjectsList((prev) => {
        const remaining = prev.filter((p) => p.spaceId !== spaceId);
        if (activeProjectId && prev.find((p) => p.id === activeProjectId)?.spaceId === spaceId) {
          setActiveProjectId(remaining[0]?.id || null);
        }
        return remaining;
      });
      toast.success("Pasta excluída.");
    } catch (e) {
      toast.error("Erro ao excluir pasta: " + String(e));
    }
  };

  const handleEditSpace = async (spaceId: string, newName: string) => {
    try {
      await updateProjectSpace(spaceId, newName);
      setSpacesList((prev) => prev.map((s) => (s.id === spaceId ? { ...s, name: newName } : s)));
      toast.success("Nome da pasta atualizado.");
    } catch (e) {
      toast.error("Erro ao atualizar pasta: " + String(e));
    }
  };

  const handleAddSpace = async (name: string) => {
    const colors = [
      "bg-pink-500",
      "bg-blue-500",
      "bg-purple-500",
      "bg-orange-500",
      "bg-emerald-500",
      "bg-red-500",
      "bg-yellow-500",
      "bg-cyan-500",
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    try {
      const created = await createProjectSpace(name, randomColor);
      setSpacesList((prev) => [...prev, mapDbToSpace(created)]);
      toast.success(`Pasta "${name}" criada!`);
    } catch (e) {
      toast.error("Erro ao criar pasta: " + String(e));
    }
  };

  // Open task creator modal (global trigger)
  const handleOpenGlobalCreateTask = () => {
    setCreateTaskDefaultStatus("backlog");
    setCreateTaskDefaultDueDate("");
    setCreateModalOpen(true);
  };

  // --- Docs Tab Interactions ---
  const projectDocs = docsList.filter((d) => d.projectId === activeProjectId);
  const activeDoc = projectDocs.find((d) => d.id === selectedDocId) || projectDocs[0];

  const handleCreateDoc = async () => {
    if (!activeProjectId) return;
    try {
      const created = await createProjectDoc(
        activeProjectId,
        "Documento sem título",
        "# Novo Documento\n\nComece a digitar aqui...",
      );
      const newDoc: ProjectDoc = {
        id: created.id,
        projectId: created.project_id,
        title: created.title,
        content: created.content ?? "",
        updatedAt: created.updated_at ?? created.created_at,
      };
      setDocsList((prev) => [newDoc, ...prev]);
      setSelectedDocId(newDoc.id);
      logActivity(activeProjectId, "Você", "criou o documento", newDoc.title, "doc_created");
      toast.success("Documento criado!");
    } catch (e) {
      toast.error("Erro ao criar documento: " + String(e));
    }
  };

  const handleUpdateDocContent = (content: string) => {
    if (!activeDoc) return;
    // Optimistic update
    setDocsList((prev) =>
      prev.map((d) =>
        d.id === activeDoc.id ? { ...d, content, updatedAt: new Date().toISOString() } : d,
      ),
    );
    // Debounced save — only write to DB after 800ms of inactivity
    if (docSaveTimer.current) clearTimeout(docSaveTimer.current);
    docSaveTimer.current = setTimeout(() => {
      updateProjectDoc(activeDoc.id, { content }).catch((e) =>
        console.error("[Projects] Erro ao salvar doc:", e),
      );
    }, 800);
  };

  const handleUpdateDocTitle = (title: string) => {
    if (!activeDoc) return;
    setDocsList((prev) =>
      prev.map((d) =>
        d.id === activeDoc.id ? { ...d, title, updatedAt: new Date().toISOString() } : d,
      ),
    );
    if (docSaveTimer.current) clearTimeout(docSaveTimer.current);
    docSaveTimer.current = setTimeout(() => {
      updateProjectDoc(activeDoc.id, { title }).catch((e) =>
        console.error("[Projects] Erro ao salvar título doc:", e),
      );
    }, 800);
  };

  const handleDeleteDoc = (docId: string, title: string) => {
    setConfirmConfig({
      title: "Excluir Documento",
      description: `Deseja mesmo excluir o documento "${title}"? Esta ação não pode ser desfeita.`,
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteProjectDoc(docId);
          setDocsList((prev) => prev.filter((d) => d.id !== docId));
          if (selectedDocId === docId) setSelectedDocId(null);
          if (activeProjectId) {
            logActivity(activeProjectId, "Você", "excluiu o documento", title, "doc_deleted");
          }
          toast.success("Documento excluído.");
        } catch (e) {
          toast.error("Erro ao excluir documento: " + String(e));
        }
      },
    });
    setConfirmOpen(true);
  };

  // --- Files Tab Interactions ---
  const projectFiles = filesList.filter((f) => f.projectId === activeProjectId);

  const handleUploadSimulatedFile = () => {
    if (!activeProjectId) return;
    setPromptConfig({
      title: "Importar Arquivo",
      description: "Digite o nome do arquivo a ser importado (ex: briefing.pdf, mockup.png...)",
      placeholder: "mockup_campanha.png",
      onConfirm: async (fileName) => {
        const fileExtension = fileName.split(".").pop() ?? "file";
        const randomSize = (Math.random() * 8 + 1).toFixed(1) + " MB";
        try {
          const created = await createProjectFile(
            activeProjectId,
            fileName,
            randomSize,
            `local://${fileName}`,
          );
          const newFile: ProjectFile = {
            id: created.id,
            projectId: created.project_id,
            name: created.name,
            size: created.size ?? randomSize,
            type: fileExtension.toLowerCase(),
            uploadedAt: created.created_at,
          };
          setFilesList((prev) => [newFile, ...prev]);
          logActivity(activeProjectId, "Você", "enviou o arquivo", newFile.name, "file_uploaded");
          toast.success(`Arquivo "${newFile.name}" importado!`);
        } catch (e) {
          toast.error("Erro ao salvar arquivo: " + String(e));
        }
      },
    });
    setPromptOpen(true);
  };

  const handleDeleteFile = (fileId: string, name: string) => {
    setConfirmConfig({
      title: "Excluir Arquivo",
      description: `Deseja mesmo excluir o arquivo "${name}"? Esta ação não pode ser desfeita.`,
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteProjectFile(fileId);
          setFilesList((prev) => prev.filter((f) => f.id !== fileId));
          if (activeProjectId) {
            logActivity(activeProjectId, "Você", "excluiu o arquivo", name, "file_deleted");
          }
          toast.success("Arquivo removido.");
        } catch (e) {
          toast.error("Erro ao excluir arquivo: " + String(e));
        }
      },
    });
    setConfirmOpen(true);
  };

  // Dynamic values for progress calculation
  const totalProjectTasks = allTasks.filter((t) => t.projectId === activeProjectId);
  const doneProjectTasks = totalProjectTasks.filter((t) => t.status === "done");
  const percentComplete =
    totalProjectTasks.length > 0
      ? Math.round((doneProjectTasks.length / totalProjectTasks.length) * 100)
      : 0;
  const overdueProjectTasks = totalProjectTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done",
  );

  if (!activeWorkspaceId) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-[var(--color-background)]">
        <Folder className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold text-foreground">Nenhum workspace selecionado</h2>
        <p className="text-muted-foreground text-center max-w-md mt-2 mb-6">
          Você precisa criar ou selecionar um workspace para gerenciar projetos, pastas e tarefas.
        </p>
        <Button onClick={() => document.dispatchEvent(new CustomEvent("open-create-workspace"))}>
          <Plus className="w-4 h-4 mr-2" />
          Criar Workspace
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-[var(--color-background)] overflow-hidden">
      {/* Sidebar (ClickUp Style) */}
      <ProjectSidebar
        spaces={spacesList}
        projects={projectsList}
        activeProjectId={activeProjectId}
        activeSpaceId={activeSpaceId}
        activeViewMode={activeViewMode}
        onProjectSelect={(id) => {
          setActiveProjectId(id);
          setActiveViewMode("project");
          setSelectedDocId(null); // Reset docs tab state when switching projects
        }}
        onSpaceSelect={(id) => {
          setActiveSpaceId(id);
          setActiveViewMode("space");
        }}
        onDeleteProject={handleDeleteProject}
        onEditProject={handleEditProject}
        onAddProject={handleAddProject}
        onDeleteSpace={handleDeleteSpace}
        onEditSpace={handleEditSpace}
        onAddSpace={handleAddSpace}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeViewMode === "space" && activeSpaceId ? (
          <SpaceOverview
            spaceId={activeSpaceId}
            members={members}
            onTaskClick={handleTaskClick}
            onAddProject={async (spaceId, name) => {
              await handleAddProject(spaceId, name);
            }}
            onRefreshSidebar={async () => {
              const [spacesRes, projectsRes] = await Promise.allSettled([
                getProjectSpaces(),
                getProjects(),
              ]);
              if (spacesRes.status === "fulfilled") {
                setSpacesList(spacesRes.value.map(mapDbToSpace));
              }
              if (projectsRes.status === "fulfilled") {
                setProjectsList(projectsRes.value.map(mapDbToProject));
              }
            }}
          />
        ) : activeProject ? (
          <>
            {/* Header / Tabs */}
            <div className="bg-black/20 shrink-0">
              <div className="px-6 pt-4 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold tracking-tight">{activeProject.name}</h2>
                  <span className="text-xs font-normal text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full mt-1">
                    {activeProject.clientName}
                  </span>
                  {activeProject.templateOrigin && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full mt-1">
                      <FolderSync className="w-3 h-3 text-primary animate-pulse" />
                      Template: {activeProject.templateOrigin}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    onClick={handleOpenGlobalCreateTask}
                    className="h-8 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Nova Tarefa</span>
                  </Button>
                  <AIScopeGenerator
                    projectId={activeProject.id}
                    onApplyTasks={async (tasks) => {
                      setLoadingData(true);
                      try {
                        const newDbTasks: ReturnType<typeof mapDbToTask>[] = [];
                        for (const t of tasks) {
                          const created = await createProjectTask({
                            project_id: t.projectId,
                            title: t.title,
                            description: t.description,
                            status: t.status,
                            priority: t.priority,
                            due_date: t.dueDate,
                            source: "ai",
                          });
                          newDbTasks.push(mapDbToTask(created, members));
                        }
                        setAllTasks((p) => [...p, ...newDbTasks]);
                      } catch (err) {
                        toast.error("Erro ao salvar tarefas: " + (err as Error).message);
                      } finally {
                        setLoadingData(false);
                      }
                    }}
                  />
                  <Button
                    variant={isAiPanelOpen ? "secondary" : "ghost"}
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => setAiPanelOpen(!isAiPanelOpen)}
                    title="Resumo IA"
                  >
                    <Sparkles className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Progress Summary */}
              <div className="px-6 pb-3">
                <div className="flex items-center text-[11px] text-muted-foreground mb-1.5 gap-2">
                  <span className="font-semibold text-primary">{percentComplete}% concluído</span>
                  <span>·</span>
                  <span>{totalProjectTasks.length} tarefas</span>
                  <span>·</span>
                  <span>{doneProjectTasks.length} finalizadas</span>
                  {overdueProjectTasks.length > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-red-400 font-medium">
                        {overdueProjectTasks.length} atrasadas
                      </span>
                    </>
                  )}
                  {activeProject.dueDate && (
                    <>
                      <span>·</span>
                      <span>
                        Prazo:{" "}
                        {new Date(activeProject.dueDate).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                    </>
                  )}
                </div>
                <div className="h-1.5 w-full max-w-md bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                    style={{ width: `${percentComplete}%` }}
                  />
                </div>
              </div>

              <div className="border-t border-white/5">
                <ProjectViewTabs activeView={activeView} onViewChange={setActiveView} />
              </div>
            </div>

            {/* Filters Bar */}
            <TaskFiltersBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              assigneeFilter={assigneeFilter}
              onAssigneeFilterChange={setAssigneeFilter}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              assignees={activeProjectAssignees}
            />

            {/* View Content */}
            <div className="flex-1 overflow-hidden flex bg-gradient-to-br from-background to-black/40">
              <div className="flex-1 overflow-auto p-6 min-w-0">
                {activeView === "board" && (
                  <div className="h-full flex gap-6">
                    <div className="flex-1 overflow-hidden">
                      <KanbanBoard
                        columns={activeProjectId ? (projectColumns[activeProjectId] ?? []) : []}
                        tasks={projectTasks}
                        onTasksChange={handleTasksChange}
                        onTaskClick={handleTaskClick}
                        onTaskAction={handleTaskAction}
                        onAddTask={(columnId) => {
                          const cols = activeProjectId ? (projectColumns[activeProjectId] ?? []) : [];
                          const col = cols.find((c) => c.id === columnId);
                          setCreateTaskDefaultStatus((col ? "backlog" : "backlog") as TaskStatus);
                          setCreateTaskDefaultDueDate("");
                          setCreateModalOpen(true);
                        }}
                        onAddColumn={handleAddColumn}
                        onEditColumn={handleEditColumn}
                        onDeleteColumn={handleDeleteColumn}
                      />
                    </div>
                  </div>
                )}

                {activeView === "list" && (
                  <div className="h-full overflow-y-auto pr-2 no-scrollbar">
                    <ListView
                      tasks={projectTasks}
                      onTaskClick={handleTaskClick}
                      onTaskAction={handleTaskAction}
                      onAddTask={(status) => {
                        setCreateTaskDefaultStatus(status);
                        setCreateTaskDefaultDueDate("");
                        setCreateModalOpen(true);
                      }}
                    />
                  </div>
                )}

                {activeView === "calendar" && (
                  <div className="h-full overflow-y-auto pr-2 no-scrollbar">
                    <CalendarView
                      tasks={projectTasks}
                      onTaskClick={handleTaskClick}
                      onAddTask={(dateStr) => {
                        setCreateTaskDefaultStatus("todo");
                        setCreateTaskDefaultDueDate(dateStr);
                        setCreateModalOpen(true);
                      }}
                    />
                  </div>
                )}

                {activeView === "docs" && (
                  <div className="flex gap-6 h-full overflow-hidden">
                    {/* Left Panel: Docs list */}
                    <div className="w-64 shrink-0 glass-card bg-black/20 p-4 border border-white/5 rounded-xl flex flex-col gap-3 h-full">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider">
                          Documentos
                        </h3>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-primary hover:bg-white/10"
                          onClick={handleCreateDoc}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <div className="flex-1 overflow-y-auto no-scrollbar space-y-1">
                        {projectDocs.map((doc) => {
                          const isActiveDoc = activeDoc?.id === doc.id;
                          return (
                            <div
                              key={doc.id}
                              onClick={() => setSelectedDocId(doc.id)}
                              className={cn(
                                "group/doc w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all",
                                isActiveDoc
                                  ? "bg-primary/20 text-white font-medium border border-primary/20 shadow-sm"
                                  : "text-muted-foreground hover:bg-white/5 hover:text-slate-200",
                              )}
                            >
                              <span className="truncate flex-1 font-medium">{doc.title}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDoc(doc.id, doc.title);
                                }}
                                className="opacity-0 group-hover/doc:opacity-100 p-0.5 hover:bg-red-500/20 text-muted-foreground hover:text-red-400 rounded transition-all cursor-pointer shrink-0"
                                title="Excluir Documento"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                        {projectDocs.length === 0 && (
                          <div className="text-center py-6">
                            <Folder className="w-6 h-6 mx-auto text-muted-foreground/30 mb-1" />
                            <p className="text-[10px] text-muted-foreground italic">
                              Nenhum documento.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Panel: Active Doc Editor */}
                    <div className="flex-1 glass-card bg-black/20 p-5 border border-white/5 rounded-xl flex flex-col gap-4 h-full overflow-hidden">
                      {activeDoc ? (
                        <>
                          <div className="flex flex-col gap-1 shrink-0">
                            <Input
                              value={activeDoc.title}
                              onChange={(e) => handleUpdateDocTitle(e.target.value)}
                              className="text-base font-semibold bg-transparent border-transparent px-0 h-auto focus-visible:ring-0 text-foreground"
                              placeholder="Sem título"
                            />
                            <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>
                                Última alteração:{" "}
                                {new Date(activeDoc.updatedAt).toLocaleString("pt-BR")}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 overflow-hidden relative">
                            <Textarea
                              value={activeDoc.content}
                              onChange={(e) => handleUpdateDocContent(e.target.value)}
                              className="w-full h-full bg-background/30 border-white/5 focus-visible:ring-1 focus-visible:ring-primary/30 resize-none font-mono text-[12px] leading-relaxed p-4 rounded-lg"
                              placeholder="# Título do Documento\n\nComece a escrever em Markdown..."
                            />
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-center gap-3">
                          <Folder className="w-8 h-8 text-muted-foreground/20" />
                          <div className="space-y-1">
                            <p className="text-xs font-semibold">Nenhum documento selecionado</p>
                            <p className="text-[10px] text-muted-foreground/70 max-w-[200px]">
                              Crie um novo documento ou selecione um existente no painel esquerdo.
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/10 text-xs h-7 mt-1"
                            onClick={handleCreateDoc}
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" /> Criar Documento
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeView === "files" && (
                  <div className="flex-1 flex flex-col gap-6 h-full overflow-hidden">
                    {/* Upload simulated drop zone */}
                    <div
                      onClick={handleUploadSimulatedFile}
                      className="glass-card p-6 flex flex-col items-center justify-center text-muted-foreground border-dashed border-white/10 hover:border-primary/50 hover:bg-white/[0.02] cursor-pointer rounded-xl transition-all duration-300 gap-1 shrink-0 group"
                    >
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform mb-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </div>
                      <p className="text-xs font-semibold text-foreground">
                        Importar ou Anexar Arquivo
                      </p>
                      <p className="text-[10px] text-muted-foreground/70">
                        Clique aqui para simular o upload de um arquivo para o projeto.
                      </p>
                    </div>

                    {/* Files list */}
                    <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projectFiles.map((file) => (
                          <div
                            key={file.id}
                            className="glass-card bg-black/10 p-3.5 border border-white/5 rounded-xl flex items-center justify-between gap-3 hover:border-white/10 transition-all group"
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div
                                className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[9px] font-bold uppercase",
                                  ["png", "jpg", "jpeg", "svg"].includes(file.type)
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : file.type === "pdf"
                                      ? "bg-red-500/10 text-red-400"
                                      : file.type === "figma"
                                        ? "bg-purple-500/10 text-purple-400"
                                        : "bg-blue-500/10 text-blue-400",
                                )}
                              >
                                {file.type.substring(0, 4)}
                              </div>
                              <div className="overflow-hidden">
                                <p
                                  className="text-xs font-semibold text-foreground truncate"
                                  title={file.name}
                                >
                                  {file.name}
                                </p>
                                <p className="text-[9px] text-muted-foreground flex items-center gap-1">
                                  <span>{file.size}</span>
                                  <span>·</span>
                                  <span>
                                    {new Date(file.uploadedAt).toLocaleDateString("pt-BR")}
                                  </span>
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleDeleteFile(file.id, file.name)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 text-muted-foreground hover:text-red-400 rounded transition-all cursor-pointer shrink-0"
                              title="Excluir Arquivo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                      {projectFiles.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <p className="text-xs text-muted-foreground italic">
                            Nenhum arquivo anexado a este projeto.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeView === "activity" && (
                  <div className="glass-card bg-black/20 p-5 border border-white/5 rounded-xl h-full flex flex-col overflow-hidden">
                    <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider mb-4">
                      Linha do Tempo de Atividades
                    </h3>
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-5 relative before:absolute before:inset-0 before:left-3 before:-translate-x-px before:h-full before:w-0.5 before:bg-white/5">
                      {activitiesList
                        .filter((act) => act.projectId === activeProjectId)
                        .map((act) => (
                          <div key={act.id} className="relative pl-8 flex gap-3 text-xs">
                            {/* Circle timeline point */}
                            <div className="absolute left-1.5 w-3.5 h-3.5 -translate-x-1/2 rounded-full bg-slate-900 border-2 border-primary flex items-center justify-center shadow shrink-0" />

                            <div className="flex flex-col gap-1">
                              <p className="text-slate-200 leading-tight">
                                <span className="font-bold text-primary mr-1.5">{act.user}</span>
                                <span className="text-muted-foreground mr-1.5">{act.action}</span>
                                <span className="font-semibold text-foreground">
                                  "{act.target}"
                                </span>
                              </p>
                              <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(act.timestamp).toLocaleString("pt-BR")}
                              </span>
                            </div>
                          </div>
                        ))}
                      {activitiesList.filter((act) => act.projectId === activeProjectId).length ===
                        0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center pl-0">
                          <p className="text-xs text-muted-foreground italic">
                            Nenhuma atividade registrada ainda.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Painel Lateral Direito Resumo IA */}
              {isAiPanelOpen && (
                <div className="w-64 shrink-0 border-l border-white/5 bg-black/10 hidden xl:flex flex-col animate-in slide-in-from-right-8 duration-300">
                  <div className="p-4 border-b border-white/5 font-medium text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-primary" /> Resumo da IA
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6 -mr-2 text-muted-foreground hover:text-foreground"
                      onClick={() => setAiPanelOpen(false)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="p-4 space-y-4 overflow-y-auto no-scrollbar">
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                      <p className="text-xs text-primary-foreground/90 leading-relaxed">
                        O projeto <span className="font-medium">{activeProject.name}</span> está com{" "}
                        <span className="font-bold text-primary">{percentComplete}%</span> de
                        conclusão e{" "}
                        {overdueProjectTasks.length > 0
                          ? `${overdueProjectTasks.length} tarefas atrasadas`
                          : "nenhuma tarefa atrasada"}
                        . O ritmo está excelente!
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        Atividade Recente
                      </h4>
                      {activitiesList
                        .filter((act) => act.projectId === activeProjectId)
                        .slice(0, 3)
                        .map((act) => (
                          <div key={act.id} className="flex gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center text-[9px] uppercase font-bold">
                              {act.user.substring(0, 2)}
                            </div>
                            <div>
                              <p className="text-[11px] text-foreground leading-snug">
                                <span className="font-semibold">{act.user}</span> {act.action}{" "}
                                <span className="font-medium">{act.target}</span>.
                              </p>
                              <p className="text-[9px] text-muted-foreground mt-0.5">
                                {new Date(act.timestamp).toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        ))}
                      {activitiesList.filter((act) => act.projectId === activeProjectId).length ===
                        0 && (
                        <p className="text-[10px] text-muted-foreground italic">
                          Nenhuma atividade recente.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-gradient-to-br from-background to-black/40">
            {spacesList.length === 0 ? (
              <div className="max-w-md w-full glass-card p-8 border border-white/5 rounded-2xl flex flex-col items-center gap-4 shadow-xl">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <Folder className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Bem-vindo ao TaskFlow!</h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                  Crie sua primeira pasta para começar a organizar seus projetos, listas de tarefas,
                  documentos e arquivos de forma integrada.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (inlineSpaceName.trim()) {
                      handleAddSpace(inlineSpaceName.trim());
                      setInlineSpaceName("");
                    }
                  }}
                  className="w-full max-w-xs flex flex-col gap-2 mt-2"
                >
                  <Input
                    value={inlineSpaceName}
                    onChange={(e) => setInlineSpaceName(e.target.value)}
                    placeholder="Nome da pasta (ex: Marketing, Design...)"
                    className="bg-white/5 border-white/10 text-xs h-9 focus-visible:ring-primary/50 text-foreground text-center"
                  />
                  <Button
                    type="submit"
                    disabled={!inlineSpaceName.trim()}
                    className="h-9 bg-primary hover:bg-primary/95 text-primary-foreground font-medium text-xs cursor-pointer w-full"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Criar Pasta
                  </Button>
                </form>
              </div>
            ) : projectsList.length === 0 ? (
              <div className="max-w-md w-full glass-card p-8 border border-white/5 rounded-2xl flex flex-col items-center gap-4 shadow-xl">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <Folder className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Quase lá!</h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                  Você já tem uma pasta. Agora, crie uma lista (projeto) dentro dela para poder
                  gerenciar suas tarefas.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (inlineProjectName.trim() && spacesList.length > 0) {
                      handleAddProject(spacesList[0].id, inlineProjectName.trim());
                      setInlineProjectName("");
                    }
                  }}
                  className="w-full max-w-xs flex flex-col gap-2 mt-2"
                >
                  <Input
                    value={inlineProjectName}
                    onChange={(e) => setInlineProjectName(e.target.value)}
                    placeholder="Nome da lista (ex: Tráfego Ads, Site...)"
                    className="bg-white/5 border-white/10 text-xs h-9 focus-visible:ring-primary/50 text-foreground text-center"
                  />
                  <Button
                    type="submit"
                    disabled={!inlineProjectName.trim()}
                    className="h-9 bg-primary hover:bg-primary/95 text-primary-foreground font-medium text-xs cursor-pointer w-full"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Criar Primeira Lista
                  </Button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Folder className="w-8 h-8 text-muted-foreground/30" />
                <p className="text-sm">Selecione uma lista no menu lateral para começar.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global & Column Task Creator */}
      {activeProjectId && (
        <CreateTaskModal
          open={isCreateModalOpen}
          onOpenChange={setCreateModalOpen}
          projectId={activeProjectId}
          onCreate={handleCreateTask}
          defaultStatus={createTaskDefaultStatus}
          defaultDueDate={createTaskDefaultDueDate}
          members={members}
        />
      )}

      {/* Task Details Sheet */}
      <TaskDetailsDrawer
        task={selectedTask}
        open={isDrawerOpen}
        onOpenChange={setDrawerOpen}
        onUpdate={handleUpdateTask}
        onMove={handleMoveTask}
        members={members}
      />

      {/* Reusable Dialogs for Main Workspace */}
      <PromptDialog
        isOpen={isPromptOpen}
        onOpenChange={setPromptOpen}
        title={promptConfig.title}
        description={promptConfig.description}
        placeholder={promptConfig.placeholder}
        onConfirm={promptConfig.onConfirm}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmConfig.title}
        description={confirmConfig.description}
        isDestructive={confirmConfig.isDestructive}
        onConfirm={confirmConfig.onConfirm}
      />
    </div>
  );
}
