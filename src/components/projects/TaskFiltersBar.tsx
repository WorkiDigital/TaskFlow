import { Filter, Search, SortAsc, Users, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { mockProjectColumns } from "@/data/mockProjects";

interface TaskFiltersBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  assigneeFilter: string;
  onAssigneeFilterChange: (val: string) => void;
  sortBy: "title" | "dueDate" | "priority" | "none";
  onSortByChange: (val: "title" | "dueDate" | "priority" | "none") => void;
  assignees: string[];
}

export function TaskFiltersBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  assigneeFilter,
  onAssigneeFilterChange,
  sortBy,
  onSortByChange,
  assignees,
}: TaskFiltersBarProps) {
  const isAnyFilterActive =
    searchQuery || statusFilter !== "all" || assigneeFilter !== "all" || sortBy !== "none";

  return (
    <div className="flex items-center gap-3 px-6 py-2 bg-black/20 border-b border-border/50 overflow-x-auto custom-scrollbar no-scrollbar-on-mobile shrink-0">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Buscar tarefas..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-7 text-xs bg-white/5 border-white/10 w-full"
        />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Status Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px] px-2.5 border-white/10 bg-transparent hover:bg-white/5"
            >
              <Filter className="w-3 h-3 mr-1.5" />
              Status:{" "}
              {statusFilter === "all"
                ? "Todos"
                : mockProjectColumns.find((c) => c.status === statusFilter)?.title || statusFilter}
              <ChevronDown className="w-3 h-3 ml-1.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="glass-card">
            <DropdownMenuItem onClick={() => onStatusFilterChange("all")}>
              Todos os Status
            </DropdownMenuItem>
            {mockProjectColumns.map((c) => (
              <DropdownMenuItem key={c.status} onClick={() => onStatusFilterChange(c.status)}>
                {c.title}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Assignee Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px] px-2.5 border-white/10 bg-transparent hover:bg-white/5"
            >
              <Users className="w-3 h-3 mr-1.5" />
              Responsável: {assigneeFilter === "all" ? "Todos" : assigneeFilter}
              <ChevronDown className="w-3 h-3 ml-1.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="glass-card">
            <DropdownMenuItem onClick={() => onAssigneeFilterChange("all")}>
              Todos os Responsáveis
            </DropdownMenuItem>
            {assignees.map((a) => (
              <DropdownMenuItem key={a} onClick={() => onAssigneeFilterChange(a)}>
                {a}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-4 bg-white/10 mx-1" />

        {/* Sorting Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 text-[11px] px-2.5 hover:bg-white/5">
              <SortAsc className="w-3 h-3 mr-1.5" />
              Ordenar:{" "}
              {sortBy === "none"
                ? "Nenhum"
                : sortBy === "title"
                  ? "Título"
                  : sortBy === "dueDate"
                    ? "Prazo"
                    : "Prioridade"}
              <ChevronDown className="w-3 h-3 ml-1.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="glass-card">
            <DropdownMenuItem onClick={() => onSortByChange("none")}>
              Sem ordenação
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortByChange("title")}>Título</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortByChange("dueDate")}>Prazo</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortByChange("priority")}>
              Prioridade
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {isAnyFilterActive && (
          <>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] px-2.5 text-muted-foreground hover:text-foreground hover:bg-white/5"
              onClick={() => {
                onSearchChange("");
                onStatusFilterChange("all");
                onAssigneeFilterChange("all");
                onSortByChange("none");
              }}
            >
              Limpar Filtros
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
