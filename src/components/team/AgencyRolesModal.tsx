import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { teamService, AgencyRole } from "@/services/teamService";
import { toast } from "sonner";
import { Loader2, Trash2, Edit2, Plus } from "lucide-react";

interface AgencyRolesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgencyRolesModal({ open, onOpenChange }: AgencyRolesModalProps) {
  const [roles, setRoles] = useState<AgencyRole[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState("");

  const loadRoles = async () => {
    setIsLoading(true);
    try {
      const data = await teamService.getAgencyRoles();
      setRoles(data);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar cargos.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadRoles();
    }
  }, [open]);

  const handleSaveRole = async () => {
    if (!newRoleName.trim()) return;
    
    setIsLoading(true);
    try {
      if (isEditing) {
        await teamService.updateAgencyRole(isEditing, newRoleName, {});
        toast.success("Cargo atualizado.");
      } else {
        await teamService.createAgencyRole(newRoleName, {});
        toast.success("Cargo criado com sucesso.");
      }
      setNewRoleName("");
      setIsEditing(null);
      loadRoles();
    } catch (error) {
      toast.error("Erro ao salvar cargo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este cargo?")) return;
    
    setIsLoading(true);
    try {
      await teamService.deleteAgencyRole(id);
      toast.success("Cargo excluído.");
      loadRoles();
    } catch (error) {
      toast.error("Erro ao excluir cargo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (role: AgencyRole) => {
    setIsEditing(role.id);
    setNewRoleName(role.name);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Cargos da Agência</DialogTitle>
          <DialogDescription>
            Crie cargos customizados (ex: Gestor de Tráfego, Designer) para atribuir à sua equipe.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="role-name">{isEditing ? "Editar Cargo" : "Novo Cargo"}</Label>
              <Input 
                id="role-name"
                placeholder="Nome do cargo..." 
                value={newRoleName}
                onChange={e => setNewRoleName(e.target.value)}
              />
            </div>
            <Button onClick={handleSaveRole} disabled={isLoading || !newRoleName.trim()}>
              {isEditing ? "Salvar" : <Plus className="h-4 w-4" />}
            </Button>
            {isEditing && (
              <Button variant="ghost" onClick={() => { setIsEditing(null); setNewRoleName(""); }}>
                Cancelar
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <Label>Cargos Existentes</Label>
            {isLoading && roles.length === 0 ? (
              <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : roles.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Nenhum cargo customizado criado.</p>
            ) : (
              <div className="space-y-2">
                {roles.map(role => (
                  <div key={role.id} className="flex items-center justify-between p-3 rounded-md bg-secondary/20 border border-border/50">
                    <span className="text-sm font-medium">{role.name}</span>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(role)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(role.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
