import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AgentAction, ActionType } from "@/services/agentService";

const actionTypeLabel: Record<ActionType, string> = {
  create_task: "Criar tarefa",
  create_task_checklist: "Criar checklist",
  assign_task_owner: "Atribuir responsável",
  update_due_date: "Definir prazo",
  add_automation_step: "Adicionar step de automação",
  link_template_to_contract: "Vincular template a contrato",
  create_project_column: "Criar coluna no projeto",
  update_task_priority: "Atualizar prioridade",
};

interface AgentActionPreviewProps {
  action: AgentAction;
  onConfirmExecute: (actionId: string) => void;
  onClose: () => void;
  isExecuting: boolean;
}

export function AgentActionPreview({
  action,
  onConfirmExecute,
  onClose,
  isExecuting,
}: AgentActionPreviewProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted-foreground mb-1">Tipo de ação</p>
        <p className="text-sm font-semibold text-foreground">
          {actionTypeLabel[action.action_type]}
        </p>
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-2">O agente irá executar:</p>
        <ul className="space-y-2">
          {action.preview_items.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
              <span className="text-sm text-foreground/90">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {action.status === "approved" && (
        <div className="rounded-lg border border-success/30 bg-success/10 p-3">
          <p className="text-xs text-success">
            Esta ação foi aprovada e está pronta para execução.
          </p>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 border-white/10 text-muted-foreground hover:text-foreground"
          onClick={onClose}
          disabled={isExecuting}
        >
          Cancelar
        </Button>
        <Button
          size="sm"
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          onClick={() => onConfirmExecute(action.id)}
          disabled={isExecuting || action.status !== "approved"}
        >
          {isExecuting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
              Executando...
            </>
          ) : (
            "Aprovar e executar"
          )}
        </Button>
      </div>
    </div>
  );
}
