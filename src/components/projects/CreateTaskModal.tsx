import { useState, useEffect } from "react";
import { ProjectTask, TaskStatus, TaskPriority, mockProjectColumns } from "@/data/mockProjects";
import { createProjectTask } from "@/services/projectsService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { TeamMember } from "@/services/teamService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onCreate: (task: ProjectTask) => void;
  defaultStatus?: TaskStatus;
  defaultDueDate?: string;
  defaultColumnId?: string;
  members: TeamMember[];
}

export function CreateTaskModal({
  open,
  onOpenChange,
  projectId,
  onCreate,
  defaultStatus,
  defaultDueDate,
  defaultColumnId,
  members,
}: CreateTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "backlog" as TaskStatus,
    priority: "medium" as TaskPriority,
    assignee: "",
    dueDate: "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        title: "",
        description: "",
        status: (defaultStatus || "backlog") as TaskStatus,
        priority: "medium" as TaskPriority,
        assignee: "",
        dueDate: defaultDueDate || "",
      });
    }
  }, [open, defaultStatus, defaultDueDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    setLoading(true);
    try {
      const member = members.find((m) => (m.full_name || m.email) === form.assignee);
      const created = await createProjectTask({
        project_id: projectId,
        title: form.title,
        description: form.description || undefined,
        status: form.status,
        priority: form.priority,
        assignee_id: member?.id,
        due_date: form.dueDate || undefined,
        column_id: defaultColumnId || undefined,
      });

      const newTask: ProjectTask = {
        id: created.id,
        projectId,
        columnId: defaultColumnId || created.column_id ||
          mockProjectColumns.find((c) => c.status === form.status)?.id || "col-1",
        status: form.status,
        title: created.title,
        description: created.description ?? "",
        assignee: form.assignee,
        dueDate: created.due_date ?? "",
        priority: form.priority,
        checklist: [],
        comments: [],
        activity: [],
        tags: [],
      };

      onCreate(newTask);
      toast.success("Tarefa criada com sucesso!");
      onOpenChange(false);
      setForm({
        title: "",
        description: "",
        status: "backlog",
        priority: "medium",
        assignee: "",
        dueDate: "",
      });
    } catch (err) {
      toast.error("Erro ao criar tarefa: " + String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
          <DialogDescription>Adicione uma nova tarefa ao quadro atual.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>
              Título <span className="text-destructive">*</span>
            </Label>
            <Input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Criar artes para feed"
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detalhes da entrega..."
              className="bg-background/50 resize-none h-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v: TaskStatus) => setForm({ ...form, status: v })}
              >
                <SelectTrigger className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-card">
                  {mockProjectColumns.map((c) => (
                    <SelectItem key={c.status} value={c.status}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select
                value={form.priority}
                onValueChange={(v: TaskPriority) => setForm({ ...form, priority: v })}
              >
                <SelectTrigger className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-card">
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Responsável <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.assignee}
                onValueChange={(v) => setForm({ ...form, assignee: v })}
              >
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="glass-card">
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.full_name || m.email}>
                      {m.full_name || m.email}
                    </SelectItem>
                  ))}
                  {members.length === 0 && (
                    <SelectItem value="Internal" disabled>
                      Sem membros
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prazo</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="bg-background/50"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Salvando..." : "Criar Tarefa"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
