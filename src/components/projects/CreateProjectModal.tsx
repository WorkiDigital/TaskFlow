import { useState } from "react";
import { Project, ProjectStatus } from "@/data/mockProjects";
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
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (project: Project) => void;
}

export function CreateProjectModal({ open, onOpenChange, onCreate }: CreateProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    clientName: "",
    status: "planning" as ProjectStatus,
    startDate: "",
    dueDate: "",
    members: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.clientName.trim()) {
      toast.error("Nome e Cliente são obrigatórios");
      return;
    }

    setLoading(true);
    // Simulating loading
    setTimeout(() => {
      const newProject: Project = {
        id: `p-${Date.now()}`,
        spaceId: "sp-1",
        name: form.name,
        clientName: form.clientName,
        status: form.status,
        progress: 0,
        startDate: form.startDate,
        dueDate: form.dueDate,
        members: form.members
          .split(",")
          .map((m) => m.trim())
          .filter(Boolean),
      };

      console.log("[CreateProjectModal] Projeto criado localmente", newProject);
      onCreate(newProject);
      toast.success("Projeto criado com sucesso!");
      setLoading(false);
      onOpenChange(false);
      setForm({
        name: "",
        clientName: "",
        status: "planning",
        startDate: "",
        dueDate: "",
        members: "",
      });
    }, 800);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Projeto</DialogTitle>
          <DialogDescription>
            Crie um novo quadro Kanban para a sua equipe e organize as entregas do cliente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>
              Nome do Projeto <span className="text-destructive">*</span>
            </Label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Lançamento VIP"
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label>
              Cliente <span className="text-destructive">*</span>
            </Label>
            <Input
              required
              value={form.clientName}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              placeholder="Nome do cliente"
              className="bg-background/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Início</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Prazo Final</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="bg-background/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Membros (Iniciais separadas por vírgula)</Label>
            <Input
              value={form.members}
              onChange={(e) => setForm({ ...form, members: e.target.value })}
              placeholder="Ex: AD, JP, MC"
              className="bg-background/50"
            />
          </div>

          <div className="pt-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Criando projeto..." : "Criar Projeto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
