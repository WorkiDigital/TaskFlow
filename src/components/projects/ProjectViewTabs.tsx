import { cn } from "@/lib/utils";
import { Activity, Calendar, FileText, FolderOpen, KanbanSquare, List } from "lucide-react";

export type ProjectViewType = 'list' | 'board' | 'calendar' | 'files' | 'docs' | 'activity';

interface ProjectViewTabsProps {
  activeView: ProjectViewType;
  onViewChange: (view: ProjectViewType) => void;
}

const tabs = [
  { id: 'list', label: 'Lista', icon: List },
  { id: 'board', label: 'Quadro', icon: KanbanSquare },
  { id: 'calendar', label: 'Calendário', icon: Calendar },
  { id: 'files', label: 'Arquivos', icon: FolderOpen },
  { id: 'docs', label: 'Docs', icon: FileText },
  { id: 'activity', label: 'Atividade', icon: Activity },
] as const;

export function ProjectViewTabs({ activeView, onViewChange }: ProjectViewTabsProps) {
  return (
    <div className="flex items-center gap-1 border-b border-border/50 px-4 pt-2 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const isActive = activeView === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id as ProjectViewType)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              isActive 
                ? "border-primary text-foreground" 
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
