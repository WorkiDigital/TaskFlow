import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AutomationFlow, AutomationStep } from "@/data/mockAutomations";
import {
  Play,
  CheckCircle2,
  CircleDashed,
  AlertCircle,
  XCircle,
  ArrowRight,
  Activity,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AutomationSimulationPanelProps {
  flow: AutomationFlow;
  onClose: () => void;
}

type SimulationStatus = "idle" | "running" | "completed" | "error";
type StepStatus = "pending" | "running" | "completed" | "skipped" | "error";

interface LogEntry {
  id: string;
  time: string;
  message: string;
  type: "info" | "success" | "error" | "warning";
}

export function AutomationSimulationPanel({ flow, onClose }: AutomationSimulationPanelProps) {
  const [simulationStatus, setSimulationStatus] = useState<SimulationStatus>("idle");
  const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>({});
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Get active steps sorted by order
  const activeSteps = flow.steps.filter((s) => s.enabled).sort((a, b) => a.order - b.order);

  const addLog = (message: string, type: LogEntry["type"] = "info") => {
    setLogs((prev) => [
      ...prev,
      {
        id: Date.now().toString() + Math.random(),
        time: new Date().toLocaleTimeString("pt-BR"),
        message,
        type,
      },
    ]);
  };

  const startSimulation = async () => {
    setSimulationStatus("running");
    setLogs([]);
    setStepStatuses({});

    addLog(`Iniciando simulação do fluxo: ${flow.name}`, "info");

    // Check if there are any active steps
    if (activeSteps.length === 0) {
      addLog("Nenhuma etapa ativa no fluxo para simular.", "warning");
      setSimulationStatus("completed");
      return;
    }

    for (const step of activeSteps) {
      // Check dependencies (simplified logic)
      if (step.dependsOn && step.dependsOn.length > 0) {
        const hasMissingDeps = step.dependsOn.some((depType) => {
          const depStep = activeSteps.find((s) => s.type === depType);
          return !depStep; // In this simulation, if the dependent step is not in activeSteps, it's missing
        });

        if (hasMissingDeps) {
          setStepStatuses((prev) => ({ ...prev, [step.id]: "error" }));
          addLog(
            `[Erro] A etapa "${step.name}" não pode ser executada porque uma etapa dependente está desativada ou faltando.`,
            "error",
          );
          setSimulationStatus("error");
          return; // Stop simulation on error
        }
      }

      // Mark step as running
      setStepStatuses((prev) => ({ ...prev, [step.id]: "running" }));
      addLog(`Executando: ${step.name}...`, "info");

      // Simulate network delay / work
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate a random error 5% of the time just to show error handling
      if (Math.random() < 0.05) {
        setStepStatuses((prev) => ({ ...prev, [step.id]: "error" }));
        addLog(
          `[Falha] Ocorreu um erro simulado ao tentar executar: ${step.name}. A API retornou timeout.`,
          "error",
        );
        setSimulationStatus("error");
        return; // Stop simulation
      }

      // Mark step as completed
      setStepStatuses((prev) => ({ ...prev, [step.id]: "completed" }));
      addLog(`[Concluído] ${step.name} finalizado com sucesso.`, "success");
    }

    addLog("Simulação concluída com sucesso! Nenhuma API real foi chamada.", "success");
    setSimulationStatus("completed");
  };

  const getStepIcon = (status: StepStatus | undefined) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case "running":
        return <Activity className="w-5 h-5 text-blue-400 animate-pulse" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "skipped":
        return <CircleDashed className="w-5 h-5 text-muted-foreground opacity-50" />;
      case "pending":
      default:
        return <CircleDashed className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-background)] w-full">
      <div className="shrink-0 p-6 border-b border-white/5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Preview e Simulação</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Veja a linha do tempo do seu fluxo e teste a execução localmente.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-full hover:bg-white/5"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Timeline Panel (Phase 11: Preview) */}
        <div className="flex-1 p-6 overflow-y-auto border-r border-white/5 bg-black/10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-medium">Linha do Tempo</h3>
            <Badge variant="outline" className="bg-white/5 border-white/10">
              {activeSteps.length} etapas
            </Badge>
          </div>

          <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-8 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
            {activeSteps.map((step, idx) => {
              const status = stepStatuses[step.id] || "pending";

              return (
                <div
                  key={step.id}
                  className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                >
                  {/* Icon Marker */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[var(--color-background)] bg-zinc-900 absolute left-0 md:left-1/2 -translate-x-1/2 shrink-0 z-10 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                    {getStepIcon(status)}
                  </div>

                  {/* Card */}
                  <div
                    className={cn(
                      "w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border backdrop-blur-sm transition-all",
                      status === "completed"
                        ? "bg-emerald-500/5 border-emerald-500/20"
                        : status === "running"
                          ? "bg-blue-500/5 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                          : status === "error"
                            ? "bg-red-500/5 border-red-500/30"
                            : "bg-white/5 border-white/10",
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        Etapa {idx + 1}
                      </span>
                      {step.isAutomatic ? (
                        <Badge
                          variant="secondary"
                          className="text-[9px] h-4 bg-primary/10 text-primary hover:bg-primary/20 border-transparent"
                        >
                          Automático
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="text-[9px] h-4 bg-white/10 hover:bg-white/20 border-transparent"
                        >
                          Manual
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-semibold text-sm text-foreground mb-1">{step.name}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>

                    {step.configStatus !== "configured" && (
                      <p className="text-[10px] text-yellow-500/80 mt-2 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Etapa não está totalmente configurada.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Console Panel (Phase 12: Simulation) */}
        <div className="w-full lg:w-[450px] shrink-0 bg-[#0c0c0e] flex flex-col font-mono text-[13px]">
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/40">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
            </div>
            <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
              Simulador de Terminal
            </span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-2">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-4">
                <Play className="w-12 h-12" />
                <p>Clique em Iniciar para rodar a simulação.</p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 opacity-90 animate-in fade-in">
                  <span className="text-zinc-600 shrink-0">[{log.time}]</span>
                  <span
                    className={cn(
                      "flex-1",
                      log.type === "info"
                        ? "text-blue-300"
                        : log.type === "success"
                          ? "text-emerald-400"
                          : log.type === "warning"
                            ? "text-yellow-400"
                            : "text-red-400",
                    )}
                  >
                    {log.type === "error" && "> "}
                    {log.message}
                  </span>
                </div>
              ))
            )}

            {simulationStatus === "running" && (
              <div className="flex items-center gap-2 text-muted-foreground animate-pulse mt-4">
                <span className="w-2 h-4 bg-primary inline-block"></span> Processando...
              </div>
            )}
          </div>

          <div className="p-4 border-t border-white/5 bg-black/40">
            <Button
              className="w-full gap-2 font-sans font-semibold shadow-lg transition-all"
              onClick={startSimulation}
              disabled={simulationStatus === "running"}
              variant={simulationStatus === "error" ? "destructive" : "default"}
            >
              {simulationStatus === "running" ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" /> Simulando...
                </>
              ) : simulationStatus === "error" ? (
                <>
                  <Play className="w-4 h-4" /> Tentar Novamente
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Iniciar Simulação
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
