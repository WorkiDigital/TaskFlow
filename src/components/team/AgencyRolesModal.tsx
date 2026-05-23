import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { teamService, AgencyRole } from "@/services/teamService";
import { toast } from "sonner";
import { Loader2, Trash2, Edit2, Plus, Shield, Check } from "lucide-react";

interface AgencyRolesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PERMISSION_KEYS = [
  { key: "manage_agency_settings", label: "Configurações da Agência", desc: "Permite alterar nome, logo e dados gerais" },
  { key: "manage_integrations", label: "Integrações", desc: "Configurar APIs (Autentique, WhatsApp, etc)" },
  { key: "manage_team", label: "Gerenciar Equipe", desc: "Convidar, editar e suspender membros da equipe" },
  { key: "manage_clients", label: "Gerenciar Clientes", desc: "Criar, editar e excluir clientes" },
  { key: "manage_contracts", label: "Gerenciar Contratos", desc: "Criar e enviar contratos de serviços" },
  { key: "manage_onboarding", label: "Gerenciar Onboarding", desc: "Configurar e acompanhar etapas de onboarding" },
  { key: "manage_automations", label: "Gerenciar Automações", desc: "Criar e editar fluxos e gatilhos automatizados" },
  { key: "manage_templates", label: "Gerenciar Templates", desc: "Gerenciar templates de projetos e tarefas" },
  { key: "manage_projects", label: "Gerenciar Projetos", desc: "Criar projetos, colunas e gerenciar kanban geral" },
  { key: "create_tasks", label: "Criar Tarefas", desc: "Criar novas tarefas nos projetos em que atua" },
  { key: "assign_tasks", label: "Atribuir Tarefas", desc: "Definir responsáveis para as tarefas" },
  { key: "approve_agent_actions", label: "Aprovar Ações do Agente", desc: "Aprovar sugestões de ações do Agente Operacional" },
  { key: "execute_agent_actions", label: "Executar Ações do Agente", desc: "Permitir que o agente execute tarefas automaticamente" },
  { key: "view_all_projects", label: "Ver Todos os Projetos", desc: "Ver projetos mesmo sem estar atribuído" },
  { key: "view_dashboard", label: "Visualizar Dashboard", desc: "Acesso aos gráficos e métricas de desempenho" }
];

export function AgencyRolesModal({ open, onOpenChange }: AgencyRolesModalProps) {
  const [roles, setRoles] = useState<AgencyRole[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});

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
      setIsEditing(null);
      setNewRoleName("");
      resetPermissions();
    }
  }, [open]);

  const resetPermissions = () => {
    const defaultPerms: Record<string, boolean> = {};
    PERMISSION_KEYS.forEach(p => {
      defaultPerms[p.key] = false;
    });
    setPermissions(defaultPerms);
  };

  const handleSaveRole = async () => {
    if (!newRoleName.trim()) return;
    
    setIsLoading(true);
    try {
      if (isEditing) {
        await teamService.updateAgencyRole(isEditing, newRoleName, permissions);
        toast.success("Cargo e permissões atualizados.");
      } else {
        await teamService.createAgencyRole(newRoleName, permissions);
        toast.success("Cargo criado com sucesso.");
      }
      setNewRoleName("");
      setIsEditing(null);
      resetPermissions();
      loadRoles();
    } catch (error) {
      toast.error("Erro ao salvar cargo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este cargo? Os usuários vinculados ficarão sem cargo customizado.")) return;
    
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
    
    const rolePerms = { ...role.permissions };
    // Ensure all keys are present
    PERMISSION_KEYS.forEach(p => {
      if (rolePerms[p.key] === undefined) {
        rolePerms[p.key] = false;
      }
    });
    setPermissions(rolePerms);
  };

  const togglePermission = (key: string, enabled: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [key]: enabled
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Gerenciar Cargos e Permissões da Agência
          </DialogTitle>
          <DialogDescription>
            Crie cargos customizados (ex: Gestor de Tráfego, Designer) e defina quais permissões cada um possui na plataforma.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Esquerda: Lista de cargos existentes e Novo cargo */}
          <div className="space-y-4">
            <div className="space-y-2 border-b border-border/40 pb-4">
              <Label htmlFor="role-name" className="text-sm font-semibold">
                {isEditing ? "Editar Cargo" : "Novo Cargo Customizado"}
              </Label>
              <div className="flex gap-2 mt-1">
                <Input 
                  id="role-name"
                  placeholder="Nome do cargo (ex: Copywriter)..." 
                  value={newRoleName}
                  onChange={e => setNewRoleName(e.target.value)}
                  className="h-9"
                />
                <Button onClick={handleSaveRole} disabled={isLoading || !newRoleName.trim()} className="h-9">
                  {isEditing ? "Salvar" : <Plus className="h-4 w-4" />}
                </Button>
                {isEditing && (
                  <Button variant="ghost" onClick={() => { setIsEditing(null); setNewRoleName(""); resetPermissions(); }} className="h-9">
                    X
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Cargos Existentes</Label>
              {isLoading && roles.length === 0 ? (
                <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : roles.length === 0 ? (
                <p className="text-sm text-muted-foreground italic bg-secondary/10 p-4 rounded-lg text-center">Nenhum cargo customizado criado.</p>
              ) : (
                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                  {roles.map(role => (
                    <div 
                      key={role.id} 
                      onClick={() => handleEdit(role)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        isEditing === role.id 
                          ? 'bg-primary/10 border-primary' 
                          : 'bg-secondary/10 border-border/40 hover:border-border/80'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{role.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {Object.values(role.permissions || {}).filter(Boolean).length} permissões ativas
                        </span>
                      </div>
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
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

          {/* Direita: Editor de Permissões para o cargo selecionado */}
          <div className="bg-secondary/10 border border-border/40 rounded-xl p-4 flex flex-col h-full min-h-[45vh]">
            <div className="border-b border-border/40 pb-3 mb-3 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold">Configurar Acessos</h4>
                <p className="text-[11px] text-muted-foreground">
                  {isEditing ? `Defina o que "${newRoleName}" pode fazer:` : "Selecione um cargo para gerenciar permissões."}
                </p>
              </div>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 max-h-[42vh] pr-1">
              {PERMISSION_KEYS.map(p => {
                const isEnabled = !!permissions[p.key];
                return (
                  <div key={p.key} className="flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-medium cursor-pointer" onClick={() => togglePermission(p.key, !isEnabled)}>
                        {p.label}
                      </Label>
                      <p className="text-[10px] text-muted-foreground leading-snug">{p.desc}</p>
                    </div>
                    <Switch 
                      disabled={!isEditing && !newRoleName.trim()} 
                      checked={isEnabled} 
                      onCheckedChange={(checked) => togglePermission(p.key, checked)}
                      size="sm"
                    />
                  </div>
                );
              })}
            </div>

            {isEditing && (
              <div className="pt-3 border-t border-border/40 mt-3 flex justify-end">
                <Button size="sm" onClick={handleSaveRole} disabled={isLoading} className="gap-1 text-xs">
                  <Check className="h-3 w-3" /> Aplicar Permissões
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
