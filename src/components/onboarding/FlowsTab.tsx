import { useState } from 'react';
import { Settings2, GripVertical, ChevronUp, ChevronDown, Check, Zap, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { OnboardingFlowStep } from '@/data/onboardingTypes';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useOnboardingWorkspace } from '@/hooks/useOnboardingWorkspace';
import { GroupSelector } from './GroupSelector';

interface FlowsTabProps {
  steps: OnboardingFlowStep[];
  onToggle: (id: string, enabled: boolean) => void;
  onUpdate: (id: string, patch: Partial<OnboardingFlowStep>) => void;
}

export function FlowsTab({ steps, onToggle, onUpdate }: FlowsTabProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ name: string; description: string }>({ name: '', description: '' });
  
  const { reorderStep, applyTemplateMode } = useOnboardingWorkspace();

  const handleEdit = (step: OnboardingFlowStep) => {
    setEditingId(step.id);
    setEditValues({ name: step.name, description: step.description });
  };

  const handleSave = () => {
    if (editingId) {
      onUpdate(editingId, editValues);
      setEditingId(null);
    }
  };

  const checkDependencyError = (step: OnboardingFlowStep) => {
    if (!step.enabled || !step.dependsOn || step.dependsOn.length === 0) return false;
    for (const depId of step.dependsOn) {
      const depStep = steps.find(s => s.id === depId);
      if (!depStep) continue;
      if (!depStep.enabled) return true; // Error se dependência está desligada
      if (depStep.order >= step.order) return true; // Error se dependência vem depois
    }
    return false;
  };

  const editingStep = steps.find(s => s.id === editingId);

  const getStepConfigSummary = (step: OnboardingFlowStep) => {
    if (step.id === 'create_whatsapp_group' && Array.isArray(step.config?.participants)) {
      const count = step.config.participants.length;
      if (count > 0) return `${count} gestor${count === 1 ? '' : 'es'} configurado${count === 1 ? '' : 's'}`;
    }

    if (step.id === 'notify_internal_group' && typeof step.config?.internalGroupName === 'string' && step.config.internalGroupName) {
      return `Grupo: ${step.config.internalGroupName}`;
    }

    return null;
  };

  return (
    <div className="space-y-4">
      {/* Header com Modos Rápidos */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-4">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Zap className="w-4 h-4 text-warning" />
            Modos de Automação
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Escolha um template rápido para ligar/desligar as etapas em lote.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none text-xs border-primary/30 hover:bg-primary/10" onClick={() => applyTemplateMode('complete')}>
            Completo
          </Button>
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none text-xs border-success/30 hover:bg-success/10" onClick={() => applyTemplateMode('whatsapp_only')}>
            Somente WhatsApp
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {steps.sort((a, b) => a.order - b.order).map((step, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === steps.length - 1;
          const hasDependencyError = checkDependencyError(step);
          const configSummary = getStepConfigSummary(step);

          return (
            <div
              key={step.id}
              className={cn(
                'group relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-300',
                step.enabled
                  ? 'bg-white/5 border-border hover:border-white/10'
                  : 'bg-white/3 border-transparent opacity-60 grayscale hover:grayscale-0'
              )}
            >
              {/* Controles de reordenação */}
              <div className="flex flex-col items-center justify-center w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  disabled={isFirst}
                  onClick={() => reorderStep(step.id, 'up')}
                  className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={isLast}
                  onClick={() => reorderStep(step.id, 'down')}
                  className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Ícone */}
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 transition-all duration-300',
                step.enabled ? 'bg-primary/10 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]' : 'bg-white/5'
              )}>
                {step.icon}
              </div>

              {/* Info principal */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className={cn('font-medium text-sm truncate', step.enabled ? 'text-foreground' : 'text-muted-foreground')}>
                    {step.name}
                  </p>
                  {hasDependencyError && (
                    <Badge variant="outline" className="text-[10px] px-1.5 bg-warning/10 text-warning border-warning/20 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Lógica Inválida
                    </Badge>
                  )}
                  {step.status === 'configured' && step.enabled && !hasDependencyError && (
                    <Badge variant="outline" className="text-[10px] px-1.5 border-success/30 text-success bg-success/5 gap-1">
                      <Check className="w-2.5 h-2.5" />
                      Configurado
                    </Badge>
                  )}
                  {step.status === 'pending' && step.enabled && !hasDependencyError && (
                    <Badge variant="outline" className="text-[10px] px-1.5 border-warning/30 text-warning bg-warning/5">
                      Pendente
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{step.description}</p>
                {configSummary && (
                  <p className="text-[10px] text-primary mt-1 truncate">{configSummary}</p>
                )}
                {hasDependencyError && (
                  <p className="text-[10px] text-warning mt-1">
                    Esta etapa depende de uma etapa anterior que está desativada ou fora de ordem.
                  </p>
                )}
              </div>

              {/* Ações */}
              <div className="flex items-center gap-3 shrink-0">
                {step.enabled && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleEdit(step)}
                  >
                    <Settings2 className="w-4 h-4" />
                    Configurar
                  </Button>
                )}
                <Switch
                  checked={step.enabled}
                  onCheckedChange={(checked) => onToggle(step.id, checked)}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Sheet de Edição */}
      <Sheet open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
        <SheetContent className="bg-background border-border sm:max-w-xl p-0 flex flex-col w-full h-full">
          {editingStep?.id === 'create_whatsapp_group' ? (
            <GroupSelector 
              type="client" 
              initialConfig={editingStep.config}
              onSave={(config) => {
                onUpdate('create_whatsapp_group', { status: 'configured', config });
                setEditingId(null);
                console.log('Saved group config', config);
              }} 
              onCancel={() => setEditingId(null)} 
            />
          ) : editingStep?.id === 'notify_internal_group' ? (
            <GroupSelector 
              type="internal" 
              initialConfig={editingStep.config}
              onSave={(config) => {
                onUpdate('notify_internal_group', { status: 'configured', config });
                setEditingId(null);
                console.log('Saved internal group config', config);
              }} 
              onCancel={() => setEditingId(null)} 
            />
          ) : (
            <>
              <div className="p-6">
                <SheetHeader>
                  <SheetTitle>Configurar Etapa</SheetTitle>
                  <SheetDescription>
                    Ajuste o comportamento desta etapa da automação de onboarding.
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-6 mt-6">
                  <div className="space-y-2">
                    <Label>Nome da etapa</Label>
                    <Input
                      value={editValues.name}
                      onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={editValues.description}
                      onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                      className="resize-none h-24"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-auto p-6 border-t border-border bg-white/3 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setEditingId(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
                  Salvar
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
