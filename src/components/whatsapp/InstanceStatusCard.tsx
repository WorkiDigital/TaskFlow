import { WhatsAppInstance, WhatsAppConnectionStatus } from "@/data/mockWhatsAppConnection";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { RefreshCw, PowerOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface InstanceStatusCardProps {
  instance: WhatsAppInstance;
  onConnect: () => void;
  onDisconnect: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export function InstanceStatusCard({ instance, onConnect, onDisconnect, onRefresh, isLoading }: InstanceStatusCardProps) {
  const getStatusDisplay = (status: WhatsAppConnectionStatus) => {
    switch (status) {
      case 'connected': return <StatusBadge tone="success">Conectado</StatusBadge>;
      case 'waiting_qr': return <StatusBadge tone="warning">Aguardando QR Code</StatusBadge>;
      case 'connecting': return <StatusBadge tone="neutral">Conectando...</StatusBadge>;
      case 'error': return <StatusBadge tone="danger">Erro</StatusBadge>;
      case 'expired': return <StatusBadge tone="danger">Expirado</StatusBadge>;
      case 'disconnected':
      default: return <StatusBadge tone="danger">Desconectado</StatusBadge>;
    }
  };

  return (
    <GlassCard className="p-6 flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Status da Instância</h3>
          <p className="text-sm text-muted-foreground mt-1">Monitore o estado atual da conexão com a Evolution API.</p>
        </div>
        {getStatusDisplay(instance.status)}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Nome da Instância</p>
          <p className="font-medium">{instance.instanceName}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Número Conectado</p>
          <p className="font-medium">{instance.phoneNumber || "---"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Nome no WhatsApp</p>
          <p className="font-medium">{instance.displayName}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Última Sincronização</p>
          <p className="font-medium text-sm">{instance.lastSyncAt ? new Date(instance.lastSyncAt).toLocaleString('pt-BR') : "Nunca"}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/5">
        {instance.status === 'disconnected' || instance.status === 'error' || instance.status === 'expired' ? (
          <Button onClick={onConnect} disabled={isLoading} className="bg-[#25D366] hover:bg-[#25D366]/90 text-white gap-2">
            Conectar Instância
          </Button>
        ) : (
          <Button onClick={onDisconnect} variant="destructive" disabled={isLoading} className="gap-2">
            <PowerOff className="w-4 h-4" /> Desconectar
          </Button>
        )}
        <Button variant="outline" onClick={onRefresh} disabled={isLoading} className="gap-2 bg-white/5 hover:bg-white/10 border-white/10">
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          Atualizar Status
        </Button>
      </div>
    </GlassCard>
  );
}
