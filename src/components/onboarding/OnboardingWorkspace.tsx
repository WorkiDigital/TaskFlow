import { Rocket, Workflow, FileText, Hash, MessageSquare, Play } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { FlowsTab } from './FlowsTab';
import { FormsTab } from './FormsTab';
import { VariablesTab } from './VariablesTab';
import { MessagesTab } from './MessagesTab';
import { SimulationTab } from './SimulationTab';
import { useOnboardingWorkspace } from '@/hooks/useOnboardingWorkspace';

const TABS = [
  { value: 'flows', label: 'Fluxos', icon: Workflow, short: 'Fluxos' },
  { value: 'forms', label: 'Formulários', icon: FileText, short: 'Forms' },
  { value: 'variables', label: 'Variáveis', icon: Hash, short: 'Vars' },
  { value: 'messages', label: 'Mensagens', icon: MessageSquare, short: 'Msgs' },
  { value: 'simulation', label: 'Simulação', icon: Play, short: 'Sim.' },
] as const;

type TabValue = typeof TABS[number]['value'];

export function OnboardingWorkspace() {
  const {
    state,
    isSyncing,
    toggleStep,
    updateStep,
    saveFormTemplate,
    duplicateFormTemplate,
    deleteFormTemplate,
    setDefaultForm,
    addVariable,
    updateVariable,
    deleteVariable,
    updateMessage,
  } = useOnboardingWorkspace();

  const enabledSteps = state.flowSteps.filter(s => s.enabled).length;
  const configuredSteps = state.flowSteps.filter(s => s.status === 'configured').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full px-4 py-6 md:px-8 md:py-8">
      {/* ─── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[var(--shadow-glow)]">
              <Rocket className="w-4 h-4 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">Onboarding</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure formulários, variáveis, mensagens e automações do fluxo de boas-vindas.
            {isSyncing ? ' Sincronizando...' : ' Sincronizado com Supabase.'}
          </p>
        </div>

        {/* Métricas rápidas do header */}
        <div className="flex gap-3 shrink-0">
          {[
            { label: 'Etapas ativas', value: enabledSteps, of: state.flowSteps.length, color: 'text-primary' },
            { label: 'Formulários', value: state.formTemplates.length, color: 'text-accent' },
            { label: 'Variáveis', value: state.variables.length, color: 'text-success' },
          ].map(m => (
            <div key={m.label} className="glass-card px-3 py-2 text-center min-w-[72px]">
              <p className={cn('text-xl font-bold', m.color)}>
                {m.value}
                {m.of !== undefined && <span className="text-xs text-muted-foreground font-normal">/{m.of}</span>}
              </p>
              <p className="text-[10px] text-muted-foreground font-medium">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Tabs ─────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="flows" className="space-y-5">
        {/* Tab List com scroll horizontal no mobile */}
        <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="glass-panel inline-flex min-w-max w-full sm:w-auto gap-0.5 h-11">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    'gap-2 h-9 px-4 text-sm font-medium transition-all',
                    'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow',
                    'data-[state=inactive]:text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.short}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* ─── Aba: Fluxos ─────────────────────────────────────────────── */}
        <TabsContent value="flows">
          <FlowsTab
            steps={state.flowSteps}
            onToggle={toggleStep}
            onUpdate={updateStep}
          />
        </TabsContent>

        {/* ─── Aba: Formulários ────────────────────────────────────────── */}
        <TabsContent value="forms">
          <FormsTab
            templates={state.formTemplates}
            variables={state.variables}
            onSave={saveFormTemplate}
            onDuplicate={duplicateFormTemplate}
            onDelete={deleteFormTemplate}
            onSetDefault={setDefaultForm}
          />
        </TabsContent>

        {/* ─── Aba: Variáveis ──────────────────────────────────────────── */}
        <TabsContent value="variables">
          <VariablesTab
            variables={state.variables}
            onAdd={addVariable}
            onUpdate={updateVariable}
            onDelete={deleteVariable}
          />
        </TabsContent>

        {/* ─── Aba: Mensagens ──────────────────────────────────────────── */}
        <TabsContent value="messages">
          <MessagesTab
            messages={state.messages}
            variables={state.variables}
            onUpdate={updateMessage}
          />
        </TabsContent>

        {/* ─── Aba: Simulação ──────────────────────────────────────────── */}
        <TabsContent value="simulation">
          <SimulationTab steps={state.flowSteps} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
