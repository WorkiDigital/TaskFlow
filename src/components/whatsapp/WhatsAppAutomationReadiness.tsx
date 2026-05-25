import { GlassCard } from "@/components/ui/GlassCard";
import { WhatsAppConnectionStatus, WhatsAppGroup } from "@/data/mockWhatsAppConnection";
import { CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

interface WhatsAppAutomationReadinessProps {
  connectionStatus: WhatsAppConnectionStatus;
  groups: WhatsAppGroup[];
}

export function WhatsAppAutomationReadiness({
  connectionStatus,
  groups,
}: WhatsAppAutomationReadinessProps) {
  const isConnected = connectionStatus === "connected";
  const hasInternalGroup = groups.some((g) => g.isDefaultInternal);

  // Mocks for other conditions that would be checked in a real app
  const hasWelcomeMessage = true;
  const hasContractMessage = false;

  const conditions = [
    { label: "Instância conectada", met: isConnected },
    { label: "Grupo interno padrão selecionado", met: hasInternalGroup },
    { label: "Mensagem de boas-vindas configurada", met: hasWelcomeMessage },
    { label: "Mensagem de contrato configurada", met: hasContractMessage },
  ];

  const allMet = conditions.every((c) => c.met);

  return (
    <GlassCard className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Saúde da Automação</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Verifique se tudo está pronto para os fluxos de onboarding.
          </p>
        </div>
        {allMet ? (
          <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" /> Pronto
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full text-xs font-semibold">
            <AlertTriangle className="w-4 h-4" /> Incompleto
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {conditions.map((condition, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-white/5"
          >
            {condition.met ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border border-dashed border-muted-foreground/50 shrink-0" />
            )}
            <span
              className={`text-sm ${condition.met ? "text-foreground" : "text-muted-foreground"}`}
            >
              {condition.label}
            </span>
          </div>
        ))}
      </div>

      {!allMet && (
        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <p className="text-xs text-amber-500/90 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            As automações dependentes de WhatsApp podem ser bloqueadas até que estas pendências
            sejam resolvidas.
          </p>
        </div>
      )}
    </GlassCard>
  );
}
