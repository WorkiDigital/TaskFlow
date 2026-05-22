import { createFileRoute } from "@tanstack/react-router";
import { KanbanBoard } from "@/components/projects/KanbanBoard";
import { mockProjects } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/projects")({
  component: ProjectsPage,
});

function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Projetos</h2>
        <p className="text-sm text-muted-foreground">Acompanhe entregas e fluxo de trabalho da equipe.</p>
      </div>
      <KanbanBoard tasks={mockProjects} />
    </div>
  );
}
