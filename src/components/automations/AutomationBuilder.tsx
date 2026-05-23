import { useState, useEffect } from "react";
import { AutomationFlow, AutomationMode, AutomationStepType } from "@/data/mockAutomations";
import { AutomationModeSelector } from "./AutomationModeSelector";
import { AutomationStepCard } from "./AutomationStepCard";
import { MessageTemplateEditor } from "./MessageTemplateEditor";
import { GroupSelector } from "./GroupSelector";
import { FormBuilder } from "./FormBuilder";
import { VariableManager } from "./VariableManager";
import { AutomationSimulationPanel } from "./AutomationSimulationPanel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Save, Play, Database } from "lucide-react";

interface AutomationBuilderProps {
  flow: AutomationFlow;
  onSave: (flow: AutomationFlow) => void;
  onClose: () => void;
}

export function AutomationBuilder({ flow: initialFlow, onSave, onClose }: AutomationBuilderProps) {
  const [flow, setFlow] = useState<AutomationFlow>(initialFlow);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [isVarManagerOpen, setIsVarManagerOpen] = useState(false);
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false);

  useEffect(() => {
    const checkWhatsApp = () => {
      const saved = localStorage.getItem('mock_whatsapp_status');
      if (saved) {
        try {
          const status = JSON.parse(saved).status;
          setIsWhatsAppConnected(status === 'connected');
        } catch (e) {}
      }
    };
    checkWhatsApp();
    
    const handler = () => checkWhatsApp();
    window.addEventListener('whatsapp_status_changed', handler);
    return () => window.removeEventListener('whatsapp_status_changed', handler);
  }, []);

  const handleModeChange = (mode: AutomationMode) => {
    // In a real app, this would toggle specific steps based on the mode
    // For now, we just update the mode
    setFlow(prev => ({ ...prev, mode }));
  };

  const handleToggleStep = (stepId: string, enabled: boolean) => {
    setFlow(prev => ({
      ...prev,
      steps: prev.steps.map(s => s.id === stepId ? { ...s, enabled } : s)
    }));
  };

  const handleEditStep = (stepId: string) => {
    console.log('[AutomationBuilder] Edit step', stepId);
    setEditingStepId(stepId);
  };

  const handleSaveMessage = (config: any) => {
    if (!editingStepId) return;
    console.log('[AutomationBuilder] Saved config for step', editingStepId, config);
    
    // In a real app, we would save this to the step's specific configuration object.
    // For now, we'll mark the step as configured.
    setFlow(prev => ({
      ...prev,
      steps: prev.steps.map(s => 
        s.id === editingStepId 
          ? { ...s, configStatus: 'configured' } 
          : s
      )
    }));
    setEditingStepId(null);
  };

  const handleReorderStep = (stepId: string, direction: 'up' | 'down') => {
    setFlow(prev => {
      const sortedSteps = [...prev.steps].sort((a, b) => a.order - b.order);
      const index = sortedSteps.findIndex(s => s.id === stepId);
      
      if (direction === 'up' && index > 0) {
        // Swap orders
        const currentOrder = sortedSteps[index].order;
        sortedSteps[index].order = sortedSteps[index - 1].order;
        sortedSteps[index - 1].order = currentOrder;
      } else if (direction === 'down' && index < sortedSteps.length - 1) {
        // Swap orders
        const currentOrder = sortedSteps[index].order;
        sortedSteps[index].order = sortedSteps[index + 1].order;
        sortedSteps[index + 1].order = currentOrder;
      }
      
      return { ...prev, steps: sortedSteps };
    });
  };

  const checkDependencyError = (step: any) => {
    if (!step.dependsOn || step.dependsOn.length === 0) return false;
    
    // Check if any dependency is disabled or comes AFTER this step
    for (const depType of step.dependsOn) {
      const depStep = flow.steps.find(s => s.type === depType);
      if (!depStep) continue;
      if (!depStep.enabled) return true;
      if (depStep.order >= step.order) return true;
    }
    return false;
  };

  const checkWhatsAppDependency = (type: AutomationStepType) => {
    const whatsappSteps: AutomationStepType[] = [
      'create_client_whatsapp_group',
      'select_internal_agency_group',
      'add_group_participants',
      'update_group_description',
      'send_client_group_welcome',
      'mention_group_participants',
      'send_internal_agency_notification'
    ];
    return whatsappSteps.includes(type) && !isWhatsAppConnected;
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-background)]">
      <div className="shrink-0 p-6 border-b border-white/5 bg-black/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{flow.name}</h2>
          <p className="text-sm text-muted-foreground">Configurando o fluxo de execução das tarefas</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="outline" className="gap-2 border-white/10 bg-white/5 hover:bg-white/10" onClick={() => setIsVarManagerOpen(true)}>
            <Database className="w-4 h-4 text-blue-400" />
            Variáveis
          </Button>
          <Button variant="outline" className="gap-2 border-white/10 bg-white/5 hover:bg-white/10" onClick={() => setIsSimulationOpen(true)}>
            <Play className="w-4 h-4 text-emerald-400" />
            Simular Execução
          </Button>
          <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => onSave(flow)}>
            <Save className="w-4 h-4" />
            Salvar Fluxo
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full space-y-10">
        <section>
          <AutomationModeSelector 
            selectedMode={flow.mode} 
            onSelectMode={handleModeChange} 
          />
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-foreground">Etapas do Fluxo</h3>
              <p className="text-sm text-muted-foreground">Arraste para reordenar. Ative apenas o que faz sentido para este fluxo.</p>
            </div>
            <div className="text-xs font-medium bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-muted-foreground">
              {flow.steps.filter(s => s.enabled).length} etapas ativas
            </div>
          </div>

          <div className="space-y-3">
            {flow.steps.sort((a, b) => a.order - b.order).map((step, index, array) => (
              <AutomationStepCard 
                key={step.id} 
                step={step} 
                isFirst={index === 0}
                isLast={index === array.length - 1}
                onToggle={handleToggleStep}
                onEdit={handleEditStep}
                onReorder={handleReorderStep}
                hasDependencyError={checkDependencyError(step)}
                isBlockedByWhatsApp={checkWhatsAppDependency(step.type)}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Variable Manager Modal */}
      <Dialog open={isVarManagerOpen} onOpenChange={setIsVarManagerOpen}>
        <DialogContent className="max-w-5xl h-[80vh] p-0 border-white/10 bg-[var(--color-background)] overflow-hidden flex flex-col">
          <DialogTitle className="sr-only">Gerenciador de Variáveis</DialogTitle>
          <DialogDescription className="sr-only">Crie e edite variáveis dinâmicas do sistema.</DialogDescription>
          {isVarManagerOpen && (
            <VariableManager onClose={() => setIsVarManagerOpen(false)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Simulation Modal */}
      <Dialog open={isSimulationOpen} onOpenChange={setIsSimulationOpen}>
        <DialogContent className="max-w-6xl h-[85vh] p-0 border-white/10 bg-[var(--color-background)] overflow-hidden flex flex-col">
          <DialogTitle className="sr-only">Simulação do Fluxo</DialogTitle>
          <DialogDescription className="sr-only">Preview visual e simulação em terminal.</DialogDescription>
          {isSimulationOpen && (
            <AutomationSimulationPanel flow={flow} onClose={() => setIsSimulationOpen(false)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Editor Modal */}
      <Dialog open={!!editingStepId} onOpenChange={(open) => !open && setEditingStepId(null)}>
        <DialogContent className="max-w-5xl h-[80vh] p-0 border-white/10 bg-[var(--color-background)] overflow-hidden flex flex-col">
          <DialogTitle className="sr-only">Editar Configuração da Etapa</DialogTitle>
          <DialogDescription className="sr-only">Faça os ajustes necessários nesta etapa da automação.</DialogDescription>
          
          {editingStepId && (() => {
            const step = flow.steps.find(s => s.id === editingStepId);
            if (!step) return null;

            if (step.type === 'create_client_whatsapp_group') {
              return (
                <GroupSelector 
                  type="client"
                  onSave={handleSaveMessage} // Reuse same save handler to mark as configured
                  onCancel={() => setEditingStepId(null)}
                />
              );
            }

            if (step.type === 'select_internal_agency_group') {
              return (
                <GroupSelector 
                  type="internal"
                  onSave={handleSaveMessage}
                  onCancel={() => setEditingStepId(null)}
                />
              );
            }

            if (step.type === 'send_contract_form') {
              return (
                <FormBuilder 
                  mode="contract"
                  onSave={handleSaveMessage}
                  onCancel={() => setEditingStepId(null)}
                />
              );
            }

            if (step.type === 'send_briefing_form') {
              return (
                <FormBuilder 
                  mode="briefing"
                  onSave={handleSaveMessage}
                  onCancel={() => setEditingStepId(null)}
                />
              );
            }

            // Fallback for messaging steps
            return (
              <MessageTemplateEditor 
                initialMessage="Olá {{nome_cliente}}! Tudo bem? \n\nBem-vindo ao onboarding do seu novo projeto na {{nome_agencia}}."
                onSave={handleSaveMessage}
                onCancel={() => setEditingStepId(null)}
              />
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
