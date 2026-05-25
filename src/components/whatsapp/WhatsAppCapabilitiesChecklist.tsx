import { GlassCard } from "@/components/ui/GlassCard";
import { WhatsAppCapability, WhatsAppConnectionStatus } from "@/data/mockWhatsAppConnection";
import { CheckCircle2, Lock, Clock, AlertCircle } from "lucide-react";

interface WhatsAppCapabilitiesChecklistProps {
  capabilities: WhatsAppCapability[];
  connectionStatus: WhatsAppConnectionStatus;
}

export function WhatsAppCapabilitiesChecklist({
  capabilities,
  connectionStatus,
}: WhatsAppCapabilitiesChecklistProps) {
  const isConnected = connectionStatus === "connected";

  const getStatusIcon = (status: WhatsAppCapability["status"], depends: boolean) => {
    if (depends && !isConnected) {
      return <Lock className="w-4 h-4 text-muted-foreground/50" />;
    }

    switch (status) {
      case "available":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-amber-500" />;
      case "blocked":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "not_configured":
        return <Lock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: WhatsAppCapability["status"], depends: boolean) => {
    if (depends && !isConnected) return "Bloqueado (Sem Conexão)";
    switch (status) {
      case "available":
        return "Disponível";
      case "pending":
        return "Pendente";
      case "blocked":
        return "Bloqueado";
      case "not_configured":
        return "Não Configurado";
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold tracking-tight">Capacidades e Permissões</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Lista de funcionalidades que esta instância pode executar nas automações.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {capabilities.map((cap) => {
          // If not connected, force blocked visually if it depends on connection
          const visualStatus =
            cap.dependsOnConnection && !isConnected ? "not_configured" : cap.status;

          return (
            <div
              key={cap.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-white/5"
            >
              <div className="shrink-0 mt-0.5">
                {getStatusIcon(cap.status, cap.dependsOnConnection)}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${visualStatus === "not_configured" ? "text-muted-foreground" : "text-foreground"}`}
                >
                  {cap.label}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {getStatusText(cap.status, cap.dependsOnConnection)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
