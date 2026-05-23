import { useEffect, useState, useCallback } from 'react';
import { Bot, RefreshCw, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AgentInsightCard } from './AgentInsightCard';
import { AgentSuggestedAction } from './AgentSuggestedAction';
import { AgentApprovalDialog } from './AgentApprovalDialog';
import { AgentExecutionLog } from './AgentExecutionLog';
import {
  agentService,
  type AgentContext,
  type AgentInsight,
  type AgentAction,
  type AgentExecutionLog as LogEntry,
  type AgentProvider,
} from '@/services/agentService';

const contextLabel: Record<AgentContext, string> = {
  dashboard: 'Visão geral',
  projects: 'Projetos',
  templates: 'Templates',
  automations: 'Automações',
  contracts: 'Contratos',
  onboarding: 'Onboarding',
};

const providerLabel: Record<AgentProvider, string> = {
  claude: '✦ Claude',
  gpt: '⬡ GPT-4o',
  gemini: '◈ Gemini',
};

interface OperationalAgentPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: AgentContext;
}

export function OperationalAgentPanel({ open, onOpenChange, context }: OperationalAgentPanelProps) {
  const [insights, setInsights] = useState<AgentInsight[]>([]);
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [provider, setProvider] = useState<AgentProvider>('claude');
  const [activeTab, setActiveTab] = useState<string>('insights');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<AgentAction | null>(null);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const loadInsights = useCallback(async () => {
    try {
      const data = await agentService.getInsights(context);
      setInsights(data);
    } catch (err) {
      console.error('[OperationalAgent] Erro ao carregar insights:', err);
    }
  }, [context]);

  const loadActions = useCallback(async () => {
    try {
      const data = await agentService.getActions(context);
      setActions(data);
    } catch (err) {
      console.error('[OperationalAgent] Erro ao carregar ações:', err);
    }
  }, [context]);

  const loadLogs = useCallback(async () => {
    try {
      const data = await agentService.getRecentLogs(30);
      setLogs(data);
    } catch (err) {
      console.error('[OperationalAgent] Erro ao carregar logs:', err);
    }
  }, []);

  const loadProvider = useCallback(async () => {
    try {
      const config = await agentService.getProviderConfig();
      setProvider(config.provider);
    } catch {
      // silently use default
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    loadInsights();
    loadActions();
    loadLogs();
    loadProvider();
  }, [open, context, loadInsights, loadActions, loadLogs, loadProvider]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const result = await agentService.generateInsights(context);
      setInsights(result.insights);
      setProvider(result.provider);
      toast.success(`${result.insights.length} insight(s) gerado(s) via ${providerLabel[result.provider]}`);
      console.log('[OperationalAgent] Análise concluída:', result.logs);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao analisar';
      toast.error(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSuggestActions = async (insight: AgentInsight) => {
    setIsSuggesting(true);
    try {
      const result = await agentService.suggestActions(context);
      setActions(result.actions);
      setActiveTab('actions');
      toast.success(`${result.actions.length} ação(ões) sugerida(s)`);
      console.log('[AgentInsights] Sugestões geradas:', result.logs);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao gerar sugestões';
      toast.error(msg);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleDismissInsight = async (id: string) => {
    try {
      await agentService.dismissInsight(id);
      setInsights((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      toast.error('Erro ao descartar insight');
    }
  };

  const handleApproveAction = async (id: string) => {
    setApprovingId(id);
    try {
      const updated = await agentService.approveAction(id);
      setActions((prev) => prev.map((a) => (a.id === id ? updated : a)));
      toast.success('Ação aprovada. Clique em "Ver detalhes" para executar.');
      console.log('[AgentApproval] Ação aprovada:', id);
    } catch (err) {
      toast.error('Erro ao aprovar ação');
    } finally {
      setApprovingId(null);
    }
  };

  const handleDismissAction = async (id: string) => {
    try {
      await agentService.dismissAction(id);
      setActions((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      toast.error('Erro ao descartar ação');
    }
  };

  const handleViewPreview = (action: AgentAction) => {
    setSelectedAction(action);
    setApprovalOpen(true);
    console.log('[AgentActionPreview] Abrindo preview para ação:', action.id);
  };

  const handleConfirmExecute = async (actionId: string) => {
    setIsExecuting(true);
    try {
      const result = await agentService.executeApprovedAction(actionId);
      setActions((prev) => prev.filter((a) => a.id !== actionId));
      setApprovalOpen(false);
      setSelectedAction(null);
      await loadLogs();
      await loadInsights();
      toast.success('Ação executada com sucesso!');
      console.log('[AgentApproval] Execução concluída:', result.logs);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao executar ação';
      toast.error(msg);
    } finally {
      setIsExecuting(false);
    }
  };

  const pendingCount = actions.filter((a) => a.status === 'pending').length;
  const approvedCount = actions.filter((a) => a.status === 'approved').length;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl border-l border-white/10 bg-slate-950/95 backdrop-blur-xl p-0 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 pb-4 border-b border-white/10 shrink-0">
            <SheetHeader className="text-left space-y-1">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <SheetTitle className="text-base font-semibold">Agente Operacional</SheetTitle>
                <span className="inline-flex items-center rounded-full border border-white/10 px-2 py-0.5 text-xs text-muted-foreground">
                  {providerLabel[provider]}
                </span>
              </div>
              <SheetDescription className="text-xs">
                Contexto: {contextLabel[context]}
              </SheetDescription>
            </SheetHeader>

            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs border-white/10 shrink-0 mt-1"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <><RefreshCw className="h-3.5 w-3.5 mr-1.5" />Analisar</>
              )}
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="shrink-0 mx-6 mt-4 mb-2 grid grid-cols-3 bg-white/5 border border-white/10">
              <TabsTrigger value="insights" className="text-xs relative">
                Insights
                {insights.length > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                    {insights.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="actions" className="text-xs relative">
                Ações
                {(pendingCount + approvedCount) > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-warning text-black text-[10px] font-bold">
                    {pendingCount + approvedCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="logs" className="text-xs">
                Histórico
              </TabsTrigger>
            </TabsList>

            {/* Insights Tab */}
            <TabsContent value="insights" className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar mt-0">
              {insights.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Sparkles className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground text-center">
                    Nenhum insight ainda.
                  </p>
                  <p className="text-xs text-muted-foreground/60 text-center max-w-48">
                    Clique em "Analisar" para que o agente avalie a operação e gere recomendações.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 border-white/10 text-xs"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <><Bot className="h-3.5 w-3.5 mr-1.5" />Analisar agora</>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {insights.map((insight) => (
                    <AgentInsightCard
                      key={insight.id}
                      insight={insight}
                      onDismiss={handleDismissInsight}
                      onSuggestActions={handleSuggestActions}
                      isLoadingSuggestions={isSuggesting}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Actions Tab */}
            <TabsContent value="actions" className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar mt-0">
              {actions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Sparkles className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground text-center">
                    Nenhuma ação sugerida.
                  </p>
                  <p className="text-xs text-muted-foreground/60 text-center max-w-52">
                    Gere insights primeiro e depois clique em "Sugerir ações" em um insight.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {actions.map((action) => (
                    <AgentSuggestedAction
                      key={action.id}
                      action={action}
                      onApprove={handleApproveAction}
                      onDismiss={handleDismissAction}
                      onViewPreview={handleViewPreview}
                      isApproving={approvingId === action.id}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Logs Tab */}
            <TabsContent value="logs" className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar mt-0">
              <div className="pt-2">
                <AgentExecutionLog logs={logs} />
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <AgentApprovalDialog
        action={selectedAction}
        isOpen={approvalOpen}
        onOpenChange={setApprovalOpen}
        onConfirm={handleConfirmExecute}
        isExecuting={isExecuting}
      />
    </>
  );
}
