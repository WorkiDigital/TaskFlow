import { useState, useEffect } from "react";
import { ProjectTask, TaskStatus, TaskPriority, mockProjectColumns } from "@/data/mockProjects";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onCreate: (task: ProjectTask) => void;
  defaultStatus?: TaskStatus;
  defaultDueDate?: string;
}

export function CreateTaskModal({ open, onOpenChange, projectId, onCreate, defaultStatus, defaultDueDate }: CreateTaskModalProps) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.assignee.trim()) {
      toast.error("Título e Responsável são obrigatórios");
      return;
    }

    setLoading(true);
    // Simulating loading
    setTimeout(() => {
      const newTask: ProjectTask = {
        id: `t-${Date.now()}`,
        projectId,
        columnId: mockProjectColumns.find(c => c.status === form.status)?.id || "col-1",
        status: form.status,
        title: form.title,
        description: form.description,
        assignee: form.assignee,
        dueDate: form.dueDate,
        priority: form.priority,
        checklist: [], // starts empty, can be added later or via AI
        comments: [],
        activity: [
          {
            id: `act-${Date.now()}`,
            description: `Tarefa criada por ${form.assignee}`,
            timestamp: new Date().toISOString()
          }
        ],
        tags: [],
      };

      console.log('[CreateTaskModal] Tarefa criada localmente', newTask);
      onCreate(newTask);
      toast.success("Tarefa criada com sucesso!");
      setLoading(false);
      onOpenChange(false);
      setForm({ title: "", description: "", status: "backlog", priority: "medium", assignee: "", dueDate: "" });
    }, 600);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
          <DialogDescription>
            Adicione uma nova tarefa ao quadro atual.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Título <span className="text-destructive">*</span></Label>
            <Input 
              required
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              placeholder="Ex: Criar artes para feed"
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea 
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              placeholder="Detalhes da entrega..."
              className="bg-background/50 resize-none h-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v: TaskStatus) => setForm({...form, status: v})}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-card">
                  {mockProjectColumns.map(c => (
                    <SelectItem key={c.status} value={c.status}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={(v: TaskPriority) => setForm({...form, priority: v})}>
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
              <Label>Responsável <span className="text-destructive">*</span></Label>
              <Input 
                required
                value={form.assignee}
                onChange={e => setForm({...form, assignee: e.target.value})}
                placeholder="Iniciais (ex: JP)"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Prazo</Label>
              <Input 
                type="date"
                value={form.dueDate}
                onChange={e => setForm({...form, dueDate: e.target.value})}
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
