import { TemplateTask, TemplateColumn, RelativeDueDate } from "@/data/templateTypes";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { teamMembers } from "@/lib/mock-data";
import { format, addDays, addWeeks, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  KanbanSquare,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  ListTodo,
} from "lucide-react";

interface TemplatePreviewProps {
  name: string;
  columns: TemplateColumn[];
  tasks: TemplateTask[];
  automationEnabled: boolean;
  linkedContractTitle: string | undefined;
}

export function TemplatePreview({
  name,
  columns,
  tasks,
  automationEnabled,
  linkedContractTitle,
}: TemplatePreviewProps) {
  const today = new Date();

  // Helper to calculate target date
  const calculateDate = (rel: RelativeDueDate) => {
    let result = today;
    const amount = rel.amount || 0;
    if (rel.unit === "days") {
      result = addDays(today, amount);
    } else if (rel.unit === "weeks") {
      result = addWeeks(today, amount);
    } else if (rel.unit === "months") {
      result = addMonths(today, amount);
    }
    return format(result, "dd/MM/yyyy", { locale: ptBR });
  };

  // Sort tasks chronologically for the timeline view
  const getSortDays = (rel: RelativeDueDate) => {
    const amount = rel.amount || 0;
    if (rel.unit === "days") return amount;
    if (rel.unit === "weeks") return amount * 7;
    if (rel.unit === "months") return amount * 30;
    return amount;
  };

  const sortedTasks = [...tasks].sort(
    (a, b) => getSortDays(a.relativeDueDate) - getSortDays(b.relativeDueDate),
  );

  // Determine warnings
  const warnings: string[] = [];
  if (columns.length === 0) {
    warnings.push("O modelo não possui colunas configuradas.");
  }
  if (tasks.length === 0) {
    warnings.push("O modelo não possui tarefas configuradas.");
  }
  if (automationEnabled && !linkedContractTitle) {
    warnings.push(
      "Autocriação está ativa, mas nenhum modelo de contrato foi selecionado como vínculo.",
    );
  }

  // Count unique roles/assignees
  const uniqueAssignees = new Set<string>();
  tasks.forEach((t) => {
    if (t.assigneeRule.type === "role" && t.assigneeRule.value) {
      uniqueAssignees.add(`Cargo: ${t.assigneeRule.value}`);
    } else if (t.assigneeRule.type === "specific_user" && t.assigneeRule.value) {
      uniqueAssignees.add(`Usuário: ${t.assigneeRule.value}`);
    } else {
      uniqueAssignees.add(t.assigneeRule.type);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium text-foreground">Visualização do Projeto Simulado</h3>
          <p className="text-xs text-muted-foreground">
            Visualize como o projeto Kanban e o cronograma de tarefas ficarão estruturados no
            workspace do cliente.
          </p>
        </div>
      </div>

      {/* Warnings & Sanity checks */}
      {warnings.length > 0 ? (
        <div className="space-y-2">
          {warnings.map((warn, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-xs text-destructive"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{warn}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-success/15 border border-success/30 text-xs text-success">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>
            Modelo validado com sucesso! Nenhuma inconsistência encontrada. Pronto para autocriação.
          </span>
        </div>
      )}

      {/* Project Meta Card */}
      <GlassCard className="p-4 border border-border/40 bg-background/25">
        <span className="text-[10px] text-primary uppercase font-bold tracking-wider">
          Projeto Gerado (Exemplo)
        </span>
        <h4 className="text-base font-semibold mt-1 text-foreground">
          {name || "Nome do Template"} — &lt;Nome do Cliente Exemplo&gt;
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border/30 text-xs text-muted-foreground">
          <div>
            <span>Colunas Kanban</span>
            <strong className="block text-sm text-foreground mt-0.5">
              {columns.length} colunas
            </strong>
          </div>
          <div>
            <span>Tarefas criadas</span>
            <strong className="block text-sm text-foreground mt-0.5">{tasks.length} tarefas</strong>
          </div>
          <div>
            <span>Responsáveis diferentes</span>
            <strong className="block text-sm text-foreground mt-0.5">
              {uniqueAssignees.size} funções
            </strong>
          </div>
          <div>
            <span>Duração total estimada</span>
            <strong className="block text-sm text-foreground mt-0.5">
              {tasks.length > 0
                ? `~${Math.max(...tasks.map((t) => getSortDays(t.relativeDueDate)))} dias`
                : "0 dias"}
            </strong>
          </div>
        </div>
      </GlassCard>

      {/* Layout Tabs: mini-kanban vs. timeline */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Kanban Preview - 2 cols width */}
        <div className="lg:col-span-2 space-y-3">
          <h5 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
            <KanbanSquare className="h-4 w-4 text-muted-foreground" />
            Estrutura de Quadros (Kanban)
          </h5>

          {columns.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-4 max-w-full">
              {columns.map((col) => {
                const colTasks = tasks.filter((t) => t.columnId === col.id);
                return (
                  <div
                    key={col.id}
                    className="w-64 shrink-0 rounded-xl bg-background/30 border border-border/40 p-3 flex flex-col gap-3 max-h-96 overflow-y-auto"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-border/20">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${col.color}`} />
                        <span className="text-xs font-semibold truncate text-foreground w-40">
                          {col.title}
                        </span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 bg-background/50 border border-border/30 rounded text-muted-foreground">
                        {colTasks.length}
                      </span>
                    </div>

                    {/* Tasks */}
                    {colTasks.map((t) => {
                      const priorityTone =
                        t.priority === "urgent"
                          ? "danger"
                          : t.priority === "high"
                            ? "warning"
                            : t.priority === "medium"
                              ? "primary"
                              : "neutral";

                      return (
                        <div
                          key={t.id}
                          className="bg-background/40 border border-border/30 rounded-lg p-2.5 space-y-2 hover:border-border/60 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-xs font-medium text-foreground line-clamp-2">
                              {t.title}
                            </span>
                            {t.isClientVisible ? (
                              <span title="Visível para o cliente">
                                <Eye className="h-3 w-3 text-primary shrink-0" />
                              </span>
                            ) : (
                              <span title="Interno">
                                <EyeOff className="h-3 w-3 text-muted-foreground shrink-0" />
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                            <span className="bg-background/80 border border-border/30 rounded px-1 flex items-center gap-0.5">
                              <Clock className="h-2.5 w-2.5" /> D+{t.relativeDueDate.amount}
                            </span>
                            <span className="truncate max-w-[80px]">
                              {t.assigneeRule.type === "role"
                                ? t.assigneeRule.value
                                : t.assigneeRule.type === "specific_user"
                                  ? `User: ${t.assigneeRule.value}`
                                  : t.assigneeRule.type}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {colTasks.length === 0 && (
                      <span className="text-[10px] text-muted-foreground italic text-center py-4">
                        Nenhuma tarefa
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Nenhuma coluna configurada para exibir.
            </p>
          )}
        </div>

        {/* Chronological Timeline Preview - 1 col width */}
        <div className="space-y-3">
          <h5 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
            <ListTodo className="h-4 w-4 text-muted-foreground" />
            Cronograma Estimado
          </h5>

          {sortedTasks.length > 0 ? (
            <div className="rounded-xl border border-border/40 p-4 bg-background/15 space-y-4 max-h-[25rem] overflow-y-auto">
              <div className="flex items-center gap-1.5 text-[11px] text-amber-500 pb-2 border-b border-border/30">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Baseado em assinatura de contrato hoje</span>
              </div>

              <div className="relative border-l border-border/40 pl-4 ml-1 space-y-4">
                {sortedTasks.map((t, idx) => {
                  return (
                    <div key={t.id} className="relative text-xs">
                      {/* Timeline dot */}
                      <span className="absolute -left-[21.5px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />

                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <span className="font-medium text-foreground">{t.title}</span>
                          <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-1 rounded font-mono shrink-0">
                            {calculateDate(t.relativeDueDate)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" /> D+{t.relativeDueDate.amount}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <User className="h-2.5 w-2.5" />{" "}
                            {t.assigneeRule.type === "role"
                              ? t.assigneeRule.value
                              : t.assigneeRule.type === "specific_user"
                                ? t.assigneeRule.value
                                : t.assigneeRule.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Nenhuma tarefa configurada para listar.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
