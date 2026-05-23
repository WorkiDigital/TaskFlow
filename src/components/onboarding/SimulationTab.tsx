import { useState, useRef, useEffect } from 'react';
import { Play, RotateCcw, ChevronRight, AlertCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { OnboardingFlowStep } from '@/data/onboardingTypes';
import type { SimulationLog, SimLogStatus } from '@/data/onboardingTypes';
import { IconRenderer } from '@/components/ui/IconRenderer';
import { onboardingService } from '@/services/onboardingService';
import { supabase } from '@/services/supabase';
import { toast } from 'sonner';

interface SimulationTabProps {
  steps: OnboardingFlowStep[];
}

const STATUS_CONFIG: Record<SimLogStatus, { label: string; icon: string; className: string }> = {
  waiting: { label: 'Aguardando', icon: '⏳', className: 'text-muted-foreground bg-white/5 border-border' },
  running: { label: 'Executando', icon: '⚡', className: 'text-primary bg-primary/10 border-primary/25 animate-pulse' },
  done: { label: 'Concluído', icon: '✅', className: 'text-success bg-success/10 border-success/20' },
  skipped: { label: 'Pulado', icon: '⏭️', className: 'text-muted-foreground bg-white/5 border-border line-through' },
  error: { label: 'Erro', icon: '❌', className: 'text-destructive bg-destructive/10 border-destructive/20' },
};

const STEP_LOGS: Record<string, string[]> = {
  send_contractual_form: ['Buscando dados do cliente...', 'Gerando link de formulário personalizado...', 'Enviando mensagem via WhatsApp...'],
  await_contractual_form: ['Aguardando webhook de confirmação...', 'Formulário recebido e validado!'],
  generate_contract: ['Buscando variáveis preenchidas...', 'Processando template do contrato...', 'Documento PDF gerado com sucesso.'],
  send_contract_signature: ['Enviando contrato para Autentique...', 'Coletando assinatura do signatário...'],
  create_whatsapp_group: ['Conectando à Evolution API...', 'Criando grupo: "Projeto {{nome_projeto}}"...', 'Grupo criado com ID: g.us/1234...'],
  add_participants: ['Adicionando gestores ao grupo...', 'Adicionando cliente ao grupo...', 'Todos os participantes adicionados.'],
  update_group_description: ['Atualizando descrição do grupo...', 'Descrição definida com sucesso.'],
  send_welcome_message: ['Processando mensagem de boas-vindas...', 'Inserindo variáveis dinâmicas...', 'Mensagem enviada com formatação WhatsApp.'],
  notify_internal_group: ['Notificando grupo interno da agência...', 'Mensagem entregue ao time.'],
  send_briefing_form: ['Gerando link de briefing...', 'Enviando mensagem de briefing ao cliente...'],
  await_briefing_form: ['Aguardando retorno do cliente...', 'Briefing preenchido e recebido!'],
  finalize_onboarding: ['Marcando onboarding como concluído...', 'Ativando projeto no sistema...', 'Onboarding finalizado com sucesso! 🎉'],
};

// Probabilidade de erro simulado por etapa (para mostrar resiliência)
const ERROR_STEPS = new Set(['send_contract_signature', 'create_whatsapp_group']);

export function SimulationTab({ steps }: SimulationTabProps) {
  const [logs, setLogs] = useState<SimulationLog[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [forceError, setForceError] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Real run state
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [realRunning, setRealRunning] = useState(false);
  const [realLogs, setRealLogs] = useState<string[]>([]);

  useEffect(() => {
    supabase.from('clients').select('id, name').order('name').then(({ data }) => {
      if (data) setClients(data);
    });
  }, []);

  const dispararReal = async () => {
    if (!selectedClientId) { toast.error('Selecione um cliente'); return; }
    setRealRunning(true);
    setRealLogs([]);
    try {
      const res = await onboardingService.startRun(selectedClientId);
      const lines: string[] = res.logs?.map((l: any) => `[${l.status}] ${l.step_name}: ${l.message}`) ?? [];
      lines.unshift(`► Run ID: ${res.runId} | Status: ${res.status}`);
      setRealLogs(lines);
      if (res.status === 'awaiting_form') toast.success('Fluxo pausado aguardando formulário');
      else if (res.status === 'completed') toast.success('Onboarding concluído!');
      else toast.info(`Status: ${res.status}`);
    } catch (e: any) {
      toast.error('Erro: ' + (e?.message ?? String(e)));
      setRealLogs([`ERRO: ${e?.message ?? String(e)}`]);
    } finally {
      setRealRunning(false);
    }
  };

  const activeSteps = steps.filter(s => s.enabled);
  const skippedSteps = steps.filter(s => !s.enabled);

  const scrollToEnd = () => {
    setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const reset = () => {
    setLogs([]);
    setRunning(false);
    setDone(false);
    console.log('[OnboardingSimulation] reset');
  };

  const runSimulation = async () => {
    if (running) return;
    reset();
    setRunning(true);
    console.log('[OnboardingSimulation] starting simulation with', activeSteps.length, 'active steps');

    for (let i = 0; i < activeSteps.length; i++) {
      const step = activeSteps[i];
      const stepLogs = STEP_LOGS[step.id] ?? ['Executando etapa...'];

      // Adiciona log "running"
      setLogs(prev => [...prev, {
        stepId: step.id,
        stepName: step.name,
        status: 'running',
        message: stepLogs[0],
        ts: Date.now(),
      }]);
      scrollToEnd();

      // Executa sub-logs com delay
      for (let li = 0; li < stepLogs.length; li++) {
        await delay(600 + Math.random() * 400);
        if (li > 0) {
          setLogs(prev => [...prev, {
            stepId: `${step.id}_sub_${li}`,
            stepName: step.name,
            status: 'running',
            message: `   ↳ ${stepLogs[li]}`,
            ts: Date.now(),
          }]);
          scrollToEnd();
        }
      }

      // Simula erro ocasional em algumas etapas
      const shouldError = forceError && ERROR_STEPS.has(step.id) && i < activeSteps.length - 1;

      if (shouldError) {
        await delay(400);
        setLogs(prev => prev.map(l =>
          l.stepId === step.id ? { ...l, status: 'error', message: `❌ Erro: timeout ao conectar à API externa. Tentando novamente...` } : l
        ));
        await delay(800);
        setLogs(prev => prev.map(l =>
          l.stepId === step.id ? { ...l, status: 'done', message: `${step.name} — concluído após retry` } : l
        ));
      } else {
        await delay(300);
        setLogs(prev => prev.map(l =>
          l.stepId === step.id ? { ...l, status: 'done', message: `${step.name} — concluído` } : l
        ));
      }
      scrollToEnd();
    }

    // Adiciona etapas puladas
    if (skippedSteps.length > 0) {
      setLogs(prev => [
        ...prev,
        ...skippedSteps.map(s => ({
          stepId: s.id,
          stepName: s.name,
          status: 'skipped' as SimLogStatus,
          message: `${s.name} — desativado`,
          ts: Date.now(),
        })),
      ]);
    }

    await delay(200);
    setRunning(false);
    setDone(true);
    console.log('[OnboardingSimulation] simulation complete');
    scrollToEnd();
  };

  const totalDone = logs.filter(l => l.status === 'done' && !l.stepId.includes('_sub_')).length;
  const totalErrors = logs.filter(l => l.status === 'error').length;

  return (
    <div className="space-y-4">
      {/* Painel de controle */}
      <div className="glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">Simulação de Onboarding</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeSteps.length} etapa{activeSteps.length !== 1 ? 's' : ''} ativa{activeSteps.length !== 1 ? 's' : ''} ·{' '}
            {skippedSteps.length} pulada{skippedSteps.length !== 1 ? 's' : ''} · Nenhuma API real será chamada
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle erro simulado */}
          <button
            onClick={() => setForceError(p => !p)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
              forceError
                ? 'bg-destructive/10 border-destructive/30 text-destructive'
                : 'bg-white/5 border-border text-muted-foreground hover:bg-white/10'
            )}
          >
            <AlertCircle className="w-3 h-3" />
            {forceError ? 'Erros ativos' : 'Simular erros'}
          </button>
          {done && (
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={reset}>
              <RotateCcw className="w-3.5 h-3.5" />
              Reiniciar
            </Button>
          )}
          <Button
            onClick={runSimulation}
            disabled={running || activeSteps.length === 0}
            className="gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 font-semibold"
          >
            <Play className="w-4 h-4" />
            {running ? 'Simulando...' : 'Simular onboarding'}
          </Button>
        </div>
      </div>

      {/* Sumário visual de etapas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {steps.map(step => {
          const log = logs.find(l => l.stepId === step.id);
          const status: SimLogStatus = log?.status ?? (step.enabled ? 'waiting' : 'skipped');
          const sc = STATUS_CONFIG[status];
          return (
            <div
              key={step.id}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm transition-all duration-300',
                sc.className
              )}
            >
              <span className="text-base shrink-0"><IconRenderer icon={step.icon} className="w-5 h-5" /></span>
              <span className={cn('text-xs font-medium flex-1 truncate', !step.enabled && 'line-through opacity-50')}>
                {step.name}
              </span>
              <span className="text-[10px] shrink-0">{sc.icon}</span>
            </div>
          );
        })}
      </div>

      {/* Terminal de logs */}
      {logs.length > 0 && (
        <div className="glass-card p-0 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-white/3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <div className="w-3 h-3 rounded-full bg-warning/60" />
              <div className="w-3 h-3 rounded-full bg-success/60" />
            </div>
            <p className="text-xs text-muted-foreground font-mono ml-2">onboarding-simulation.log</p>
            <div className="ml-auto flex gap-2 text-xs text-muted-foreground">
              {done && (
                <>
                  <span className="text-success">{totalDone} concluídos</span>
                  {totalErrors > 0 && <span className="text-destructive">{totalErrors} erros</span>}
                </>
              )}
            </div>
          </div>
          <div className="p-4 font-mono text-xs space-y-1 max-h-80 overflow-y-auto custom-scrollbar bg-[oklch(0.13_0.015_270)]">
            {logs.map((log, i) => {
              const sc = STATUS_CONFIG[log.status];
              return (
                <div
                  key={`${log.stepId}-${i}`}
                  className={cn(
                    'flex items-start gap-2 animate-in fade-in slide-in-from-bottom-1 duration-300',
                    log.stepId.includes('_sub_') && 'opacity-70'
                  )}
                >
                  <span className="text-muted-foreground/50 shrink-0 select-none">
                    {new Date(log.ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <ChevronRight className="w-3 h-3 mt-0.5 shrink-0 text-muted-foreground/40" />
                  <span className={cn(
                    'flex-1',
                    log.status === 'done' && !log.stepId.includes('_sub_') && 'text-success',
                    log.status === 'error' && 'text-destructive',
                    log.status === 'skipped' && 'text-muted-foreground/50',
                    log.status === 'running' && 'text-primary',
                  )}>
                    {log.message}
                  </span>
                </div>
              );
            })}
            {running && (
              <div className="flex items-center gap-2 text-primary">
                <span className="text-muted-foreground/50 shrink-0">
                  {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
                <span className="animate-pulse">Processando...</span>
              </div>
            )}
            {done && (
              <div className="mt-3 pt-3 border-t border-border text-success font-semibold">
                ✅ Simulação concluída em {activeSteps.length} etapas ({skippedSteps.length} puladas)
              </div>
            )}
            <div ref={logEndRef} />
          </div>
        </div>
      )}

      {/* Estado inicial */}
      {logs.length === 0 && !running && (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/15 flex items-center justify-center text-2xl">
            🚀
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Pronto para simular</p>
            <p className="text-xs text-muted-foreground mt-1">
              Clique em "Simular onboarding" para ver o fluxo em ação
            </p>
          </div>
        </div>
      )}

      {/* ─── Disparo Real ─────────────────────────────────────────────── */}
      <div className="glass-card p-5 space-y-4 border-primary/20">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Disparo Real</h3>
          <Badge variant="outline" className="text-[10px] text-warning border-warning/30 bg-warning/10">Chama a edge function de verdade</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Selecione um cliente e dispare o fluxo real. A função pausará em <code className="text-primary">await_contractual_form</code> e aguardará o preenchimento do formulário.
        </p>
        <div className="flex gap-2 flex-wrap">
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="h-8 text-xs w-60 bg-background/50 border-white/10">
              <SelectValue placeholder="Selecionar cliente..." />
            </SelectTrigger>
            <SelectContent className="glass-card">
              {clients.map(c => (
                <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
              ))}
              {clients.length === 0 && (
                <SelectItem value="none" disabled className="text-xs">Nenhum cliente cadastrado</SelectItem>
              )}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={dispararReal}
            disabled={realRunning || !selectedClientId}
            className="gap-1.5 bg-primary/90 hover:bg-primary text-xs h-8"
          >
            <Zap className="w-3.5 h-3.5" />
            {realRunning ? 'Disparando...' : 'Disparar onboarding'}
          </Button>
        </div>

        {realLogs.length > 0 && (
          <div className="bg-[oklch(0.13_0.015_270)] rounded-lg p-3 font-mono text-xs space-y-1 max-h-60 overflow-y-auto">
            {realLogs.map((line, i) => (
              <div key={i} className={cn(
                'flex gap-2',
                line.startsWith('ERRO') ? 'text-destructive' : line.includes('[completed]') ? 'text-success' : line.includes('[skipped]') ? 'text-muted-foreground' : 'text-foreground'
              )}>
                <ChevronRight className="w-3 h-3 mt-0.5 shrink-0 text-muted-foreground/40" />
                <span>{line}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise<void>(res => setTimeout(res, ms));
}
