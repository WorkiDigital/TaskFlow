import { TemplateAutomation } from "@/data/templateTypes";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/GlassCard";
import { mockContracts } from "@/lib/mock-data";
import { Zap, Play, CheckSquare, Bell, UserCheck, ShieldAlert } from "lucide-react";

interface TemplateAutomationSettingsProps {
  automation: TemplateAutomation;
  onChange: (automation: TemplateAutomation) => void;
  linkedContractTitle: string | undefined;
  onLinkedContractChange: (title: string | undefined) => void;
}

export function TemplateAutomationSettings({
  automation,
  onChange,
  linkedContractTitle,
  onLinkedContractChange,
}: TemplateAutomationSettingsProps) {
  const handleToggleMaster = (checked: boolean) => {
    onChange({ ...automation, enabled: checked });
  };

  const handleToggleAction = (
    key: keyof Omit<TemplateAutomation, "enabled" | "trigger">,
    checked: boolean,
  ) => {
    onChange({ ...automation, [key]: checked });
  };

  const handleTriggerChange = (trigger: TemplateAutomation["trigger"]) => {
    onChange({ ...automation, trigger });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-foreground">Automações do Template</h3>
        <p className="text-xs text-muted-foreground">
          Configure as regras para criação automatizada de projetos a partir deste modelo.
        </p>
      </div>

      {/* Master Toggle */}
      <GlassCard className="p-4 border border-border/40 hover:border-border/80 transition-colors flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl border ${automation.enabled ? "bg-primary/10 border-primary/30 text-primary" : "bg-background/40 border-border text-muted-foreground"}`}
          >
            <Zap className="h-5 w-5 fill-current" />
          </div>
          <div>
            <Label htmlFor="automation-enabled" className="text-sm font-semibold cursor-pointer">
              Ativar Autocriação
            </Label>
            <p className="text-xs text-muted-foreground">
              Quando ativado, o sistema criará projetos automaticamente com base nos gatilhos
              definidos.
            </p>
          </div>
        </div>
        <Switch
          id="automation-enabled"
          checked={automation.enabled}
          onCheckedChange={handleToggleMaster}
        />
      </GlassCard>

      {automation.enabled && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left panel: Trigger & Linked Contract */}
          <div className="space-y-4">
            <GlassCard className="p-4 border border-border/30 bg-background/25 space-y-4">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Play className="h-4 w-4 text-primary fill-current" />
                Gatilho de Disparo
              </h4>

              <div className="space-y-2">
                <Label className="text-xs">Gatilho de Criação</Label>
                <select
                  value={automation.trigger}
                  onChange={(e) => handleTriggerChange(e.target.value as any)}
                  className="w-full rounded-lg border border-border bg-background/50 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="contract_signed">Contrato Assinado pelo Cliente</option>
                  <option value="briefing_completed">Formulário de Briefing Concluído</option>
                  <option value="client_created">Novo Cliente Cadastrado</option>
                  <option value="manual">Apenas Acionamento Manual</option>
                </select>
              </div>

              {automation.trigger === "contract_signed" && (
                <div className="space-y-2">
                  <Label className="text-xs">Vincular a qual Modelo de Contrato?</Label>
                  <select
                    value={linkedContractTitle || ""}
                    onChange={(e) => onLinkedContractChange(e.target.value || undefined)}
                    className="w-full rounded-lg border border-border bg-background/50 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- Nenhum contrato vinculado --</option>
                    {/* Render unique titles of mock contracts */}
                    {Array.from(new Set(mockContracts.map((c) => c.title))).map((title) => (
                      <option key={title} value={title}>
                        {title}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-muted-foreground">
                    Quando o contrato com este título for assinado eletronicamente via Autentique,
                    este template de projeto será executado automaticamente.
                  </p>
                </div>
              )}
            </GlassCard>

            {/* Automation Summary Statement */}
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary space-y-1.5">
              <span className="font-semibold block">Resumo do Fluxo Automatizado:</span>
              <p className="leading-relaxed">
                {automation.trigger === "contract_signed" && linkedContractTitle ? (
                  <span>
                    Quando um contrato intitulado <strong>"{linkedContractTitle}"</strong> for
                    assinado, o sistema vai criar um projeto <strong>automaticamente</strong> com
                    todas as colunas e tarefas deste template.
                  </span>
                ) : automation.trigger === "briefing_completed" ? (
                  <span>
                    Quando o formulário de briefing for respondido pelo cliente, o sistema criará o
                    projeto correspondente baseado neste modelo.
                  </span>
                ) : automation.trigger === "client_created" ? (
                  <span>
                    Assim que um cliente for cadastrado no sistema, este modelo de projeto será
                    executado e atribuído a ele.
                  </span>
                ) : (
                  <span>
                    O projeto deverá ser aplicado <strong>manualmente</strong> a partir da lista de
                    templates ou da tela de projetos.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Right panel: Actions checklist */}
          <div className="space-y-4">
            <GlassCard className="p-4 border border-border/30 bg-background/25 space-y-4">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-primary" />
                Ações a Executar
              </h4>

              <div className="space-y-4">
                {/* Create Project Toggle */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium">Criar Projeto Kanban</Label>
                    <p className="text-[10px] text-muted-foreground">
                      Cria uma nova área de workspace Kanban para o cliente.
                    </p>
                  </div>
                  <Switch
                    checked={automation.createProject}
                    onCheckedChange={(checked) => handleToggleAction("createProject", checked)}
                  />
                </div>

                {/* Create Tasks Toggle */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium">Gerar Grade de Tarefas</Label>
                    <p className="text-[10px] text-muted-foreground">
                      Adiciona todas as tarefas configuradas nas respectivas colunas.
                    </p>
                  </div>
                  <Switch
                    checked={automation.createTasks}
                    onCheckedChange={(checked) => handleToggleAction("createTasks", checked)}
                  />
                </div>

                {/* Assign Users Toggle */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium">Atribuir Responsáveis</Label>
                    <p className="text-[10px] text-muted-foreground">
                      Aloca as pessoas e cargos conforme regras do template.
                    </p>
                  </div>
                  <Switch
                    checked={automation.assignUsers}
                    onCheckedChange={(checked) => handleToggleAction("assignUsers", checked)}
                  />
                </div>

                {/* Notify Group Toggle */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium">Notificar Equipe</Label>
                    <p className="text-[10px] text-muted-foreground">
                      Envia avisos no painel e WhatsApp do grupo de agência.
                    </p>
                  </div>
                  <Switch
                    checked={automation.notifyInternalGroup}
                    onCheckedChange={(checked) =>
                      handleToggleAction("notifyInternalGroup", checked)
                    }
                  />
                </div>

                {/* Require Manual Review Toggle */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5 border-t border-border/30 pt-3 flex items-start gap-2 w-full">
                    <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <Label className="text-xs font-semibold text-amber-500">
                        Exigir Revisão Manual
                      </Label>
                      <p className="text-[10px] text-muted-foreground">
                        O projeto é criado no status "Planejamento" aguardando aprovação humana.
                      </p>
                    </div>
                  </div>
                  <Switch
                    className="mt-3"
                    checked={automation.requireManualReview}
                    onCheckedChange={(checked) =>
                      handleToggleAction("requireManualReview", checked)
                    }
                  />
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
