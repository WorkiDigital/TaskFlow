import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AgentActionPreview } from './AgentActionPreview';
import type { AgentAction } from '@/services/agentService';

interface AgentApprovalDialogProps {
  action: AgentAction | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (actionId: string) => Promise<void>;
  isExecuting: boolean;
}

export function AgentApprovalDialog({
  action,
  isOpen,
  onOpenChange,
  onConfirm,
  isExecuting,
}: AgentApprovalDialogProps) {
  if (!action) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-white/10 bg-slate-950/90 text-slate-100 max-w-md backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Confirmar execução</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Revise o que será feito antes de confirmar.
          </DialogDescription>
        </DialogHeader>

        <AgentActionPreview
          action={action}
          onConfirmExecute={onConfirm}
          onClose={() => onOpenChange(false)}
          isExecuting={isExecuting}
        />
      </DialogContent>
    </Dialog>
  );
}
