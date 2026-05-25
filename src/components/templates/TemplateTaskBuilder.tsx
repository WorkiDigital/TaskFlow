import { useState } from "react";
import {
  TemplateTask,
  TemplateColumn,
  TemplateChecklistItem,
  AssigneeRule,
  RelativeDueDate,
  RelativeDateBase,
} from "@/data/templateTypes";
import { TaskPriority } from "@/data/mockProjects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TemplateChecklistBuilder } from "./TemplateChecklistBuilder";
import { teamMembers } from "@/lib/mock-data";
import { roleOptions } from "@/data/mockAgencyTemplates";
import {
  Plus,
  Trash2,
  Calendar,
  User,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Tag,
  Link as LinkIcon,
  AlertCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

interface TemplateTaskBuilderProps {
  tasks: TemplateTask[];
  columns: TemplateColumn[];
  onChange: (tasks: TemplateTask[]) => void;
}

export function TemplateTaskBuilder({ tasks, columns, onChange }: TemplateTaskBuilderProps) {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [activeColumnFilter, setActiveColumnFilter] = useState<string>("all");

  const handleAddTask = (columnId: string) => {
    const defaultCol = columns.find((c) => c.id === columnId) || columns[0];
    if (!defaultCol) {
      toast.error("Crie uma coluna primeiro antes de adicionar tarefas!");
      return;
    }

    const newTask: TemplateTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: "Nova Tarefa",
      description: "",
      columnId: defaultCol.id,
      priority: "medium",
      assigneeRule: { type: "role", value: "Gestor de projeto", fallback: "manager" },
      relativeDueDate: { amount: 3, unit: "days", direction: "after", base: "contract_signed_at" },
      checklist: [],
      dependencies: [],
      tags: [],
      isClientVisible: false,
    };

    onChange([...tasks, newTask]);
    setExpandedTaskId(newTask.id);
    console.log("[TemplateTaskBuilder] Added task:", newTask.id);
  };

  const handleUpdateTask = (id: string, patch: Partial<TemplateTask>) => {
    onChange(tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const handleRemoveTask = (id: string) => {
    // Also remove from other tasks' dependencies
    const updated = tasks
      .filter((t) => t.id !== id)
      .map((t) => ({
        ...t,
        dependencies: t.dependencies.filter((depId) => depId !== id),
      }));
    onChange(updated);
    if (expandedTaskId === id) setExpandedTaskId(null);
    console.log("[TemplateTaskBuilder] Removed task:", id);
    toast.info("Tarefa removida.");
  };

  const toggleExpand = (id: string) => {
    setExpandedTaskId(expandedTaskId === id ? null : id);
  };

  // Helper for assigning rule labels
  const getAssigneeRuleLabel = (rule: AssigneeRule) => {
    switch (rule.type) {
      case "specific_user": {
        const member = teamMembers.find((m) => m.initials === rule.value || m.id === rule.value);
        return `Pessoa: ${member?.name || rule.value || "Não selecionada"}`;
      }
      case "role":
        return `Cargo: ${rule.value || "Qualquer"}`;
      case "client_owner":
        return "Resp. pelo Cliente";
      case "project_manager":
        return "Gestor do Projeto";
      case "first_available":
        return "Primeiro Disp. do Setor";
      default:
        return "Manual";
    }
  };

  // Helper for relative due date label
  const getRelativeDateLabel = (date: RelativeDueDate) => {
    const baseLabels: Record<RelativeDateBase, string> = {
      contract_signed_at: "assinatura",
      project_start_date: "início do projeto",
      briefing_completed_at: "briefing",
      manual_date: "data manual",
    };
    const unitLabels = {
      days: date.amount === 1 ? "dia" : "dias",
      weeks: date.amount === 1 ? "semana" : "semanas",
      months: date.amount === 1 ? "mês" : "meses",
    };
    return `D+${date.amount} ${unitLabels[date.unit]} pós ${baseLabels[date.base]}`;
  };

  // Check circular dependencies
  const isCircular = (taskId: string, depId: string, visited = new Set<string>()): boolean => {
    if (taskId === depId) return true;
    if (visited.has(depId)) return false;
    visited.add(depId);

    const depTask = tasks.find((t) => t.id === depId);
    if (!depTask) return false;

    for (const subDepId of depTask.dependencies) {
      if (isCircular(taskId, subDepId, visited)) return true;
    }
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium text-foreground">Estrutura de Tarefas</h3>
          <p className="text-xs text-muted-foreground">
            Defina as entregas, prazos relativos e quem executará cada tarefa.
          </p>
        </div>

        {/* Column filtering and adding */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground">Filtrar coluna:</span>
          <select
            value={activeColumnFilter}
            onChange={(e) => setActiveColumnFilter(e.target.value)}
            className="rounded-lg border border-border bg-background/50 px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Todas</option>
            {columns.map((col) => (
              <option key={col.id} value={col.id}>
                {col.title}
              </option>
            ))}
          </select>
          {columns.length > 0 && (
            <Button
              size="sm"
              onClick={() =>
                handleAddTask(activeColumnFilter !== "all" ? activeColumnFilter : columns[0].id)
              }
              className="gap-1 bg-primary text-primary-foreground text-xs h-8"
            >
              <Plus className="h-4.5 w-4.5" /> Adicionar Tarefa
            </Button>
          )}
        </div>
      </div>

      {columns.length === 0 ? (
        <div className="p-8 text-center bg-background/25 border border-border/40 rounded-xl">
          <p className="text-sm text-muted-foreground">
            Adicione colunas nas configurações de fluxo antes de criar tarefas.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Columns Grouping list */}
          {columns
            .filter((col) => activeColumnFilter === "all" || col.id === activeColumnFilter)
            .map((column) => {
              const columnTasks = tasks.filter((t) => t.columnId === column.id);

              return (
                <div key={column.id} className="space-y-3">
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${column.color}`} />
                      <h4 className="font-semibold text-sm text-foreground">{column.title}</h4>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-background/40 border border-border/30 text-muted-foreground">
                        {columnTasks.length}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddTask(column.id)}
                      className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-primary"
                    >
                      <Plus className="h-3 w-3" /> Adicionar nesta coluna
                    </Button>
                  </div>

                  {/* Tasks in this column */}
                  {columnTasks.length > 0 ? (
                    <div className="space-y-3">
                      {columnTasks.map((task) => {
                        const isExpanded = expandedTaskId === task.id;
                        const priorityTone =
                          task.priority === "urgent"
                            ? "danger"
                            : task.priority === "high"
                              ? "warning"
                              : task.priority === "medium"
                                ? "primary"
                                : "neutral";
                        const priorityLabel =
                          task.priority === "urgent"
                            ? "Urgente"
                            : task.priority === "high"
                              ? "Alta"
                              : task.priority === "medium"
                                ? "Média"
                                : "Baixa";

                        return (
                          <GlassCard
                            key={task.id}
                            className={`p-0 overflow-hidden border border-border/40 transition-all ${isExpanded ? "border-primary/40 ring-1 ring-primary/20" : "hover:border-border/80"}`}
                          >
                            {/* Card Header clickable to expand */}
                            <div
                              onClick={() => toggleExpand(task.id)}
                              className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 cursor-pointer select-none"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className="font-medium text-sm text-foreground">
                                    {task.title || "Sem título"}
                                  </h5>
                                  <StatusBadge tone={priorityTone}>{priorityLabel}</StatusBadge>
                                  {task.isClientVisible ? (
                                    <span className="inline-flex items-center text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full gap-1">
                                      <Eye className="h-3 w-3" /> Visível
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center text-[10px] text-muted-foreground bg-muted/10 border border-border/30 px-2 py-0.5 rounded-full gap-1">
                                      <EyeOff className="h-3 w-3" /> Interno
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {task.description || "Nenhuma descrição."}
                                </p>
                              </div>

                              <div className="flex items-center gap-4 text-xs text-muted-foreground w-full md:w-auto justify-end">
                                <div className="flex items-center gap-1.5" title="Prazo relativo">
                                  <Calendar className="h-3.5 w-3.5" />
                                  <span>{getRelativeDateLabel(task.relativeDueDate)}</span>
                                </div>
                                <div className="flex items-center gap-1.5" title="Responsável">
                                  <User className="h-3.5 w-3.5" />
                                  <span>{getAssigneeRuleLabel(task.assigneeRule)}</span>
                                </div>
                                {task.checklist.length > 0 && (
                                  <span className="px-1.5 py-0.5 rounded bg-background/50 border border-border/30 text-[10px]">
                                    {task.checklist.length} Checklists
                                  </span>
                                )}
                                {task.dependencies.length > 0 && (
                                  <span className="px-1.5 py-0.5 rounded bg-background/50 border border-border/30 text-[10px] flex items-center gap-1 text-amber-500">
                                    <LinkIcon className="h-3 w-3" /> {task.dependencies.length} Dep.
                                  </span>
                                )}
                                <div>
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Card Content expanded */}
                            {isExpanded && (
                              <div className="p-4 border-t border-border/40 bg-background/20 space-y-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                  {/* Left Panel: Basic Fields */}
                                  <div className="space-y-4">
                                    <div>
                                      <Label className="text-xs">Título da Tarefa</Label>
                                      <Input
                                        value={task.title}
                                        onChange={(e) =>
                                          handleUpdateTask(task.id, { title: e.target.value })
                                        }
                                        className="h-8 text-sm mt-1"
                                      />
                                    </div>

                                    <div>
                                      <Label className="text-xs">Descrição</Label>
                                      <Textarea
                                        value={task.description}
                                        onChange={(e) =>
                                          handleUpdateTask(task.id, { description: e.target.value })
                                        }
                                        placeholder="O que deve ser entregue..."
                                        className="text-sm mt-1 min-h-[4.5rem] resize-y"
                                      />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-xs">Coluna</Label>
                                        <select
                                          value={task.columnId}
                                          onChange={(e) =>
                                            handleUpdateTask(task.id, { columnId: e.target.value })
                                          }
                                          className="w-full rounded-lg border border-border bg-background/50 px-2.5 py-1.5 text-xs text-foreground mt-1 focus:outline-none focus:ring-1 focus:ring-primary"
                                        >
                                          {columns.map((col) => (
                                            <option key={col.id} value={col.id}>
                                              {col.title}
                                            </option>
                                          ))}
                                        </select>
                                      </div>

                                      <div>
                                        <Label className="text-xs">Prioridade</Label>
                                        <select
                                          value={task.priority}
                                          onChange={(e) =>
                                            handleUpdateTask(task.id, {
                                              priority: e.target.value as TaskPriority,
                                            })
                                          }
                                          className="w-full rounded-lg border border-border bg-background/50 px-2.5 py-1.5 text-xs text-foreground mt-1 focus:outline-none focus:ring-1 focus:ring-primary"
                                        >
                                          <option value="low">Baixa</option>
                                          <option value="medium">Média</option>
                                          <option value="high">Alta</option>
                                          <option value="urgent">Urgente</option>
                                        </select>
                                      </div>
                                    </div>

                                    {/* Client visibility */}
                                    <div className="flex items-center justify-between p-2 rounded-lg bg-background/40 border border-border/30">
                                      <div className="flex flex-col">
                                        <span className="text-xs font-medium">
                                          Visível para o cliente
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                          Permite que o cliente visualize no painel dele.
                                        </span>
                                      </div>
                                      <Switch
                                        checked={task.isClientVisible}
                                        onCheckedChange={(checked) =>
                                          handleUpdateTask(task.id, { isClientVisible: checked })
                                        }
                                      />
                                    </div>
                                  </div>

                                  {/* Right Panel: Assignee, Deadlines, Dependencies */}
                                  <div className="space-y-4">
                                    {/* Assignee Rule configuration */}
                                    <div className="space-y-2 border-b border-border/30 pb-3">
                                      <Label className="text-xs font-semibold flex items-center gap-1.5">
                                        <User className="h-3.5 w-3.5" /> Regra de Atribuição
                                      </Label>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <Label className="text-[10px] text-muted-foreground">
                                            Tipo
                                          </Label>
                                          <select
                                            value={task.assigneeRule.type}
                                            onChange={(e) => {
                                              const newType = e.target.value as any;
                                              const defaultVal =
                                                newType === "role"
                                                  ? "Gestor de projeto"
                                                  : newType === "specific_user"
                                                    ? teamMembers[0].initials
                                                    : undefined;
                                              handleUpdateTask(task.id, {
                                                assigneeRule: {
                                                  ...task.assigneeRule,
                                                  type: newType,
                                                  value: defaultVal,
                                                },
                                              });
                                            }}
                                            className="w-full rounded-lg border border-border bg-background/50 px-2.5 py-1 text-xs text-foreground mt-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                                          >
                                            <option value="role">Cargo / Função</option>
                                            <option value="specific_user">Pessoa Fixa</option>
                                            <option value="client_owner">Dono do Cliente</option>
                                            <option value="project_manager">
                                              Gestor do Projeto
                                            </option>
                                            <option value="first_available">
                                              Primeiro Disponível
                                            </option>
                                            <option value="manual">Definir Manualmente</option>
                                          </select>
                                        </div>

                                        {/* Dynamic selector based on rule type */}
                                        {task.assigneeRule.type === "role" && (
                                          <div>
                                            <Label className="text-[10px] text-muted-foreground">
                                              Cargo
                                            </Label>
                                            <select
                                              value={task.assigneeRule.value || ""}
                                              onChange={(e) =>
                                                handleUpdateTask(task.id, {
                                                  assigneeRule: {
                                                    ...task.assigneeRule,
                                                    value: e.target.value,
                                                  },
                                                })
                                              }
                                              className="w-full rounded-lg border border-border bg-background/50 px-2.5 py-1 text-xs text-foreground mt-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                                            >
                                              {roleOptions.map((role) => (
                                                <option key={role.value} value={role.value}>
                                                  {role.label}
                                                </option>
                                              ))}
                                            </select>
                                          </div>
                                        )}

                                        {task.assigneeRule.type === "specific_user" && (
                                          <div>
                                            <Label className="text-[10px] text-muted-foreground">
                                              Usuário
                                            </Label>
                                            <select
                                              value={task.assigneeRule.value || ""}
                                              onChange={(e) =>
                                                handleUpdateTask(task.id, {
                                                  assigneeRule: {
                                                    ...task.assigneeRule,
                                                    value: e.target.value,
                                                  },
                                                })
                                              }
                                              className="w-full rounded-lg border border-border bg-background/50 px-2.5 py-1 text-xs text-foreground mt-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                                            >
                                              {teamMembers.map((m) => (
                                                <option key={m.id} value={m.initials}>
                                                  {m.name} ({m.initials})
                                                </option>
                                              ))}
                                            </select>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Relative Deadline settings */}
                                    <div className="space-y-2 border-b border-border/30 pb-3">
                                      <Label className="text-xs font-semibold flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5" /> Prazo Relativo
                                      </Label>
                                      <div className="grid grid-cols-4 gap-2 items-end">
                                        <div className="col-span-1">
                                          <Label className="text-[10px] text-muted-foreground">
                                            Qtd
                                          </Label>
                                          <Input
                                            type="number"
                                            value={task.relativeDueDate.amount}
                                            onChange={(e) =>
                                              handleUpdateTask(task.id, {
                                                relativeDueDate: {
                                                  ...task.relativeDueDate,
                                                  amount: parseInt(e.target.value) || 0,
                                                },
                                              })
                                            }
                                            className="h-7 text-xs"
                                            min="0"
                                          />
                                        </div>
                                        <div className="col-span-1.5">
                                          <Label className="text-[10px] text-muted-foreground">
                                            Unidade
                                          </Label>
                                          <select
                                            value={task.relativeDueDate.unit}
                                            onChange={(e) =>
                                              handleUpdateTask(task.id, {
                                                relativeDueDate: {
                                                  ...task.relativeDueDate,
                                                  unit: e.target.value as any,
                                                },
                                              })
                                            }
                                            className="w-full rounded-lg border border-border bg-background/50 px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-7"
                                          >
                                            <option value="days">Dias</option>
                                            <option value="weeks">Semanas</option>
                                            <option value="months">Meses</option>
                                          </select>
                                        </div>
                                        <div className="col-span-1.5">
                                          <Label className="text-[10px] text-muted-foreground">
                                            Após
                                          </Label>
                                          <select
                                            value={task.relativeDueDate.base}
                                            onChange={(e) =>
                                              handleUpdateTask(task.id, {
                                                relativeDueDate: {
                                                  ...task.relativeDueDate,
                                                  base: e.target.value as RelativeDateBase,
                                                },
                                              })
                                            }
                                            className="w-full rounded-lg border border-border bg-background/50 px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-7"
                                          >
                                            <option value="contract_signed_at">Assinatura</option>
                                            <option value="project_start_date">Início Proj.</option>
                                            <option value="briefing_completed_at">Briefing</option>
                                            <option value="manual_date">Manual</option>
                                          </select>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Task dependencies selector */}
                                    <div className="space-y-1.5">
                                      <Label className="text-xs font-semibold flex items-center gap-1.5">
                                        <LinkIcon className="h-3.5 w-3.5" /> Depende de outra tarefa
                                      </Label>
                                      {tasks.filter((t) => t.id !== task.id).length > 0 ? (
                                        <div className="max-h-24 overflow-y-auto border border-border/30 rounded-lg p-2 bg-background/20 space-y-1">
                                          {tasks
                                            .filter((t) => t.id !== task.id)
                                            .map((otherTask) => {
                                              const isChecked = task.dependencies.includes(
                                                otherTask.id,
                                              );
                                              const willCauseCircular = isCircular(
                                                task.id,
                                                otherTask.id,
                                              );

                                              return (
                                                <label
                                                  key={otherTask.id}
                                                  className={`flex items-center gap-2 text-xs py-0.5 cursor-pointer ${
                                                    willCauseCircular
                                                      ? "opacity-40 cursor-not-allowed text-destructive"
                                                      : "hover:text-foreground"
                                                  }`}
                                                >
                                                  <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    disabled={willCauseCircular}
                                                    onChange={(e) => {
                                                      const dependencies = e.target.checked
                                                        ? [...task.dependencies, otherTask.id]
                                                        : task.dependencies.filter(
                                                            (id) => id !== otherTask.id,
                                                          );
                                                      handleUpdateTask(task.id, { dependencies });
                                                    }}
                                                    className="rounded border-border bg-background"
                                                  />
                                                  <span className="truncate">
                                                    {otherTask.title || "Sem título"}
                                                  </span>
                                                  {willCauseCircular && (
                                                    <span title="Causa dependência circular!">
                                                      <AlertCircle className="h-3 w-3 inline text-destructive" />
                                                    </span>
                                                  )}
                                                </label>
                                              );
                                            })}
                                        </div>
                                      ) : (
                                        <p className="text-[11px] text-muted-foreground italic">
                                          Nenhuma outra tarefa disponível para vincular.
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Checklist items */}
                                <div className="border-t border-border/35 pt-4">
                                  <TemplateChecklistBuilder
                                    items={task.checklist}
                                    onChange={(checklist) =>
                                      handleUpdateTask(task.id, { checklist })
                                    }
                                  />
                                </div>

                                {/* Footer actions in task detail */}
                                <div className="border-t border-border/35 pt-4 flex items-center justify-between">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRemoveTask(task.id)}
                                    className="h-7 px-2 text-destructive border-border/50 hover:bg-destructive/10 text-xs"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir Tarefa
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => setExpandedTaskId(null)}
                                    className="h-7 px-2 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/20 text-xs"
                                  >
                                    Salvar Alterações
                                  </Button>
                                </div>
                              </div>
                            )}
                          </GlassCard>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic pl-5">
                      Nenhuma tarefa nesta coluna.
                    </p>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
