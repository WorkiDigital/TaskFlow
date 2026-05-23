import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Info, Settings2, BellRing, Phone, MessageSquare, Loader2, RefreshCw } from "lucide-react";
import { evolutionService } from "@/services/evolutionService";
import type { WhatsAppGroup } from "@/data/mockWhatsAppConnection";

interface GroupSelectorProps {
  type: 'client' | 'internal';
  onSave: (config: any) => void;
  onCancel: () => void;
  initialConfig?: any;
}

export function GroupSelector({ type, onSave, onCancel, initialConfig }: GroupSelectorProps) {
  const [createAutomatic, setCreateAutomatic] = useState(initialConfig?.createAutomatic ?? true);
  const [groupName, setGroupName] = useState(initialConfig?.groupName ?? "Projeto {{nome_projeto}}");
  const [participants, setParticipants] = useState(
    Array.isArray(initialConfig?.participants) ? initialConfig.participants.join(", ") : ""
  );
  const [description, setDescription] = useState(initialConfig?.description ?? "Grupo oficial de acompanhamento do projeto.");
  const [internalGroupId, setInternalGroupId] = useState(initialConfig?.internalGroupId ?? "");
  const [internalGroupName, setInternalGroupName] = useState(initialConfig?.internalGroupName ?? "");
  const [notifyEvents, setNotifyEvents] = useState(initialConfig?.notifyEvents ?? {
    onboardingStarted: true,
    contractSigned: true,
    briefingReceived: true,
    error: true,
  });
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);

  const loadGroups = async () => {
    if (type !== 'internal') return;

    setIsLoadingGroups(true);
    setGroupsError(null);
    try {
      const syncedGroups = await evolutionService.fetchGroups();
      setGroups(syncedGroups);
    } catch (error) {
      setGroupsError(error instanceof Error ? error.message : "Nao foi possivel carregar os grupos.");
    } finally {
      setIsLoadingGroups(false);
    }
  };

  useEffect(() => {
    void loadGroups();
  }, [type]);

  const handleSave = () => {
    if (type === 'client') {
      onSave({
        createAutomatic,
        groupName,
        participants: participants.split(',').map(p => p.trim()).filter(Boolean),
        description,
      });
    } else {
      const selectedGroup = groups.find(group => group.jid === internalGroupId);

      onSave({
        internalGroupId,
        internalGroupName: selectedGroup?.name ?? internalGroupName,
        notifyEvents,
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-background w-full overflow-y-auto">
      <div className="shrink-0 p-6 border-b border-border bg-white/3 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
          {type === 'client' ? <Users className="w-6 h-6 text-primary" /> : <BellRing className="w-6 h-6 text-warning" />}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            {type === 'client' ? 'Configurar Grupo do Cliente' : 'Configurar Grupo Interno (Agencia)'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {type === 'client'
              ? 'Defina como o grupo do cliente sera criado no WhatsApp via Evolution API.'
              : 'Defina o grupo da equipe para receber notificacoes de progresso.'}
          </p>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-8 max-w-3xl mx-auto w-full">
        {type === 'client' && (
          <div className="glass-card p-5 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base text-foreground font-semibold">Criacao Automatica</Label>
                <p className="text-xs text-muted-foreground mt-1">A Evolution API criara um novo grupo automaticamente.</p>
              </div>
              <Switch checked={createAutomatic} onCheckedChange={setCreateAutomatic} />
            </div>

            {createAutomatic && (
              <div className="space-y-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-muted-foreground" /> Nome do Grupo</Label>
                  <Input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Info className="w-3 h-3 text-primary" /> Voce pode usar variaveis como <code className="bg-primary/10 text-primary px-1 rounded">{'{{nome_projeto}}'}</code> no nome.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /> Adicionar Gestores (Agencia)</Label>
                  <Input
                    placeholder="Ex: 5511999999999, 5511888888888"
                    value={participants}
                    onChange={(e) => setParticipants(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground">Telefones com DDI separados por virgula. O cliente sera adicionado automaticamente.</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Settings2 className="w-4 h-4 text-muted-foreground" /> Descricao do Grupo (Bio)</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="resize-none min-h-[80px]"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {type === 'internal' && (
          <>
            <div className="glass-card p-5 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label>Grupo Interno da Agencia</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={loadGroups}
                    disabled={isLoadingGroups}
                    className="h-7 gap-1.5 text-xs"
                  >
                    {isLoadingGroups ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Recarregar
                  </Button>
                </div>
                <Select
                  value={internalGroupId}
                  onValueChange={(value) => {
                    const selectedGroup = groups.find(group => group.jid === value);
                    setInternalGroupId(value);
                    setInternalGroupName(selectedGroup?.name ?? "");
                  }}
                >
                  <SelectTrigger className="bg-black/20 border-white/10 focus:ring-primary">
                    <SelectValue placeholder={isLoadingGroups ? "Carregando grupos..." : "Selecione um grupo da instancia"} />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map(group => (
                      <SelectItem key={group.jid} value={group.jid}>
                        {group.name || group.jid} - {group.membersCount} membros
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {groupsError && (
                  <p className="text-[10px] text-destructive mt-2">{groupsError}</p>
                )}
                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-2">
                  <Info className="w-3 h-3 text-primary" />
                  Os grupos sao carregados diretamente da instancia conectada na Evolution API.
                </p>
              </div>
            </div>

            <div className="glass-card p-5 space-y-6">
              <div>
                <Label className="text-base text-foreground font-semibold">Eventos para Notificar</Label>
                <p className="text-xs text-muted-foreground mt-1">Quais eventos do fluxo devem mandar mensagem neste grupo?</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <Label className="text-sm font-normal text-muted-foreground cursor-pointer">Novo cliente iniciado no onboarding</Label>
                  <Switch checked={notifyEvents.onboardingStarted} onCheckedChange={(v) => setNotifyEvents(p => ({ ...p, onboardingStarted: v }))} />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <Label className="text-sm font-normal text-muted-foreground cursor-pointer">Contrato assinado pelo cliente</Label>
                  <Switch checked={notifyEvents.contractSigned} onCheckedChange={(v) => setNotifyEvents(p => ({ ...p, contractSigned: v }))} />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <Label className="text-sm font-normal text-muted-foreground cursor-pointer">Briefing preenchido</Label>
                  <Switch checked={notifyEvents.briefingReceived} onCheckedChange={(v) => setNotifyEvents(p => ({ ...p, briefingReceived: v }))} />
                </div>
                <div className="flex items-center justify-between py-2">
                  <Label className="text-sm font-normal text-destructive cursor-pointer">Erro ou falha tecnica na automacao</Label>
                  <Switch checked={notifyEvents.error} onCheckedChange={(v) => setNotifyEvents(p => ({ ...p, error: v }))} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="shrink-0 p-6 border-t border-border bg-white/3 flex justify-end gap-3 mt-auto">
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium" onClick={handleSave}>
          Salvar Configuracao
        </Button>
      </div>
    </div>
  );
}
