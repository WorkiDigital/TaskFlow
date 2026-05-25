import { Check, Eye, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AgentAction, ActionType } from "@/services/agentService";

const actionTypeLabel: Record<ActionType, string> = {
  create_task: "Criar tarefa",
  create_task_checklist: "Criar checklist",
  assign_task_owner: "Atribuir responsável",
  update_due_date: "Definir prazo",
  add_automation_step: "Adicionar step",
  link_template_to_contract: "Vincular template",
  create_project_column: "Criar coluna",
  update_task_priority: "Atualizar prioridade",
};

const actionTypeColor: Record<ActionType, string> = {
  create_task: "bg-primary/15 text-primary border-primary/30",
  create_task_checklist: "bg-info/15 text-info border-info/30",
  assign_task_owner: "bg-success/15 text-success border-success/30",
  update_due_date: "bg-warning/15 text-warning border-warning/30",
  add_automation_step: "bg-primary/15 text-primary border-primary/30",
  link_template_to_contract: "bg-info/15 text-info border-info/30",
  create_project_column: "bg-success/15 text-success border-success/30",
  update_task_priority: "bg-warning/15 text-warning border-warning/30",
};

interface AgentSuggestedActionProps {
  action: AgentAction;
  onApprove: (id: string) => void;
  onDismiss: (id: string) => void;
  onViewPreview: (action: AgentAction) => void;
  isApproving?: boolean;
}

export function AgentSuggestedAction({
  action,
  onApprove,
  onDismiss,
  onViewPreview,
  isApproving,
}: AgentSuggestedActionProps) {
  const isApproved = action.status === "approved";

  return (
    <div
      className={cn(
        "glass-card p-4 transition-all duration-200",
        isApproved && "border-success/30 bg-success/5",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                actionTypeColor[action.action_type],
              )}
            >
              {actionTypeLabel[action.action_type]}
            </span>
            {isApproved && (
              <span className="inline-flex items-center gap-1 text-xs text-success">
                <Check className="h-3 w-3" />
                Aprovado
              </span>
            )}
          </div>

          <p className="text-sm font-medium text-foreground leading-snug">{action.title}</p>

          {action.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{action.description}</p>
          )}

          <div className="flex items-center gap-2 mt-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => onViewPreview(action)}
            >
              <Eye className="h-3 w-3 mr-1" />
              Ver detalhes
            </Button>

            {!isApproved && (
              <Button
                size="sm"
                className="h-7 px-3 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => onApprove(action.id)}
                disabled={isApproving}
              >
                {isApproving ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Aprovar
                  </>
                )}
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive ml-auto"
              onClick={() => onDismiss(action.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
