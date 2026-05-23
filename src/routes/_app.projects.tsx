import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { KanbanBoard } from "@/components/projects/KanbanBoard";
import { 
  ProjectTask, 
  Project, 
  Space, 
  ProjectDoc, 
  ProjectFile, 
  ProjectActivity, 
  TaskStatus 
} from "@/data/mockProjects";
import { ProjectSidebar } from "@/components/projects/ProjectSidebar";
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

export const Route = createFileRoute("/_app/projects")({
  component: ProjectsWorkspace,
});

function ProjectsWorkspace() {
  const [spacesList, setSpacesList] = useState<Space[]>(() => {
    try {
      const saved = localStorage.getItem("taskflow_spaces");
      const spaces = saved ? JSON.parse(saved) : [];
      const defaultSpaces = [
        { id: 'sp-1', name: 'Marketing', color: 'bg-pink-500' },
        { id: 'sp-2', name: 'Tráfego Pago', color: 'bg-blue-500' },
        { id: 'sp-3', name: 'Design', color: 'bg-purple-500' },
        { id: 'sp-4', name: 'Lançamentos', color: 'bg-orange-500' }
      ];
      let modified = false;
      const updatedSpaces = [...spaces];
      defaultSpaces.forEach(ds => {
        if (!updatedSpaces.some(s => s.id === ds.id)) {
          updatedSpaces.push(ds);
          modified = true;
        }
      });
      if (modified) {
        localStorage.setItem("taskflow_spaces", JSON.stringify(updatedSpaces));
        return updatedSpaces;
      }
      return spaces;
    } catch (e) {
      return [];
    }
  });

  const [projectsList, setProjectsList] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem("taskflow_projects");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem("taskflow_active_project_id");
      if (saved) return saved;
      const savedProjects = localStorage.getItem("taskflow_projects");
      if (savedProjects) {
        const parsed = JSON.parse(savedProjects);
        return parsed[0]?.id || null;
      }
    } catch (e) {}
    return null;
  });

  const [activeView, setActiveView] = useState<ProjectViewType>('board');
  const [searchQuery, setSearchQuery] = useState("");
  
  // New filters state
  const [statusFilter, setStatusFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"title" | "dueDate" | "priority" | "none">("none");

  const [allTasks, setAllTasks] = useState<ProjectTask[]>(() => {
    try {
      const saved = localStorage.getItem("taskflow_tasks");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isAiPanelOpen, setAiPanelOpen] = useState(false);

  // Task creation state
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [createTaskDefaultStatus, setCreateTaskDefaultStatus] = useState<TaskStatus>("backlog");
  const [createTaskDefaultDueDate, setCreateTaskDefaultDueDate] = useState<string>("");

  // Docs, Files, and Activities states
  const [docsList, setDocsList] = useState<ProjectDoc[]>(() => {
    try {
      const saved = localStorage.getItem("taskflow_docs");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [filesList, setFilesList] = useState<ProjectFile[]>(() => {
    try {
      const saved = localStorage.getItem("taskflow_files");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [activitiesList, setActivitiesList] = useState<ProjectActivity[]>(() => {
    try {
      const saved = localStorage.getItem("taskflow_activities");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

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

  // Synchronizers to localStorage
  useEffect(() => {
    localStorage.setItem("taskflow_spaces", JSON.stringify(spacesList));
  }, [spacesList]);

  useEffect(() => {
    localStorage.setItem("taskflow_projects", JSON.stringify(projectsList));
  }, [projectsList]);

  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem("taskflow_active_project_id", activeProjectId);
    } else {
      localStorage.removeItem("taskflow_active_project_id");
    }
  }, [activeProjectId]);

  useEffect(() => {
    localStorage.setItem("taskflow_tasks", JSON.stringify(allTasks));
  }, [allTasks]);

  useEffect(() => {
    localStorage.setItem("taskflow_docs", JSON.stringify(docsList));
  }, [docsList]);

  useEffect(() => {
    localStorage.setItem("taskflow_files", JSON.stringify(filesList));
  }, [filesList]);

  useEffect(() => {
    localStorage.setItem("taskflow_activities", JSON.stringify(activitiesList));
  }, [activitiesList]);

  const activeProject = projectsList.find(p => p.id === activeProjectId);
  
  // Filtered and sorted tasks
  const projectTasks = allTasks
    .filter(t => {
      if (t.projectId !== activeProjectId) return false;
      if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase()) && !t.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
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
    new Set(allTasks.filter(t => t.projectId === activeProjectId).map(t => t.assignee))
  ).filter(Boolean);

  const handleTasksChange = (newTasks: ProjectTask[]) => {
    setAllTasks(prev => {
      const updated = [...prev];
      newTasks.forEach(nt => {
        const idx = updated.findIndex(t => t.id === nt.id);
        if (idx !== -1) updated[idx] = nt;
      });
      return updated;
    });
  };

  const handleTaskClick = (task: ProjectTask) => {
    setSelectedTask(task);
    setDrawerOpen(true);
  };

  const handleUpdateTask = (updatedTask: ProjectTask) => {
    const oldTask = allTasks.find(t => t.id === updatedTask.id);
    setAllTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    
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
        done: "Finalizado"
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
        const newAct: ProjectActivity = {
          id: `act-${Date.now()}`,
          projectId: activeProjectId,
          user: "Você",
          action: `alterou ${changes.join(", ")} na tarefa`,
          target: updatedTask.title,
          timestamp: new Date().toISOString()
        };
        setActivitiesList(prev => [newAct, ...prev]);
      }
    }
  };

  const handleMoveTask = (task: ProjectTask, direction: "next" | "prev") => {
    console.log(`Move task ${task.id} ${direction}`);
  };

  const handleCreateTask = (newTask: ProjectTask) => {
    setAllTasks(prev => [newTask, ...prev]);
    
    // Add to project timeline
    if (activeProjectId) {
      const newAct: ProjectActivity = {
        id: `act-${Date.now()}`,
        projectId: activeProjectId,
        user: "Você",
        action: "criou a tarefa",
        target: newTask.title,
        timestamp: new Date().toISOString()
      };
      setActivitiesList(prev => [newAct, ...prev]);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    const updated = projectsList.filter(p => p.id !== projectId);
    setProjectsList(updated);
    if (activeProjectId === projectId) {
      setActiveProjectId(updated[0]?.id || null);
    }
    toast.success("Lista excluída.");
  };

  const handleEditProject = (projectId: string, newName: string) => {
    setProjectsList(prev => prev.map(p => p.id === projectId ? { ...p, name: newName } : p));
    toast.success("Nome da lista atualizado.");
  };

  const handleAddProject = (spaceId: string, name: string) => {
    const newProjectId = `p-${Date.now()}`;
    const newProject: Project = {
      id: newProjectId,
      spaceId,
      name,
      clientName: "Cliente Interno",
      status: "planning",
      progress: 0,
      startDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      members: ["MC"]
    };
    setProjectsList(prev => [...prev, newProject]);
    setActiveProjectId(newProjectId);
    toast.success(`Lista "${name}" criada!`);
  };

  const handleDeleteSpace = (spaceId: string) => {
    setSpacesList(prev => prev.filter(s => s.id !== spaceId));
    // Also delete projects belonging to that space
    setProjectsList(prev => {
      const remainingProjects = prev.filter(p => p.spaceId !== spaceId);
      if (activeProjectId && prev.find(p => p.id === activeProjectId)?.spaceId === spaceId) {
        setActiveProjectId(remainingProjects[0]?.id || null);
      }
      return remainingProjects;
    });
    toast.success("Pasta excluída.");
  };

  const handleEditSpace = (spaceId: string, newName: string) => {
    setSpacesList(prev => prev.map(s => s.id === spaceId ? { ...s, name: newName } : s));
    toast.success("Nome da pasta atualizado.");
  };

  const handleAddSpace = (name: string) => {
    const colors = ['bg-pink-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-emerald-500', 'bg-red-500', 'bg-yellow-500', 'bg-cyan-500'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newSpace: Space = {
      id: `sp-${Date.now()}`,
      name,
      color: randomColor
    };
    setSpacesList(prev => [...prev, newSpace]);
    toast.success(`Pasta "${name}" criada!`);
  };

  // Open task creator modal (global trigger)
  const handleOpenGlobalCreateTask = () => {
    setCreateTaskDefaultStatus("backlog");
    setCreateTaskDefaultDueDate("");
    setCreateModalOpen(true);
  };

  // --- Docs Tab Interactions ---
  const projectDocs = docsList.filter(d => d.projectId === activeProjectId);
  const activeDoc = projectDocs.find(d => d.id === selectedDocId) || projectDocs[0];

  const handleCreateDoc = () => {
    if (!activeProjectId) return;
    const newDoc: ProjectDoc = {
      id: `doc-${Date.now()}`,
      projectId: activeProjectId,
      title: "Documento sem título",
      content: "# Novo Documento\n\nComece a digitar aqui...",
      updatedAt: new Date().toISOString()
    };
    setDocsList(prev => [...prev, newDoc]);
    setSelectedDocId(newDoc.id);
    
    // Log activity
    const newAct: ProjectActivity = {
      id: `act-${Date.now()}`,
      projectId: activeProjectId,
      user: "Você",
      action: "criou o documento",
      target: newDoc.title,
      timestamp: new Date().toISOString()
    };
    setActivitiesList(prev => [newAct, ...prev]);
    toast.success("Documento criado!");
  };

  const handleUpdateDocContent = (content: string) => {
    if (!activeDoc) return;
    setDocsList(prev => prev.map(d => d.id === activeDoc.id ? { ...d, content, updatedAt: new Date().toISOString() } : d));
  };

  const handleUpdateDocTitle = (title: string) => {
    if (!activeDoc) return;
    setDocsList(prev => prev.map(d => d.id === activeDoc.id ? { ...d, title, updatedAt: new Date().toISOString() } : d));
  };

  const handleDeleteDoc = (docId: string, title: string) => {
    setConfirmConfig({
      title: "Excluir Documento",
      description: `Deseja mesmo excluir o documento "${title}"? Esta ação não pode ser desfeita.`,
      isDestructive: true,
      onConfirm: () => {
        setDocsList(prev => prev.filter(d => d.id !== docId));
        if (selectedDocId === docId) setSelectedDocId(null);
        
        // Log activity
        if (activeProjectId) {
          const newAct: ProjectActivity = {
            id: `act-${Date.now()}`,
            projectId: activeProjectId,
            user: "Você",
            action: "excluiu o documento",
            target: title,
            timestamp: new Date().toISOString()
          };
          setActivitiesList(prev => [newAct, ...prev]);
        }
        toast.success("Documento excluído.");
      }
    });
    setConfirmOpen(true);
  };

  // --- Files Tab Interactions ---
  const projectFiles = filesList.filter(f => f.projectId === activeProjectId);

  const handleUploadSimulatedFile = () => {
    if (!activeProjectId) return;
    
    setPromptConfig({
      title: "Importar Arquivo",
      description: "Digite o nome do arquivo a ser importado (ex: briefing.pdf, mockup.png...)",
      placeholder: "mockup_campanha.png",
      onConfirm: (fileName) => {
        const fileExtension = fileName.split('.').pop() || 'png';
        const randomSize = (Math.random() * 8 + 1).toFixed(1) + " MB";
        
        const newFile: ProjectFile = {
          id: `file-${Date.now()}`,
          projectId: activeProjectId,
          name: fileName,
          size: randomSize,
          type: fileExtension.toLowerCase(),
          uploadedAt: new Date().toISOString()
        };
        
        setFilesList(prev => [newFile, ...prev]);
        
        // Log activity
        const newAct: ProjectActivity = {
          id: `act-${Date.now()}`,
          projectId: activeProjectId,
          user: "Você",
          action: "enviou o arquivo",
          target: newFile.name,
          timestamp: new Date().toISOString()
        };
        setActivitiesList(prev => [newAct, ...prev]);
        toast.success(`Arquivo "${newFile.name}" importado!`);
      }
    });
    setPromptOpen(true);
  };

  const handleDeleteFile = (fileId: string, name: string) => {
    setConfirmConfig({
      title: "Excluir Arquivo",
      description: `Deseja mesmo excluir o arquivo "${name}"? Esta ação não pode ser desfeita.`,
      isDestructive: true,
      onConfirm: () => {
        setFilesList(prev => prev.filter(f => f.id !== fileId));
        
        // Log activity
        if (activeProjectId) {
          const newAct: ProjectActivity = {
            id: `act-${Date.now()}`,
            projectId: activeProjectId,
            user: "Você",
            action: "excluiu o arquivo",
            target: name,
            timestamp: new Date().toISOString()
          };
          setActivitiesList(prev => [newAct, ...prev]);
        }
        toast.success("Arquivo removido.");
      }
    });
    setConfirmOpen(true);
  };

  // Dynamic values for progress calculation
  const totalProjectTasks = allTasks.filter(t => t.projectId === activeProjectId);
  const doneProjectTasks = totalProjectTasks.filter(t => t.status === 'done');
  const percentComplete = totalProjectTasks.length > 0 ? Math.round((doneProjectTasks.length / totalProjectTasks.length) * 100) : 0;
  const overdueProjectTasks = totalProjectTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done');

  return (
    <div className="flex h-full w-full bg-[var(--color-background)] overflow-hidden">
      {/* Sidebar (ClickUp Style) */}
      <ProjectSidebar 
        spaces={spacesList}
        projects={projectsList}
        activeProjectId={activeProjectId}
        onProjectSelect={(id) => {
          setActiveProjectId(id);
          setSelectedDocId(null); // Reset docs tab state when switching projects
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
        {activeProject ? (
          <>
            {/* Header / Tabs */}
            <div className="bg-black/20 shrink-0">
              <div className="px-6 pt-4 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold tracking-tight">
                    {activeProject.name}
                  </h2>
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
                  <AIScopeGenerator projectId={activeProject.id} onApplyTasks={(t) => setAllTasks(p => [...p, ...t])} />
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
                  <span className="font-semibold text-primary">
                    {percentComplete}% concluído
                  </span>
                  <span>·</span>
                  <span>{totalProjectTasks.length} tarefas</span>
                  <span>·</span>
                  <span>{doneProjectTasks.length} finalizadas</span>
                  {overdueProjectTasks.length > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-red-400 font-medium">{overdueProjectTasks.length} atrasadas</span>
                    </>
                  )}
                  {activeProject.dueDate && (
                    <>
                      <span>·</span>
                      <span>Prazo: {new Date(activeProject.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
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
                {activeView === 'board' && (
                  <div className="h-full flex gap-6">
                    <div className="flex-1 overflow-hidden">
                      <KanbanBoard 
                        tasks={projectTasks} 
                        onTasksChange={handleTasksChange} 
                        onTaskClick={handleTaskClick} 
                        onAddTask={(status) => {
                          setCreateTaskDefaultStatus(status);
                          setCreateTaskDefaultDueDate("");
                          setCreateModalOpen(true);
                        }}
                      />
                    </div>
                  </div>
                )}
              
                {activeView === 'list' && (
                  <div className="h-full overflow-y-auto pr-2 no-scrollbar">
                    <ListView 
                      tasks={projectTasks} 
                      onTaskClick={handleTaskClick} 
                      onAddTask={(status) => {
                        setCreateTaskDefaultStatus(status);
                        setCreateTaskDefaultDueDate("");
                        setCreateModalOpen(true);
                      }}
                    />
                  </div>
                )}

                {activeView === 'calendar' && (
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

                {activeView === 'docs' && (
                  <div className="flex gap-6 h-full overflow-hidden">
                    {/* Left Panel: Docs list */}
                    <div className="w-64 shrink-0 glass-card bg-black/20 p-4 border border-white/5 rounded-xl flex flex-col gap-3 h-full">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider">Documentos</h3>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-primary hover:bg-white/10" onClick={handleCreateDoc}>
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <div className="flex-1 overflow-y-auto no-scrollbar space-y-1">
                        {projectDocs.map(doc => {
                          const isActiveDoc = activeDoc?.id === doc.id;
                          return (
                            <div 
                              key={doc.id}
                              onClick={() => setSelectedDocId(doc.id)}
                              className={cn(
                                "group/doc w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all",
                                isActiveDoc 
                                  ? "bg-primary/20 text-white font-medium border border-primary/20 shadow-sm" 
                                  : "text-muted-foreground hover:bg-white/5 hover:text-slate-200"
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
                            <p className="text-[10px] text-muted-foreground italic">Nenhum documento.</p>
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
                              <span>Última alteração: {new Date(activeDoc.updatedAt).toLocaleString('pt-BR')}</span>
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
                            <p className="text-[10px] text-muted-foreground/70 max-w-[200px]">Crie um novo documento ou selecione um existente no painel esquerdo.</p>
                          </div>
                          <Button size="sm" variant="outline" className="border-white/10 text-xs h-7 mt-1" onClick={handleCreateDoc}>
                            <Plus className="w-3.5 h-3.5 mr-1" /> Criar Documento
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeView === 'files' && (
                  <div className="flex-1 flex flex-col gap-6 h-full overflow-hidden">
                    {/* Upload simulated drop zone */}
                    <div 
                      onClick={handleUploadSimulatedFile}
                      className="glass-card p-6 flex flex-col items-center justify-center text-muted-foreground border-dashed border-white/10 hover:border-primary/50 hover:bg-white/[0.02] cursor-pointer rounded-xl transition-all duration-300 gap-1 shrink-0 group"
                    >
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      </div>
                      <p className="text-xs font-semibold text-foreground">Importar ou Anexar Arquivo</p>
                      <p className="text-[10px] text-muted-foreground/70">Clique aqui para simular o upload de um arquivo para o projeto.</p>
                    </div>

                    {/* Files list */}
                    <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projectFiles.map(file => (
                          <div 
                            key={file.id}
                            className="glass-card bg-black/10 p-3.5 border border-white/5 rounded-xl flex items-center justify-between gap-3 hover:border-white/10 transition-all group"
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[9px] font-bold uppercase",
                                ['png', 'jpg', 'jpeg', 'svg'].includes(file.type) ? 'bg-emerald-500/10 text-emerald-400' :
                                file.type === 'pdf' ? 'bg-red-500/10 text-red-400' :
                                file.type === 'figma' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'
                              )}>
                                {file.type.substring(0, 4)}
                              </div>
                              <div className="overflow-hidden">
                                <p className="text-xs font-semibold text-foreground truncate" title={file.name}>
                                  {file.name}
                                </p>
                                <p className="text-[9px] text-muted-foreground flex items-center gap-1">
                                  <span>{file.size}</span>
                                  <span>·</span>
                                  <span>{new Date(file.uploadedAt).toLocaleDateString('pt-BR')}</span>
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
                          <p className="text-xs text-muted-foreground italic">Nenhum arquivo anexado a este projeto.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeView === 'activity' && (
                  <div className="glass-card bg-black/20 p-5 border border-white/5 rounded-xl h-full flex flex-col overflow-hidden">
                    <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider mb-4">Linha do Tempo de Atividades</h3>
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-5 relative before:absolute before:inset-0 before:left-3 before:-translate-x-px before:h-full before:w-0.5 before:bg-white/5">
                      {activitiesList.filter(act => act.projectId === activeProjectId).map((act) => (
                        <div key={act.id} className="relative pl-8 flex gap-3 text-xs">
                          {/* Circle timeline point */}
                          <div className="absolute left-1.5 w-3.5 h-3.5 -translate-x-1/2 rounded-full bg-slate-900 border-2 border-primary flex items-center justify-center shadow shrink-0" />
                          
                          <div className="flex flex-col gap-1">
                            <p className="text-slate-200 leading-tight">
                              <span className="font-bold text-primary mr-1.5">{act.user}</span>
                              <span className="text-muted-foreground mr-1.5">{act.action}</span>
                              <span className="font-semibold text-foreground">"{act.target}"</span>
                            </p>
                            <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(act.timestamp).toLocaleString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      ))}
                      {activitiesList.filter(act => act.projectId === activeProjectId).length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center pl-0">
                          <p className="text-xs text-muted-foreground italic">Nenhuma atividade registrada ainda.</p>
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
                    <span className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-primary" /> Resumo da IA</span>
                    <Button variant="ghost" size="icon" className="w-6 h-6 -mr-2 text-muted-foreground hover:text-foreground" onClick={() => setAiPanelOpen(false)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="p-4 space-y-4 overflow-y-auto no-scrollbar">
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                      <p className="text-xs text-primary-foreground/90 leading-relaxed">
                        O projeto <span className="font-medium">{activeProject.name}</span> está com <span className="font-bold text-primary">{percentComplete}%</span> de conclusão e {overdueProjectTasks.length > 0 ? `${overdueProjectTasks.length} tarefas atrasadas` : "nenhuma tarefa atrasada"}. O ritmo está excelente!
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Atividade Recente</h4>
                      {activitiesList.filter(act => act.projectId === activeProjectId).slice(0, 3).map(act => (
                        <div key={act.id} className="flex gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center text-[9px] uppercase font-bold">
                            {act.user.substring(0, 2)}
                          </div>
                          <div>
                            <p className="text-[11px] text-foreground leading-snug">
                              <span className="font-semibold">{act.user}</span> {act.action} <span className="font-medium">{act.target}</span>.
                            </p>
                            <p className="text-[9px] text-muted-foreground mt-0.5">
                              {new Date(act.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          </div>
                        </div>
                      ))}
                      {activitiesList.filter(act => act.projectId === activeProjectId).length === 0 && (
                        <p className="text-[10px] text-muted-foreground italic">Nenhuma atividade recente.</p>
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
                  Crie sua primeira pasta para começar a organizar seus projetos, listas de tarefas, documentos e arquivos de forma integrada.
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
                  Você já tem uma pasta. Agora, crie uma lista (projeto) dentro dela para poder gerenciar suas tarefas.
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
        />
      )}

      {/* Task Details Sheet */}
      <TaskDetailsDrawer 
        task={selectedTask}
        open={isDrawerOpen}
        onOpenChange={setDrawerOpen}
        onUpdate={handleUpdateTask}
        onMove={handleMoveTask}
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
