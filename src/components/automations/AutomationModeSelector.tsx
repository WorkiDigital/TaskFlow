import { AutomationMode } from "@/data/mockAutomations";
import { cn } from "@/lib/utils";
import { CheckCircle2, Copy, FileText, Settings, Smartphone, Users } from "lucide-react";

interface ModeOption {
  id: AutomationMode;
  title: string;
  description: string;
  icon: any;
  color: string;
}

const modes: ModeOption[] = [
  {
    id: 'complete',
    title: 'Fluxo Completo',
    description: 'Ativa todas as etapas de onboarding: formulários, contratos, WhatsApp e briefing.',
    icon: Copy,
    color: 'text-primary bg-primary/10 border-primary/20'
  },
  {
    id: 'custom',
    title: 'Personalizado',
    description: 'Escolha manualmente quais etapas você quer ativar no seu fluxo.',
    icon: Settings,
    color: 'text-zinc-400 bg-white/5 border-white/10'
  },
  {
    id: 'whatsapp_only',
    title: 'Somente WhatsApp',
    description: 'Focado em criar o grupo, adicionar participantes e enviar mensagens automáticas.',
    icon: Smartphone,
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
  },
  {
    id: 'contract_only',
    title: 'Somente Contrato',
    description: 'Fluxo enxuto: formulário de captação e geração/assinatura do contrato.',
    icon: FileText,
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
  },
  {
    id: 'internal_notification_only',
    title: 'Notificação Interna',
    description: 'Apenas para avisar sua equipe no grupo do WhatsApp sobre novos clientes.',
    icon: Users,
    color: 'text-orange-500 bg-orange-500/10 border-orange-500/20'
  }
];

interface AutomationModeSelectorProps {
  selectedMode: AutomationMode;
  onSelectMode: (mode: AutomationMode) => void;
}

export function AutomationModeSelector({ selectedMode, onSelectMode }: AutomationModeSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-foreground">Modo da Automação</h3>
        <p className="text-sm text-muted-foreground">Escolha um template base. Isso vai pré-configurar quais etapas estarão ativas.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modes.map(mode => {
          const isSelected = selectedMode === mode.id;
          const Icon = mode.icon;
          
          return (
            <button
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className={cn(
                "relative flex flex-col items-start text-left p-5 rounded-xl border transition-all duration-200",
                isSelected 
                  ? "bg-primary/5 border-primary/50 shadow-[0_0_15px_rgba(var(--color-primary),0.1)]" 
                  : "bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10"
              )}
            >
              {isSelected && (
                <div className="absolute top-4 right-4">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
              )}
              
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border mb-3", mode.color)}>
                <Icon className="w-5 h-5" />
              </div>
              
              <h4 className="font-semibold text-foreground mb-1">{mode.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{mode.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
