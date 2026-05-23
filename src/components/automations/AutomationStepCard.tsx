import { AutomationStep } from "@/data/mockAutomations";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Edit2, AlertCircle, CheckCircle2, Clock, ChevronUp, ChevronDown } from "lucide-react";

interface AutomationStepCardProps {
  step: AutomationStep;
  isFirst: boolean;
  isLast: boolean;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (id: string) => void;
  onReorder: (id: string, direction: 'up' | 'down') => void;
  hasDependencyError?: boolean;
  isBlockedByWhatsApp?: boolean;
}

export function AutomationStepCard({ step, isFirst, isLast, onToggle, onEdit, onReorder, hasDependencyError, isBlockedByWhatsApp }: AutomationStepCardProps) {
  const getStatusDisplay = () => {
    switch(step.configStatus) {
      case 'configured':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-transparent gap-1 text-[10px] uppercase font-bold"><CheckCircle2 className="w-3 h-3" /> Configurado</Badge>;
      case 'partial':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-transparent gap-1 text-[10px] uppercase font-bold"><AlertCircle className="w-3 h-3" /> Parcial</Badge>;
      case 'not_configured':
      default:
        return <Badge variant="outline" className="bg-white/10 text-muted-foreground border-transparent gap-1 text-[10px] uppercase font-bold"><Clock className="w-3 h-3" /> Pendente</Badge>;
    }
  };

  return (
    <div className={cn(
      "glass-card p-4 flex items-center gap-4 transition-all duration-200 border",
      step.enabled ? "border-white/10 bg-white/5" : "border-transparent bg-black/20 opacity-70",
      hasDependencyError && "border-red-500/30 bg-red-500/5",
      isBlockedByWhatsApp && "border-amber-500/30 bg-amber-500/5 opacity-90"
    )}>
      <div className="flex flex-col gap-1 items-center justify-center shrink-0">
        <button 
          onClick={() => onReorder(step.id, 'up')}
          disabled={isFirst}
          className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onReorder(step.id, 'down')}
          disabled={isLast}
          className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
      
      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 font-mono text-xs font-bold text-muted-foreground border border-white/5">
        {step.order}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className={cn("font-medium text-sm truncate", step.enabled ? "text-foreground" : "text-muted-foreground")}>
            {step.name}
          </h4>
          {!step.isAutomatic && (
            <Badge variant="secondary" className="text-[9px] h-4 bg-white/10">Manual</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{step.description}</p>
        
        {hasDependencyError && (
          <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Etapa dependente está desativada ou fora de ordem.
          </p>
        )}

        {isBlockedByWhatsApp && (
          <p className="text-[10px] text-amber-500 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Esta etapa depende da conexão WhatsApp. Conecte uma instância na aba Configurações {'>'} WhatsApp.
          </p>
        )}
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {step.enabled && getStatusDisplay()}
        
        <Switch 
          checked={step.enabled && !isBlockedByWhatsApp} 
          disabled={isBlockedByWhatsApp}
          onCheckedChange={(checked) => onToggle(step.id, checked)} 
        />
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onEdit(step.id)}
          disabled={isBlockedByWhatsApp}
          className={cn("h-8 gap-1.5", (!step.enabled || isBlockedByWhatsApp) && "opacity-50 pointer-events-none")}
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Configurar</span>
        </Button>
      </div>
    </div>
  );
}
