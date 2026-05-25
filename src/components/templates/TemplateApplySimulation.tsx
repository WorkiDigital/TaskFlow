import { useState, useEffect, useRef } from "react";
import { useTemplateWorkspace } from "@/hooks/useTemplateWorkspace";
import { mockClients } from "@/lib/mock-data";
import { format, addDays } from "date-fns";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Play,
  X,
  ChevronLeft,
  Terminal,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  FileCheck2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface TemplateApplySimulationProps {
  templateId: string | null;
  onBack: () => void;
}

interface LogEntry {
  timestamp: string;
  level: "info" | "success" | "warn" | "error";
  message: string;
}

export function TemplateApplySimulation({ templateId, onBack }: TemplateApplySimulationProps) {
  const { templates } = useTemplateWorkspace();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templateId || "");
  const [selectedClientId, setSelectedClientId] = useState<string>(mockClients[0]?.id || "");
  const [simulateError, setSimulateError] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (templateId) {
      setSelectedTemplateId(templateId);
    } else if (templates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [templateId, templates, selectedTemplateId]);

  // Auto-scroll console logs
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (message: string, level: LogEntry["level"] = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { timestamp, level, message }]);
  };

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const selectedClient = mockClients.find((c) => c.id === selectedClientId);

  const steps = [
    {
      label: "Webhook Recebido",
      desc: "Processando callback de assinatura eletrônica do Autentique",
    },
    {
      label: "Vínculo de Template",
      desc: "Mapeando título do contrato com template operacional correspondente",
    },
    {
      label: "Instanciação do Projeto",
      desc: "Criando registro do novo projeto no workspace do cliente",
    },
    { label: "Geração de Colunas", desc: "Estruturando as colunas Kanban customizadas" },
    { label: "Geração de Tarefas", desc: "Instanciando tarefas e calculando datas D+N" },
    {
      label: "Atribuição de Responsáveis",
      desc: "Avançando regras de cargos e fallbacks de usuários",
    },
    {
      label: "Notificação e Avisos",
      desc: "Disparando alertas e e-mails para a equipe de entrega",
    },
  ];

  const handleStartSimulation = async () => {
    if (!selectedTemplateId) {
      toast.error("Selecione um template!");
      return;
    }
    if (!selectedClientId) {
      toast.error("Selecione um cliente!");
      return;
    }

    const template = templates.find((t) => t.id === selectedTemplateId);
    const client = mockClients.find((c) => c.id === selectedClientId);
    if (!template || !client) return;

    setIsRunning(true);
    setCurrentStep(0);
    setLogs([]);

    // Step 0: Init
    addLog(
      `[TemplateAutomation] Iniciando simulação de assinatura para cliente "${client.company}"...`,
      "info",
    );
    await new Promise((r) => setTimeout(r, 600));

    // Step 1: Webhook
    setCurrentStep(0);
    addLog(
      `[TemplateAutomation] Webhook [Autentique] recebido: contrato assinado por ${client.name}.`,
      "success",
    );
    addLog(
      `[TemplateAutomation] Evento: contract.signed | Contrato: "${template.linkedContractTitle || "Serviços de Agência"}"`,
      "info",
    );
    await new Promise((r) => setTimeout(r, 800));

    // Step 2: Vínculo
    setCurrentStep(1);
    addLog(`[TemplateAutomation] Verificando vínculo operacional...`, "info");
    if (template.linkedContractTitle) {
      addLog(
        `[TemplateAutomation] Vínculo correspondente encontrado: "${template.name}" (ID: ${template.id})`,
        "success",
      );
    } else {
      addLog(
        `[TemplateAutomation] Sem vínculo direto de título. Usando seleção manual simulada para "${template.name}".`,
        "warn",
      );
    }
    await new Promise((r) => setTimeout(r, 800));

    // Step 3: Instanciar Projeto
    setCurrentStep(2);
    addLog(
      `[TemplateAutomation] Criando projeto "${template.name} — ${client.company}"...`,
      "info",
    );
    await new Promise((r) => setTimeout(r, 700));

    if (simulateError) {
      addLog(
        `[TemplateAutomation] ERRO: Falha ao inserir registro do projeto na base de dados. Conexão interrompida.`,
        "error",
      );
      addLog(`[TemplateAutomation] Simulação encerrada com erros.`, "error");
      setCurrentStep(-2); // Error state
      setIsRunning(false);
      return;
    }

    addLog(
      `[TemplateAutomation] Projeto gerado com sucesso. UUID: proj-${Math.floor(Math.random() * 100000)}`,
      "success",
    );
    await new Promise((r) => setTimeout(r, 700));

    // Step 4: Colunas
    setCurrentStep(3);
    addLog(`[TemplateAutomation] Criando colunas Kanban...`, "info");
    template.columns.forEach((col: { title: string; position: number }) => {
      addLog(
        `[TemplateAutomation]   -> Coluna "${col.title}" criada (Posição ${col.position})`,
        "info",
      );
    });
    addLog(
      `[TemplateAutomation] Total de ${template.columns.length} colunas estruturadas no quadro.`,
      "success",
    );
    await new Promise((r) => setTimeout(r, 1000));

    // Step 5: Tarefas
    setCurrentStep(4);
    addLog(
      `[TemplateAutomation] Gerando grade de tarefas (${template.tasks.length} pendentes)...`,
      "info",
    );
    let tasksCreated = 0;
    template.tasks.forEach(
      (t: {
        title: string;
        relativeDueDate: { amount: number };
        assigneeRule: { type: string; value: string };
        columnId: string;
        description: string;
        priority: string;
        checklist: Array<{ id: string; title: string }>;
        tags: string[];
      }) => {
        // Calculate date
        const days = t.relativeDueDate.amount;
        const targetDate = format(addDays(new Date(), days), "dd/MM/yyyy");
        addLog(
          `[TemplateAutomation]   -> Tarefa "${t.title}" calculada para D+${days} (${targetDate})`,
          "info",
        );
        tasksCreated++;
      },
    );
    addLog(
      `[TemplateAutomation] Total de ${tasksCreated} tarefas agendadas e adicionadas no backlog do projeto.`,
      "success",
    );
    await new Promise((r) => setTimeout(r, 1000));

    // Step 6: Atribuições
    setCurrentStep(5);
    addLog(`[TemplateAutomation] Resolvendo regras de atribuição de tarefas...`, "info");
    template.tasks.forEach(
      (t: {
        title: string;
        relativeDueDate: { amount: number };
        assigneeRule: { type: string; value: string };
        columnId: string;
        description: string;
        priority: string;
        checklist: Array<{ id: string; title: string }>;
        tags: string[];
      }) => {
        if (t.assigneeRule.type === "role") {
          addLog(
            `[TemplateAutomation]   -> Tarefa "${t.title}": Atribuída ao cargo "${t.assigneeRule.value}". Resolvido para equipe.`,
            "info",
          );
        } else if (t.assigneeRule.type === "specific_user") {
          addLog(
            `[TemplateAutomation]   -> Tarefa "${t.title}": Atribuída a pessoa fixa "${t.assigneeRule.value}".`,
            "info",
          );
        } else {
          addLog(
            `[TemplateAutomation]   -> Tarefa "${t.title}": Regra "${t.assigneeRule.type}" aplicada.`,
            "info",
          );
        }
      },
    );
    addLog(`[TemplateAutomation] Resolução de responsáveis concluída com sucesso.`, "success");
    await new Promise((r) => setTimeout(r, 800));

    // Step 7: Notificar
    setCurrentStep(6);
    addLog(`[TemplateAutomation] Enviando notificações operacionais...`, "info");
    addLog(
      `[TemplateAutomation] Notificação enviada para WhatsApp interno: "Novo projeto criado: ${template.name} — ${client.company}"`,
      "success",
    );
    addLog(`[TemplateAutomation] Integrantes notificados no dashboard.`, "success");
    await new Promise((r) => setTimeout(r, 800));

    // Finish
    setCurrentStep(7); // Completed
    addLog(
      `[TemplateAutomation] Automação concluída! Projeto "${template.name} — ${client.company}" está ATIVO e pronto para a equipe de entrega.`,
      "success",
    );
    setIsRunning(false);
    toast.success("Simulação concluída com sucesso!");

    // Save simulated project to localStorage mock projects
    try {
      // Get existing projects
      const existingProjectsRaw = localStorage.getItem("taskflow_projects");
      const existingProjects = existingProjectsRaw
        ? JSON.parse(existingProjectsRaw)
        : [
            {
              id: "p-1",
              spaceId: "sp-4",
              name: "Lançamento Infoproduto 30 Dias",
              clientName: "Northwave",
              status: "active",
              progress: 45,
              startDate: "2026-05-01",
              dueDate: "2026-05-30",
              members: ["MC", "RT"],
              templateOrigin: "Lançamento de Infoproduto 30 Dias",
            },
            {
              id: "p-2",
              spaceId: "sp-2",
              name: "Gestão de Tráfego – Clínica Premium",
              clientName: "Viva Corp",
              status: "active",
              progress: 10,
              startDate: "2026-05-15",
              dueDate: "2026-11-15",
              members: ["JP"],
            },
            {
              id: "p-3",
              spaceId: "sp-3",
              name: "Rebranding – E-commerce de Moda",
              clientName: "Arco Estúdio",
              status: "planning",
              progress: 0,
              startDate: "2026-06-01",
              dueDate: "2026-07-15",
              members: ["MC", "PH", "RT"],
            },
          ];

      // Add default spaces if not present
      const existingSpacesRaw = localStorage.getItem("taskflow_spaces");
      const spaces = existingSpacesRaw ? JSON.parse(existingSpacesRaw) : [];
      const defaultSpaces = [
        { id: "sp-1", name: "Marketing", color: "bg-pink-500" },
        { id: "sp-2", name: "Tráfego Pago", color: "bg-blue-500" },
        { id: "sp-3", name: "Design", color: "bg-purple-500" },
        { id: "sp-4", name: "Lançamentos", color: "bg-orange-500" },
      ];
      let spacesModified = false;
      defaultSpaces.forEach((ds) => {
        if (!spaces.some((s: any) => s.id === ds.id)) {
          spaces.push(ds);
          spacesModified = true;
        }
      });
      if (spacesModified || !existingSpacesRaw) {
        localStorage.setItem("taskflow_spaces", JSON.stringify(spaces));
      }

      // Get existing tasks
      const existingTasksRaw = localStorage.getItem("taskflow_tasks");
      const existingTasks = existingTasksRaw ? JSON.parse(existingTasksRaw) : [];

      const newProjId = `p-sim-${Date.now()}`;
      const newProj = {
        id: newProjId,
        spaceId:
          template.category === "launch"
            ? "sp-4"
            : template.category === "paid_traffic"
              ? "sp-2"
              : "sp-3",
        name: `${template.name} — ${client.company}`,
        clientName: client.company,
        status: "active",
        progress: 0,
        startDate: format(new Date(), "yyyy-MM-dd"),
        dueDate: format(addDays(new Date(), 30), "yyyy-MM-dd"),
        members: ["AB", "CM"],
        templateOrigin: template.name,
      };

      // Map and append tasks
      const newTasks = template.tasks.map(
        (
          t: {
            title: string;
            relativeDueDate: { amount: number };
            assigneeRule: { type: string; value: string };
            columnId: string;
            description: string;
            priority: string;
            checklist: Array<{ id: string; title: string }>;
            tags: string[];
          },
          idx: number,
        ) => {
          const colIndex = template.columns.findIndex((c: { id: string }) => c.id === t.columnId);
          const mappedColNum = Math.min(colIndex + 1, 7);
          const mappedColumnId = `col-${mappedColNum}`;
          const mappedStatus =
            mappedColumnId === "col-1"
              ? "backlog"
              : mappedColumnId === "col-2"
                ? "todo"
                : mappedColumnId === "col-3"
                  ? "in_progress"
                  : mappedColumnId === "col-4"
                    ? "review"
                    : mappedColumnId === "col-5"
                      ? "waiting"
                      : mappedColumnId === "col-6"
                        ? "approved"
                        : "done";

          // Initials mapping
          let initials = "AB";
          if (t.assigneeRule.type === "specific_user" && t.assigneeRule.value) {
            initials = t.assigneeRule.value;
          } else if (t.assigneeRule.type === "role" && t.assigneeRule.value) {
            const roleInitials: Record<string, string> = {
              Atendimento: "AB",
              "Gestor de tráfego": "JP",
              Designer: "CM",
              Copywriter: "MC",
              "Social Media": "BR",
              "Editor de vídeo": "CM",
              Desenvolvedor: "RT",
              "Gestor de projeto": "MC",
              Financeiro: "AD",
            };
            initials = roleInitials[t.assigneeRule.value] || "AB";
          }

          return {
            id: `t-sim-${Date.now()}-${idx}`,
            projectId: newProjId,
            columnId: mappedColumnId,
            status: mappedStatus,
            title: t.title,
            description: t.description,
            assignee: initials,
            dueDate: format(addDays(new Date(), t.relativeDueDate.amount), "yyyy-MM-dd"),
            priority: t.priority,
            checklist: t.checklist.map((c: { id: string; title: string }) => ({
              id: c.id,
              title: c.title,
              done: false,
            })),
            comments: [],
            activity: [
              {
                id: `act-task-${idx}`,
                description: "Criada via automação de contrato assinado",
                timestamp: new Date().toISOString(),
              },
            ],
            tags: t.tags,
          };
        },
      );

      localStorage.setItem("taskflow_projects", JSON.stringify([...existingProjects, newProj]));
      localStorage.setItem("taskflow_tasks", JSON.stringify([...existingTasks, ...newTasks]));
      console.log(
        "[TemplateApplySimulation] Saved simulated project and tasks to real projects database.",
      );
    } catch (e) {
      console.error("[TemplateApplySimulation] Failed to save simulated project metadata:", e);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full px-4 py-6 md:px-8 md:py-8">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/40 pb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={onBack}
          disabled={isRunning}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Simulação de Automação</h2>
          <p className="text-xs text-muted-foreground">
            Simule o recebimento de assinatura do contrato e a criação automática correspondente.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Settings Panel */}
        <div className="space-y-4">
          <GlassCard className="p-4 border border-border/40 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FileCheck2 className="h-4.5 w-4.5 text-primary" />
              Parâmetros da Simulação
            </h3>

            {/* Template Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs">Template de Projeto</Label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-lg border border-border bg-background/50 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-9"
              >
                <option value="">-- Selecione o Template --</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.tasks.length} tarefas)
                  </option>
                ))}
              </select>
            </div>

            {/* Client Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs">Cliente Assinante (Mock)</Label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-lg border border-border bg-background/50 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-9"
              >
                {mockClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company} ({c.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Simulate Error Toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-background/40 border border-border/30">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-destructive">Simular Erro</span>
                <span className="text-[9px] text-muted-foreground">
                  Simula uma quebra de comunicação de banco.
                </span>
              </div>
              <Switch
                checked={simulateError}
                onCheckedChange={setSimulateError}
                disabled={isRunning}
              />
            </div>

            {/* Start Button */}
            <Button
              onClick={handleStartSimulation}
              disabled={isRunning || !selectedTemplateId}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-[var(--shadow-glow)] h-9 text-xs"
            >
              <Play className="h-4 w-4 fill-current" />
              Simular Contrato Assinado
            </Button>
          </GlassCard>

          {/* Stepper tracker */}
          <GlassCard className="p-4 border border-border/40 space-y-3.5">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Etapas da Automação
            </h4>
            <div className="space-y-3.5">
              {steps.map((step, idx) => {
                const isCompleted = currentStep > idx || currentStep === 7;
                const isActive = currentStep === idx;
                const isFailed = currentStep === -2 && idx === 2; // Simulated project instantiation error

                let badgeTone: "neutral" | "primary" | "success" | "danger" = "neutral";
                let statusLabel = "Aguardando";

                if (isCompleted) {
                  badgeTone = "success";
                  statusLabel = "Concluído";
                } else if (isActive) {
                  badgeTone = "primary";
                  statusLabel = "Processando";
                } else if (isFailed) {
                  badgeTone = "danger";
                  statusLabel = "Erro";
                }

                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-2.5 text-xs transition-opacity ${isCompleted || isActive || isFailed ? "opacity-100" : "opacity-40"}`}
                  >
                    <div className="mt-0.5">
                      <StatusBadge tone={badgeTone}>{statusLabel}</StatusBadge>
                    </div>
                    <div className="space-y-0.5">
                      <span
                        className={`font-semibold ${isActive ? "text-primary" : isFailed ? "text-destructive" : "text-foreground"}`}
                      >
                        {step.label}
                      </span>
                      <p className="text-[10px] text-muted-foreground leading-snug">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>

        {/* Terminal logs panel */}
        <div className="lg:col-span-2 flex flex-col h-full min-h-[30rem] lg:min-h-0">
          <GlassCard className="p-0 border border-border/40 bg-black/60 backdrop-blur-2xl rounded-xl flex flex-col flex-1 overflow-hidden h-full">
            {/* Terminal Header */}
            <div className="bg-muted/50 px-4 py-2.5 flex items-center justify-between border-b border-border/40 select-none">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary" />
                <span className="text-xs font-mono font-bold tracking-tight text-foreground">
                  CONSOLE LOGS (AUTOMATION_SERVICE)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
              </div>
            </div>

            {/* Terminal Output */}
            <div className="p-4 font-mono text-[11px] overflow-y-auto flex-1 space-y-2.5 min-h-[22rem] max-h-[28rem]">
              {logs.length > 0 ? (
                logs.map((log, index) => {
                  let textClass = "text-muted-foreground";
                  if (log.level === "success") textClass = "text-green-400";
                  if (log.level === "warn") textClass = "text-yellow-400";
                  if (log.level === "error") textClass = "text-rose-400";

                  return (
                    <div key={index} className="flex gap-2 items-start leading-relaxed">
                      <span className="text-muted-foreground/60 shrink-0 select-none">
                        [{log.timestamp}]
                      </span>
                      <span className={textClass}>{log.message}</span>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex items-center justify-center text-center text-muted-foreground italic select-none py-12">
                  <div className="space-y-2">
                    <Terminal className="h-8 w-8 mx-auto opacity-30 animate-pulse text-primary" />
                    <span>Aguardando início do disparo do webhook de simulação...</span>
                  </div>
                </div>
              )}
              {/* Spinning prompt if running */}
              {isRunning && (
                <div className="flex items-center gap-2 text-primary animate-pulse py-1">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Processando etapa seguinte...</span>
                </div>
              )}
              <div ref={consoleEndRef} />
            </div>

            {/* Console summary panel */}
            {currentStep === 7 && (
              <div className="p-4 border-t border-border/40 bg-success/5 flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <h4 className="font-semibold text-success">Automação concluída com sucesso!</h4>
                  <p className="text-muted-foreground">
                    O projeto foi integrado no módulo de Gestão de Projetos e já está listado para a
                    agência. Todas as tarefas foram calculadas com prazos relativos e alocadas
                    conforme as regras.
                  </p>
                </div>
              </div>
            )}

            {currentStep === -2 && (
              <div className="p-4 border-t border-border/40 bg-destructive/5 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <h4 className="font-semibold text-destructive">Falha na Automação</h4>
                  <p className="text-muted-foreground">
                    A criação foi abortada devido a erro simulado. Verifique os logs do console
                    acima para identificar o gargalo.
                  </p>
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
