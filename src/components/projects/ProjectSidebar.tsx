import { Project, Space } from "@/data/mockProjects";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  Hash,
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { PromptDialog, ConfirmDialog } from "./CustomDialog";

interface ProjectSidebarProps {
  spaces: Space[];
  projects: Project[];
  activeProjectId: string | null;
  activeSpaceId: string | null;
  activeViewMode: "space" | "project";
  onProjectSelect: (id: string) => void;
  onSpaceSelect?: (id: string) => void;
  onDeleteProject?: (id: string) => void;
  onEditProject?: (id: string, newName: string) => void;
  onAddProject?: (spaceId: string, name: string) => void;
  onDeleteSpace?: (id: string) => void;
  onEditSpace?: (id: string, newName: string) => void;
  onAddSpace?: (name: string) => void;
}

export function ProjectSidebar({
  spaces,
  projects,
  activeProjectId,
  activeSpaceId,
  activeViewMode,
  onProjectSelect,
  onSpaceSelect,
  onDeleteProject,
  onEditProject,
  onAddProject,
  onDeleteSpace,
  onEditSpace,
  onAddSpace,
}: ProjectSidebarProps) {
  const [expandedSpaces, setExpandedSpaces] = useState<Record<string, boolean>>(
    spaces.reduce((acc, s) => ({ ...acc, [s.id]: true }), {}),
  );
  const [query, setQuery] = useState("");

  // State for inline editing
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);
  const [editingSpaceName, setEditingSpaceName] = useState("");
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState("");

  // Dialog state hooks
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

  const toggleSpace = (id: string) => {
    setExpandedSpaces((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredProjects = query
    ? projects.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    : projects;

  const handleSaveSpaceName = (id: string) => {
    if (editingSpaceName.trim() && onEditSpace) {
      onEditSpace(id, editingSpaceName.trim());
    }
    setEditingSpaceId(null);
  };

  const handleSaveProjectName = (id: string) => {
    if (editingProjectName.trim() && onEditProject) {
      onEditProject(id, editingProjectName.trim());
    }
    setEditingProjectId(null);
  };

  const handleCreateSpacePrompt = () => {
    setPromptConfig({
      title: "Nova Pasta",
      description: "Crie uma nova pasta para organizar seus projetos.",
      placeholder: "Digite o nome da pasta (ex: Marketing, Tráfego Pago...)",
      onConfirm: (name) => {
        if (onAddSpace) onAddSpace(name);
      },
    });
    setPromptOpen(true);
  };

  const handleAddProjectPrompt = (spaceId: string) => {
    setPromptConfig({
      title: "Nova Lista",
      description: "Crie uma nova lista de tarefas dentro da pasta.",
      placeholder: "Digite o nome da lista (ex: Lançamento Infoproduto...)",
      onConfirm: (name) => {
        if (onAddProject) onAddProject(spaceId, name);
      },
    });
    setPromptOpen(true);
  };

  return (
    <div className="w-[300px] shrink-0 bg-black/20 border-r border-white/5 flex flex-col h-full overflow-hidden hidden md:flex">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs animate-pulse">
            T
          </div>
          <span className="font-semibold text-sm">TaskFlow Workspace</span>
        </div>
        <button className="text-muted-foreground hover:text-foreground">
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3">
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar pastas e listas..."
            className="h-8 pl-8 text-xs bg-white/5 border-none focus-visible:ring-1"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-4">
        {spaces.map((space) => {
          const spaceProjects = filteredProjects.filter((p) => p.spaceId === space.id);
          if (query && spaceProjects.length === 0) return null;

          const isExpanded = expandedSpaces[space.id];

          return (
            <div key={space.id} className="space-y-1">
              <div
                onClick={() => onSpaceSelect?.(space.id)}
                className={cn(
                  "w-full flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md transition-all group relative cursor-pointer",
                  activeViewMode === "space" && activeSpaceId === space.id
                    ? "bg-primary/20 text-white font-semibold border border-primary/10 shadow-sm"
                    : "text-muted-foreground hover:text-slate-200 hover:bg-white/5",
                )}
              >
                <div
                  className="w-4 h-4 flex items-center justify-center cursor-pointer hover:bg-white/10 rounded transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSpace(space.id);
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </div>
                <Folder
                  className={cn(
                    "w-3.5 h-3.5 shrink-0",
                    space.color ? space.color.replace("bg-", "text-") : "text-primary",
                  )}
                />

                {editingSpaceId === space.id ? (
                  <input
                    value={editingSpaceName}
                    onChange={(e) => setEditingSpaceName(e.target.value)}
                    onBlur={() => handleSaveSpaceName(space.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveSpaceName(space.id);
                      if (e.key === "Escape") setEditingSpaceId(null);
                    }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 text-xs bg-white/10 border-none outline-none focus:ring-1 focus:ring-primary rounded px-1.5 py-0.5 text-foreground font-normal"
                  />
                ) : (
                  <span className="flex-1 text-left truncate pr-16">{space.name}</span>
                )}

                {/* Space Dropdown Trigger (MoreVertical) */}
                <div
                  className="opacity-40 group-hover:opacity-100 transition-opacity absolute right-2 flex items-center gap-0.5 bg-background border border-white/10 rounded px-0.5 shadow-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <button className="p-0.5 hover:bg-white/10 text-muted-foreground hover:text-foreground rounded transition-colors cursor-pointer">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="glass-panel border-white/10 text-slate-200 w-40"
                    >
                      <DropdownMenuItem
                        onClick={() => handleAddProjectPrompt(space.id)}
                        className="flex items-center gap-2 text-xs focus:bg-white/10 focus:text-white cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Nova Lista</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingSpaceId(space.id);
                          setEditingSpaceName(space.name);
                        }}
                        className="flex items-center gap-2 text-xs focus:bg-white/10 focus:text-white cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Editar Pasta</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setConfirmConfig({
                            title: "Excluir Pasta",
                            description: `Deseja excluir a pasta "${space.name}" e todas as suas listas? Esta ação não pode ser desfeita.`,
                            isDestructive: true,
                            onConfirm: () => onDeleteSpace?.(space.id),
                          });
                          setConfirmOpen(true);
                        }}
                        className="flex items-center gap-2 text-xs text-red-400 focus:bg-red-500/20 focus:text-red-300 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir Pasta</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {isExpanded && (
                <div className="pl-6 space-y-0.5">
                  {spaceProjects.map((project) => {
                    const isActive = activeViewMode === "project" && activeProjectId === project.id;
                    return (
                      <div
                        key={project.id}
                        onClick={() => onProjectSelect(project.id)}
                        className={cn(
                          "relative w-full flex items-center justify-between gap-2 px-2 py-1.5 text-xs rounded-md transition-colors group/item cursor-pointer",
                          isActive
                            ? "bg-primary/30 text-white font-medium shadow-sm"
                            : "text-muted-foreground hover:bg-white/5 hover:text-slate-200",
                        )}
                      >
                        <div className="flex items-center gap-2 truncate flex-1">
                          <Hash
                            className={cn(
                              "w-3 h-3 shrink-0",
                              isActive ? "text-primary-foreground/70" : "",
                            )}
                          />
                          {editingProjectId === project.id ? (
                            <input
                              value={editingProjectName}
                              onChange={(e) => setEditingProjectName(e.target.value)}
                              onBlur={() => handleSaveProjectName(project.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveProjectName(project.id);
                                if (e.key === "Escape") setEditingProjectId(null);
                              }}
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 text-xs bg-white/10 border-none outline-none focus:ring-1 focus:ring-primary rounded px-1.5 py-0.5 text-foreground font-normal"
                            />
                          ) : (
                            <span className="truncate pr-12">{project.name}</span>
                          )}
                        </div>

                        <div
                          className="flex items-center gap-1 shrink-0 absolute right-2 opacity-40 group-hover/item:opacity-100 transition-opacity bg-background border border-white/10 rounded px-0.5 shadow-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <button className="p-0.5 hover:bg-white/10 text-muted-foreground hover:text-foreground rounded transition-colors cursor-pointer">
                                <MoreVertical className="w-3 h-3" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="glass-panel border-white/10 text-slate-200 w-36"
                            >
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingProjectId(project.id);
                                  setEditingProjectName(project.name);
                                }}
                                className="flex items-center gap-2 text-xs focus:bg-white/10 focus:text-white cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>Editar Lista</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setConfirmConfig({
                                    title: "Excluir Lista",
                                    description: `Deseja excluir a lista "${project.name}"? Esta ação não pode ser desfeita e todas as tarefas serão removidas.`,
                                    isDestructive: true,
                                    onConfirm: () => onDeleteProject?.(project.id),
                                  });
                                  setConfirmOpen(true);
                                }}
                                className="flex items-center gap-2 text-xs text-red-400 focus:bg-red-500/20 focus:text-red-300 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Excluir Lista</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                  {!query && spaceProjects.length === 0 && (
                    <div className="px-2 py-1 text-[10px] text-muted-foreground/50 italic">
                      Vazio
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-white/5 flex gap-2">
        <button
          onClick={handleCreateSpacePrompt}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-white/5 hover:bg-white/10 text-foreground rounded-md transition-colors border border-white/5 cursor-pointer"
        >
          <Folder className="w-3 h-3 text-muted-foreground" />
          Nova Pasta
        </button>
        <button
          onClick={() => {
            if (spaces.length === 0) {
              alert("Crie uma pasta primeiro antes de adicionar uma lista!");
              return;
            }
            handleAddProjectPrompt(spaces[0].id);
          }}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-primary hover:bg-primary/95 text-primary-foreground rounded-md transition-colors border border-white/5 shadow-sm cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          Nova Lista
        </button>
      </div>

      {/* Reusable Dialogs for Sidebar */}
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
