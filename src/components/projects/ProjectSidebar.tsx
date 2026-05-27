import { Project, Space } from "@/data/mockProjects";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
  Layers,
} from "lucide-react";

const TAILWIND_COLOR_MAP: Record<string, string> = {
  "bg-pink-500": "#ec4899",
  "bg-red-500": "#ef4444",
  "bg-orange-500": "#f97316",
  "bg-yellow-500": "#eab308",
  "bg-green-500": "#22c55e",
  "bg-emerald-500": "#10b981",
  "bg-teal-500": "#14b8a6",
  "bg-cyan-500": "#06b6d4",
  "bg-blue-500": "#3b82f6",
  "bg-indigo-500": "#6366f1",
  "bg-violet-500": "#8b5cf6",
  "bg-purple-500": "#a855f7",
  "bg-fuchsia-500": "#d946ef",
  "bg-rose-500": "#f43f5e",
  "bg-slate-500": "#64748b",
};

function colorToHex(color: string): string {
  return TAILWIND_COLOR_MAP[color] ?? "#6366f1";
}
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { PromptDialog, ConfirmDialog } from "./CustomDialog";

interface ProjectSidebarProps {
  spaces: Space[];
  projects: Project[];
  activeProjectId: string | null;
  activeSpaceId: string | null;
  activeViewMode: "space" | "project" | "workspace" | "space-group";
  workspaceName?: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  onWorkspaceClick?: () => void;
  onProjectSelect: (id: string) => void;
  onSpaceSelect?: (id: string) => void;
  onDeleteProject?: (id: string) => void;
  onEditProject?: (id: string, newName: string) => void;
  onAddProject?: (spaceId: string, name: string) => void;
  onDeleteSpace?: (id: string) => void;
  onEditSpace?: (id: string, newName: string) => void;
  onAddSpace?: (name: string) => void;
  onAddFolder?: (parentSpaceId: string, name: string) => void;
}

export function ProjectSidebar({
  spaces,
  projects,
  activeProjectId,
  activeSpaceId,
  activeViewMode,
  workspaceName,
  mobileOpen,
  onMobileClose,
  onWorkspaceClick,
  onProjectSelect,
  onSpaceSelect,
  onDeleteProject,
  onEditProject,
  onAddProject,
  onDeleteSpace,
  onEditSpace,
  onAddSpace,
  onAddFolder,
}: ProjectSidebarProps) {
  const [expandedSpaces, setExpandedSpaces] = useState<Record<string, boolean>>(
    spaces.reduce((acc, s) => ({ ...acc, [s.id]: true }), {}),
  );
  const [query, setQuery] = useState("");
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);
  const [editingSpaceName, setEditingSpaceName] = useState("");
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState("");

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
    setExpandedSpaces((prev) => ({ ...prev, [id]: !(prev[id] !== false) }));
  };

  const filteredProjects = query
    ? projects.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    : projects;

  const handleSaveSpaceName = (id: string) => {
    if (editingSpaceName.trim() && onEditSpace) onEditSpace(id, editingSpaceName.trim());
    setEditingSpaceId(null);
  };

  const handleSaveProjectName = (id: string) => {
    if (editingProjectName.trim() && onEditProject) onEditProject(id, editingProjectName.trim());
    setEditingProjectId(null);
  };

  const openCreateSpacePrompt = () => {
    setPromptConfig({
      title: "Novo Espaço",
      description: "Crie um espaço para agrupar pastas e listas.",
      placeholder: "Nome do espaço (ex: Operação Interna, Marketing...)",
      onConfirm: (name) => onAddSpace?.(name),
    });
    setPromptOpen(true);
  };

  const openCreateFolderPrompt = (parentSpaceId: string) => {
    setPromptConfig({
      title: "Nova Pasta",
      description: "Crie uma pasta dentro do espaço para organizar suas listas.",
      placeholder: "Nome da pasta (ex: Clientes Recorrentes, Lançamento X...)",
      onConfirm: (name) => onAddFolder?.(parentSpaceId, name),
    });
    setPromptOpen(true);
  };

  const openCreateListPrompt = (spaceId: string) => {
    setPromptConfig({
      title: "Nova Lista",
      description: "Crie uma lista de tarefas.",
      placeholder: "Nome da lista (ex: Sprint 01, Campanha Maio...)",
      onConfirm: (name) => onAddProject?.(spaceId, name),
    });
    setPromptOpen(true);
  };

  // ── Hierarchy ────────────────────────────────────────────────────────────
  const rootSpaces = spaces.filter((s) => !s.parentSpaceId || s.spaceType === "space");
  const foldersByParent = spaces
    .filter((s) => s.parentSpaceId && s.spaceType === "folder")
    .reduce<Record<string, Space[]>>((acc, folder) => {
      const pid = folder.parentSpaceId!;
      if (!acc[pid]) acc[pid] = [];
      acc[pid].push(folder);
      return acc;
    }, {});

  const projectsBySpace = filteredProjects.reduce<Record<string, Project[]>>((acc, p) => {
    if (!p.spaceId) return acc;
    if (!acc[p.spaceId]) acc[p.spaceId] = [];
    acc[p.spaceId].push(p);
    return acc;
  }, {});

  const knownSpaceIds = new Set(spaces.map((s) => s.id));
  const orphanProjects = filteredProjects.filter(
    (p) => !p.spaceId || !knownSpaceIds.has(p.spaceId),
  );

  // ── Sub-components ───────────────────────────────────────────────────────
  const ProjectRow = ({ project, indent = 0 }: { project: Project; indent?: number }) => {
    const isActive = activeViewMode === "project" && activeProjectId === project.id;
    return (
      <div
        onClick={() => onProjectSelect(project.id)}
        style={{ paddingLeft: `${indent * 12 + 8}px` }}
        className={cn(
          "relative w-full flex items-center gap-2 pr-2 py-1.5 text-xs rounded-md transition-colors group/item cursor-pointer",
          isActive
            ? "bg-primary/30 text-white font-medium shadow-sm"
            : "text-muted-foreground hover:bg-white/5 hover:text-slate-200",
        )}
        role="button"
        aria-current={isActive ? "page" : undefined}
      >
        <Hash className={cn("w-3 h-3 shrink-0", isActive ? "text-primary-foreground/70" : "")} />
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
          <span className="flex-1 truncate pr-8">{project.name}</span>
        )}

        <div
          className="flex items-center shrink-0 absolute right-2 opacity-0 group-hover/item:opacity-100 transition-opacity bg-background border border-white/10 rounded px-0.5 shadow-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                className="p-0.5 hover:bg-white/10 text-muted-foreground hover:text-foreground rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                aria-label={`Ações de "${project.name}"`}
              >
                <MoreVertical className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-panel border-white/10 text-slate-200 w-36">
              <DropdownMenuItem
                onClick={() => { setEditingProjectId(project.id); setEditingProjectName(project.name); }}
                className="flex items-center gap-2 text-xs focus:bg-white/10 focus:text-white cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Editar Lista</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                onClick={() => {
                  setConfirmConfig({
                    title: "Excluir Lista",
                    description: `Deseja excluir "${project.name}"? Todas as tarefas serão removidas.`,
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
  };

  const FolderRow = ({ folder }: { folder: Space }) => {
    const isExpanded = expandedSpaces[folder.id] !== false;
    const isActive = activeViewMode === "space" && activeSpaceId === folder.id;
    const folderProjects = projectsBySpace[folder.id] ?? [];

    return (
      <div className="space-y-0.5">
        <div
          onClick={() => onSpaceSelect?.(folder.id)}
          className={cn(
            "w-full flex items-center gap-1.5 pl-5 pr-2 py-1.5 text-xs rounded-md transition-all group relative cursor-pointer",
            isActive
              ? "bg-primary/20 text-white font-semibold border border-primary/10 shadow-sm"
              : "text-muted-foreground hover:text-slate-200 hover:bg-white/5",
          )}
          role="button"
          aria-expanded={isExpanded}
          aria-current={isActive ? "page" : undefined}
        >
          <button
            className="w-3.5 h-3.5 flex items-center justify-center hover:bg-white/10 rounded transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            onClick={(e) => { e.stopPropagation(); toggleSpace(folder.id); }}
            aria-label={isExpanded ? `Recolher "${folder.name}"` : `Expandir "${folder.name}"`}
          >
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
          <Folder className="w-3 h-3 shrink-0 text-primary/60" />

          {editingSpaceId === folder.id ? (
            <input
              value={editingSpaceName}
              onChange={(e) => setEditingSpaceName(e.target.value)}
              onBlur={() => handleSaveSpaceName(folder.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveSpaceName(folder.id);
                if (e.key === "Escape") setEditingSpaceId(null);
              }}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              className="flex-1 text-xs bg-white/10 border-none outline-none focus:ring-1 focus:ring-primary rounded px-1.5 py-0.5 text-foreground font-normal"
            />
          ) : (
            <span className="flex-1 text-left truncate pr-8">{folder.name}</span>
          )}

          <div
            className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 flex items-center bg-background border border-white/10 rounded px-0.5 shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-0.5 hover:bg-white/10 text-muted-foreground hover:text-foreground rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  aria-label={`Ações de "${folder.name}"`}
                >
                  <MoreVertical className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-panel border-white/10 text-slate-200 w-40">
                <DropdownMenuItem
                  onClick={() => openCreateListPrompt(folder.id)}
                  className="flex items-center gap-2 text-xs focus:bg-white/10 focus:text-white cursor-pointer"
                >
                  <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Nova Lista</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={() => { setEditingSpaceId(folder.id); setEditingSpaceName(folder.name); }}
                  className="flex items-center gap-2 text-xs focus:bg-white/10 focus:text-white cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Renomear</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setConfirmConfig({
                      title: "Excluir Pasta",
                      description: `Deseja excluir "${folder.name}" e todas as suas listas?`,
                      isDestructive: true,
                      onConfirm: () => onDeleteSpace?.(folder.id),
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
          <div className="space-y-0.5">
            {folderProjects.map((p) => <ProjectRow key={p.id} project={p} indent={2} />)}
            {folderProjects.length === 0 && !query && (
              <p className="pl-10 text-[10px] text-muted-foreground/40 italic py-0.5">Vazia</p>
            )}
          </div>
        )}
      </div>
    );
  };

  // ── Shared sidebar body (desktop + mobile Sheet) ──────────────────────────
  const sidebarBody = (
    <div className="flex flex-col h-full bg-black/20">
      {/* Workspace header */}
      <button
        onClick={onWorkspaceClick}
        className={cn(
          "p-4 border-b border-white/5 flex items-center justify-between w-full text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
          activeViewMode === "workspace" ? "bg-primary/10 border-primary/20" : "hover:bg-white/5",
        )}
        aria-label="Abrir visão do workspace"
        aria-current={activeViewMode === "workspace" ? "page" : undefined}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
            T
          </div>
          <span className="font-semibold text-sm truncate max-w-[180px]">
            {workspaceName ?? "Workspace"}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
      </button>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar espaços e listas..."
            className="h-8 pl-8 text-xs bg-white/5 border-none focus-visible:ring-1"
            aria-label="Buscar espaços e listas"
          />
        </div>
      </div>

      {/* Tree */}
      <nav className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1" aria-label="Navegação de projetos">
        {/* Orphans */}
        {orphanProjects.length > 0 && (
          <div className="space-y-0.5 mb-2">
            {orphanProjects.map((p) => <ProjectRow key={p.id} project={p} indent={0} />)}
          </div>
        )}

        {/* Root spaces */}
        {rootSpaces.map((space) => {
          const isExpanded = expandedSpaces[space.id] !== false;
          const isActive = activeViewMode === "space" && activeSpaceId === space.id;
          const isSpaceGroup = activeViewMode === "space-group" && activeSpaceId === space.id;
          const folders = foldersByParent[space.id] ?? [];
          const directProjects = projectsBySpace[space.id] ?? [];
          const hasContent = folders.length > 0 || directProjects.length > 0;

          if (query && !hasContent) return null;

          return (
            <div key={space.id} className="space-y-0.5">
              <div
                onClick={() => onSpaceSelect?.(space.id)}
                className={cn(
                  "w-full flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md transition-all group relative cursor-pointer",
                  isActive || isSpaceGroup
                    ? "bg-primary/20 text-white font-semibold border border-primary/10 shadow-sm"
                    : "text-muted-foreground hover:text-slate-200 hover:bg-white/5",
                )}
                role="button"
                aria-expanded={isExpanded}
                aria-current={isActive || isSpaceGroup ? "page" : undefined}
              >
                <button
                  className="w-4 h-4 flex items-center justify-center hover:bg-white/10 rounded transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  onClick={(e) => { e.stopPropagation(); toggleSpace(space.id); }}
                  aria-label={isExpanded ? `Recolher "${space.name}"` : `Expandir "${space.name}"`}
                >
                  {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>

                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center text-white font-bold text-[9px] shrink-0 select-none"
                  style={{ backgroundColor: colorToHex(space.color) }}
                  aria-hidden="true"
                >
                  {space.name.charAt(0).toUpperCase()}
                </div>

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
                  <span className="flex-1 text-left truncate pr-8">{space.name}</span>
                )}

                <div
                  className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 flex items-center bg-background border border-white/10 rounded px-0.5 shadow-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="p-0.5 hover:bg-white/10 text-muted-foreground hover:text-foreground rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                        aria-label={`Ações de "${space.name}"`}
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass-panel border-white/10 text-slate-200 w-44">
                      <DropdownMenuItem
                        onClick={() => openCreateFolderPrompt(space.id)}
                        className="flex items-center gap-2 text-xs focus:bg-white/10 focus:text-white cursor-pointer"
                      >
                        <Folder className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Nova Pasta</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openCreateListPrompt(space.id)}
                        className="flex items-center gap-2 text-xs focus:bg-white/10 focus:text-white cursor-pointer"
                      >
                        <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Nova Lista</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem
                        onClick={() => { setEditingSpaceId(space.id); setEditingSpaceName(space.name); }}
                        className="flex items-center gap-2 text-xs focus:bg-white/10 focus:text-white cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Renomear Espaço</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setConfirmConfig({
                            title: "Excluir Espaço",
                            description: `Deseja excluir "${space.name}" e todo o seu conteúdo?`,
                            isDestructive: true,
                            onConfirm: () => onDeleteSpace?.(space.id),
                          });
                          setConfirmOpen(true);
                        }}
                        className="flex items-center gap-2 text-xs text-red-400 focus:bg-red-500/20 focus:text-red-300 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir Espaço</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {isExpanded && (
                <div className="space-y-0.5 ml-1">
                  {directProjects.map((p) => <ProjectRow key={p.id} project={p} indent={1} />)}
                  {folders.map((folder) => <FolderRow key={folder.id} folder={folder} />)}
                  {!hasContent && !query && (
                    <p className="pl-6 text-[10px] text-muted-foreground/40 italic py-0.5">
                      Espaço vazio
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Empty state */}
        {rootSpaces.length === 0 && orphanProjects.length === 0 && (
          <div className="text-center py-8 px-4">
            <Layers className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" aria-hidden="true" />
            <p className="text-xs text-muted-foreground/60">Nenhum espaço criado.</p>
            <button
              onClick={openCreateSpacePrompt}
              className="mt-3 text-xs text-primary/70 hover:text-primary underline underline-offset-2 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
            >
              Criar primeiro espaço
            </button>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/5 flex gap-2">
        <button
          onClick={openCreateSpacePrompt}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 min-h-[44px] text-xs font-medium bg-white/5 hover:bg-white/10 text-foreground rounded-md transition-colors border border-white/5 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          aria-label="Criar novo espaço"
        >
          <Layers className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
          Novo Espaço
        </button>
        <button
          onClick={() => {
            if (rootSpaces.length === 0) { openCreateSpacePrompt(); return; }
            openCreateListPrompt(rootSpaces[0].id);
          }}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 min-h-[44px] text-xs font-medium bg-primary hover:bg-primary/95 text-primary-foreground rounded-md transition-colors border border-white/5 shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
          aria-label="Criar nova lista"
        >
          <Plus className="w-3 h-3" aria-hidden="true" />
          Nova Lista
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="w-[300px] shrink-0 border-r border-white/5 h-full overflow-hidden hidden md:flex flex-col">
        {sidebarBody}
      </div>

      {/* Mobile Sheet */}
      <Sheet open={mobileOpen} onOpenChange={(open) => { if (!open) onMobileClose?.(); }}>
        <SheetContent side="left" className="p-0 w-[300px] border-r border-white/10" aria-label="Menu de navegação">
          {sidebarBody}
        </SheetContent>
      </Sheet>

      {/* Dialogs rendered once, outside both panels */}
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
    </>
  );
}
