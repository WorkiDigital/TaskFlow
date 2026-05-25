import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { updateWorkspace, archiveWorkspace, getWorkspaceMembers, WorkspaceMember } from "@/services/workspaceService";
import { toast } from "sonner";
import { User, Settings, Users, Trash2 } from "lucide-react";

export function WorkspaceSettingsDialog() {
  const { activeWorkspace, refreshWorkspaces, switchWorkspace, workspaces } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [members, setMembers] = useState<WorkspaceMember[]>([]);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    document.addEventListener("open-workspace-settings", handleOpen);
    return () => document.removeEventListener("open-workspace-settings", handleOpen);
  }, []);

  useEffect(() => {
    if (open && activeWorkspace) {
      setName(activeWorkspace.name);
      setDescription(activeWorkspace.description || "");
      loadMembers();
    }
  }, [open, activeWorkspace]);

  const loadMembers = async () => {
    if (!activeWorkspace) return;
    try {
      const data = await getWorkspaceMembers(activeWorkspace.id);
      setMembers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      await updateWorkspace(activeWorkspace.id, { name, description });
      await refreshWorkspaces();
      toast.success("Configurações salvas.");
      setOpen(false);
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!activeWorkspace) return;
    if (!confirm("Tem certeza que deseja arquivar este workspace? Ele não aparecerá mais na sua lista.")) return;
    
    setLoading(true);
    try {
      await archiveWorkspace(activeWorkspace.id);
      toast.success("Workspace arquivado.");
      await refreshWorkspaces();
      
      const remaining = workspaces.filter(w => w.id !== activeWorkspace.id);
      if (remaining.length > 0) {
        switchWorkspace(remaining[0].id);
      } else {
        switchWorkspace(""); // Vai forçar null no provider ou cair pro primeiro
      }
      setOpen(false);
    } catch (err: any) {
      toast.error("Erro ao arquivar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!activeWorkspace) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configurações do Workspace</DialogTitle>
          <DialogDescription>
            Gerencie as informações e os membros do workspace "{activeWorkspace.name}".
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general"><Settings className="w-4 h-4 mr-2" /> Geral</TabsTrigger>
            <TabsTrigger value="members"><Users className="w-4 h-4 mr-2" /> Membros</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ws-edit-name">Nome do Workspace</Label>
              <Input
                id="ws-edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ws-edit-desc">Descrição</Label>
              <Input
                id="ws-edit-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="pt-6 border-t mt-6 border-destructive/20">
              <h4 className="text-sm font-medium text-destructive flex items-center mb-2">
                <Trash2 className="w-4 h-4 mr-2" />
                Zona de Perigo
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Arquivar o workspace irá escondê-lo da sua lista e de todos os membros.
              </p>
              <Button variant="destructive" onClick={handleArchive} disabled={loading}>
                Arquivar Workspace
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="members" className="py-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">
                  Membros atuais com acesso a este workspace.
                </p>
                <Button size="sm" variant="outline" disabled>
                  Convidar Membro
                </Button>
              </div>

              <div className="rounded-md border">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border-b last:border-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">{member.users?.full_name || member.users?.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">{member.users?.email}</p>
                      </div>
                    </div>
                    <div className="text-sm capitalize text-muted-foreground">
                      {member.role}
                    </div>
                  </div>
                ))}
                {members.length === 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Carregando membros...
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleUpdate} disabled={loading || !name.trim()}>
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
