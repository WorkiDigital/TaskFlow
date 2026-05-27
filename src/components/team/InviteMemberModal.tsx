import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { teamService, AgencyRole } from "@/services/teamService";
import { toast } from "sonner";
import { Loader2, Copy, Check } from "lucide-react";

interface InviteMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function InviteMemberModal({ open, onOpenChange, onSuccess }: InviteMemberModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "manager" | "team" | "client">("team");
  const [department, setDepartment] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [roles, setRoles] = useState<AgencyRole[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Success state for displaying copyable link
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      teamService
        .getAgencyRoles()
        .then(setRoles)
        .catch((err) => console.error("Erro ao carregar cargos:", err));
      setGeneratedLink(null);
      setCopied(false);
    }
  }, [open]);

  const handleInvite = async () => {
    if (!email) {
      toast.error("O e-mail é obrigatório.");
      return;
    }

    setIsLoading(true);
    try {
      // Resolve job title - if user selected a custom agency role, we can prefill it
      const finalJobTitle = jobTitle;

      const result = await teamService.inviteMember(
        email,
        role,
        department || undefined,
        finalJobTitle || undefined,
      );

      toast.success("Convite criado com sucesso!");

      // Generate invite link to copy
      const token = result.inviteToken || result.invite?.token;
      if (token) {
        const link = `${window.location.origin}/invite/${token}`;
        setGeneratedLink(link);
      } else {
        onSuccess();
        onOpenChange(false);
      }

      setEmail("");
      setDepartment("");
      setJobTitle("");
      setRole("team");
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar convite.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast.success("Link copiado para a área de transferência!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        onOpenChange(val);
        if (!val) {
          setGeneratedLink(null);
        }
      }}
    >
      <DialogContent className="bg-background border-border sm:max-w-md">
        {generatedLink ? (
          <div className="space-y-4 py-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/20 text-success">
              <Check className="h-6 w-6" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-center">Convite Criado!</DialogTitle>
              <DialogDescription className="text-center">
                O convite foi registrado no sistema. Envie o link abaixo para o novo membro realizar
                o cadastro:
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-2 mt-4">
              <Input
                value={generatedLink}
                readOnly
                className="bg-secondary/30 text-xs font-mono select-all h-9"
              />
              <Button size="icon" onClick={handleCopy} className="h-9 w-9 shrink-0">
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <DialogFooter className="sm:justify-center mt-6">
              <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                Fechar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Convidar Membro</DialogTitle>
              <DialogDescription>
                Envie um convite para um novo membro ingressar na sua agência.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">E-mail do Membro</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="membro@agencia.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nível de Acesso</Label>
                  <Select value={role} onValueChange={(v: any) => setRole(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="team">Team (Membro)</SelectItem>
                      <SelectItem value="manager">Manager (Gestor)</SelectItem>
                      <SelectItem value="admin">Admin (Administrador)</SelectItem>
                      <SelectItem value="client">Client (Cliente)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invite-department">Departamento</Label>
                  <Input
                    id="invite-department"
                    placeholder="Ex: Comercial, Tráfego"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-title">Cargo / Função</Label>
                <Select value={jobTitle} onValueChange={setJobTitle}>
                  <SelectTrigger id="invite-title">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Atendimento">Atendimento</SelectItem>
                    <SelectItem value="Gestor de Projeto">Gestor de Projeto</SelectItem>
                    <SelectItem value="Gestor de Tráfego">Gestor de Tráfego</SelectItem>
                    <SelectItem value="Designer">Designer</SelectItem>
                    <SelectItem value="Copywriter">Copywriter</SelectItem>
                    <SelectItem value="Social Media">Social Media</SelectItem>
                    <SelectItem value="Editor de Vídeo">Editor de Vídeo</SelectItem>
                    <SelectItem value="Desenvolvedor">Desenvolvedor</SelectItem>
                    <SelectItem value="Financeiro">Financeiro</SelectItem>
                    {roles
                      .filter(
                        (r) =>
                          ![
                            "Atendimento",
                            "Gestor de Projeto",
                            "Gestor de Tráfego",
                            "Designer",
                            "Copywriter",
                            "Social Media",
                            "Editor de Vídeo",
                            "Desenvolvedor",
                            "Financeiro",
                          ].includes(r.name),
                      )
                      .map((r) => (
                        <SelectItem key={r.id} value={r.name}>
                          {r.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {!jobTitle && (
                  <Input
                    placeholder="Ou digite um cargo customizado..."
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="mt-1 h-8 text-xs"
                  />
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancelar
              </Button>
              <Button onClick={handleInvite} disabled={isLoading} className="w-[120px]">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar Convite"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
