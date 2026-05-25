import { useState, useEffect } from "react";
import { KanbanColumn } from "./KanbanColumn";
import { ColumnSettingsSheet } from "./ColumnSettingsSheet";
import { ProjectTask } from "@/data/mockProjects";
import type { DbProjectColumn } from "@/services/projectsService";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KanbanBoardProps {
  columns: DbProjectColumn[];
  tasks: ProjectTask[];
  onTasksChange?: (tasks: ProjectTask[]) => void;
  onTaskClick?: (task: ProjectTask) => void;
  onAddTask?: (columnId: string) => void;
  onTaskAction?: (
    action: "edit" | "duplicate" | "change_assignee" | "delete",
    task: ProjectTask,
  ) => void;
  onAddColumn?: (data: Omit<DbProjectColumn, "id" | "project_id" | "agency_id" | "created_at" | "updated_at">) => void;
  onEditColumn?: (columnId: string, data: Partial<DbProjectColumn>) => void;
  onDeleteColumn?: (columnId: string) => void;
}

export function KanbanBoard({
  columns,
  tasks: initialTasks,
  onTasksChange,
  onTaskClick,
  onAddTask,
  onTaskAction,
  onAddColumn,
  onEditColumn,
  onDeleteColumn,
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState<ProjectTask[]>(initialTasks);
  const [editingColumn, setEditingColumn] = useState<DbProjectColumn | null>(null);
  const [creatingColumn, setCreatingColumn] = useState(false);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const sorted = [...columns].sort((a, b) => a.position - b.position);

  return (
    <>
      <div className="-mx-4 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0 custom-scrollbar h-full">
        <div className="flex gap-4 pb-4 h-full items-start">
          {sorted.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={tasks.filter((t) => t.columnId === col.id)}
              onTaskClick={(t) => onTaskClick?.(t)}
              onAddTask={onAddTask}
              onTaskAction={onTaskAction}
              onEditColumn={(c) => setEditingColumn(c)}
              onDeleteColumn={onDeleteColumn}
            />
          ))}

          {/* Add column button */}
          <div className="shrink-0 w-[220px]">
            <Button
              variant="outline"
              className="w-full h-12 border-dashed border-white/15 bg-white/3 hover:bg-white/8 text-muted-foreground hover:text-foreground gap-2 text-sm"
              onClick={() => setCreatingColumn(true)}
            >
              <Plus className="w-4 h-4" />
              Nova coluna
            </Button>
          </div>
        </div>
      </div>

      {/* Edit column sheet */}
      {editingColumn && (
        <ColumnSettingsSheet
          open
          column={editingColumn}
          onSave={(data) => {
            onEditColumn?.(editingColumn.id, data);
            setEditingColumn(null);
          }}
          onClose={() => setEditingColumn(null)}
        />
      )}

      {/* Create column sheet */}
      <ColumnSettingsSheet
        open={creatingColumn}
        onSave={(data) => {
          onAddColumn?.({ ...data, position: columns.length });
          setCreatingColumn(false);
        }}
        onClose={() => setCreatingColumn(false)}
      />
    </>
  );
}
