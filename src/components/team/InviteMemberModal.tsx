import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { teamService, AgencyRole } from "@/services/teamService";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface InviteMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function InviteMemberModal({ open, onOpenChange, onSuccess }: InviteMemberModalProps) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<'admin' | 'member'>("member");
  const [agencyRoleId, setAgencyRoleId] = useState<string>("none");
  const [roles, setRoles] = useState<AgencyRole[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      teamService.getAgencyRoles()
        .then(setRoles)
        .catch(err => console.error("Erro ao carregar cargos:", err));
    }
  }, [open]);

  const handleInvite = async () => {
    if (!email) {
      toast.error("O e-mail é obrigatório.");
      return;
    }

    setIsLoading(true);
    try {
      await teamService.inviteMember(
        email, 
        role, 
        agencyRoleId === "none" ? undefined : agencyRoleId,
        fullName || undefined
      );
      toast.success("Convite enviado com sucesso!");
      setEmail("");
      setFullName("");
      setRole("member");
      setAgencyRoleId("none");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar convite.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar Membro</DialogTitle>
          <DialogDescription>
            Envie um convite para um novo membro ingressar na sua agência.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="invite-name">Nome Completo (Opcional)</Label>
            <Input 
              id="invite-name"
              placeholder="Ex: João Silva" 
              value={fullName}
              onChange={e => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-email">E-mail</Label>
            <Input 
              id="invite-email"
              type="email"
              placeholder="membro@agencia.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nível de Acesso</Label>
              <Select value={role} onValueChange={(v: 'admin'|'member') => setRole(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cargo (Customizado)</Label>
              <Select value={agencyRoleId} onValueChange={setAgencyRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {roles.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancelar</Button>
          <Button onClick={handleInvite} disabled={isLoading} className="w-[120px]">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar Convite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
