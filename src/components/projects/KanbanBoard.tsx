import { useState, useEffect } from "react";
import { KanbanColumn } from "./KanbanColumn";
import { ProjectTask, mockProjectColumns, TaskStatus } from "@/data/mockProjects";

interface KanbanBoardProps {
  tasks: ProjectTask[];
  onTasksChange?: (tasks: ProjectTask[]) => void;
  onTaskClick?: (task: ProjectTask) => void;
  onAddTask?: (status: TaskStatus) => void;
}

export function KanbanBoard({ tasks: initialTasks, onTasksChange, onTaskClick, onAddTask }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<ProjectTask[]>(initialTasks);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  console.log("[KanbanBoard] render", tasks.length, "tasks");

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0 custom-scrollbar h-full">
      <div className="flex gap-4 pb-4 h-full items-start">
        {mockProjectColumns.map((col) => (
          <KanbanColumn
            key={col.id}
            title={col.title}
            status={col.status}
            tasks={tasks.filter((t) => t.status === col.status)}
            onTaskClick={(t) => onTaskClick?.(t)}
            onAddTask={onAddTask}
          />
        ))}
      </div>
    </div>
  );
}
