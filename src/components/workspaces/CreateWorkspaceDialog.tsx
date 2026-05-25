import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { createWorkspace } from "@/services/workspaceService";
import { toast } from "sonner";

export function CreateWorkspaceDialog() {
  const { activeAgencyId, refreshWorkspaces, switchWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Operação interna");

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    document.addEventListener("open-create-workspace", handleOpen);
    return () => document.removeEventListener("open-create-workspace", handleOpen);
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("O nome do workspace é obrigatório.");
      return;
    }
    if (!activeAgencyId) {
      toast.error("Nenhuma agência ativa encontrada.");
      return;
    }

    setLoading(true);
    try {
      const newWs = await createWorkspace({
        agency_id: activeAgencyId,
        name,
        description,
        type,
      });
      await refreshWorkspaces();
      switchWorkspace(newWs.id);
      toast.success("Workspace criado com sucesso!");
      setOpen(false);
      setName("");
      setDescription("");
      setType("Operação interna");
    } catch (err: any) {
      toast.error("Erro ao criar workspace: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar novo Workspace</DialogTitle>
          <DialogDescription>
            Crie um ambiente isolado para sua operação, cliente ou projeto específico.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="ws-name">Nome do Workspace *</Label>
            <Input
              id="ws-name"
              placeholder="Ex: Lançamento Produto X"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ws-type">Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Operação interna">Operação interna</SelectItem>
                <SelectItem value="Cliente">Cliente</SelectItem>
                <SelectItem value="Departamento">Departamento</SelectItem>
                <SelectItem value="Lançamento">Lançamento</SelectItem>
                <SelectItem value="Suporte">Suporte</SelectItem>
                <SelectItem value="Produto">Produto</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ws-desc">Descrição (Opcional)</Label>
            <Textarea
              id="ws-desc"
              placeholder="Breve descrição sobre o propósito deste workspace"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={loading || !name.trim()}>
            {loading ? "Criando..." : "Criar Workspace"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
