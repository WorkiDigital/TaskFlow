import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { WhatsAppGroup, WhatsAppConnectionStatus } from "@/data/mockWhatsAppConnection";
import { Search, RefreshCw, Users, Copy, Check, Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ConnectedGroupsManagerProps {
  groups: WhatsAppGroup[];
  connectionStatus: WhatsAppConnectionStatus;
  onSync: () => Promise<void> | void;
  onSetDefaultInternal: (groupId: string) => void;
}

export function ConnectedGroupsManager({ groups, connectionStatus, onSync, onSetDefaultInternal }: ConnectedGroupsManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isConnected = connectionStatus === 'connected';

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await onSync();
      toast.success("Grupos sincronizados com sucesso!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel sincronizar os grupos.");
    } finally {
      setIsSyncing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success("JID copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.jid.includes(searchTerm)
  );

  return (
    <GlassCard className="p-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Gerenciador de Grupos</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Mapeie os grupos disponíveis para uso nas automações.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleSync} 
          disabled={!isConnected || isSyncing}
          className="gap-2 bg-white/5 border-white/10 shrink-0"
        >
          <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
          Sincronizar Grupos
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input 
          placeholder="Buscar por nome ou JID..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 bg-black/20 border-white/10"
        />
      </div>

      <div className="flex-1 overflow-y-auto min-h-[300px] pr-2 -mr-2 space-y-3">
        {!isConnected ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground border border-dashed border-white/10 rounded-xl">
            <Users className="w-8 h-8 mb-2 opacity-50" />
            <p>Conecte o WhatsApp para sincronizar e gerenciar grupos.</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground border border-dashed border-white/10 rounded-xl">
            <p>Nenhum grupo encontrado com este filtro.</p>
          </div>
        ) : (
          filteredGroups.map(group => (
            <div key={group.id} className="p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors group">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 font-medium">
                  {group.name}
                  {group.isDefaultInternal && (
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  )}
                </div>
                <Badge variant="outline" className={cn(
                  "text-[10px] uppercase font-semibold border-transparent",
                  group.type === 'internal' ? 'bg-blue-500/10 text-blue-500' :
                  group.type === 'client' ? 'bg-emerald-500/10 text-emerald-500' :
                  'bg-white/10 text-muted-foreground'
                )}>
                  {group.type}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                <div className="flex items-center gap-1 font-mono bg-black/20 px-2 py-0.5 rounded cursor-pointer hover:text-foreground transition-colors"
                     onClick={() => copyToClipboard(group.jid)}
                     title="Copiar JID"
                >
                  {copiedId === group.jid ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  {group.jid}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {group.membersCount} membros
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                {group.type === 'internal' && !group.isDefaultInternal && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onSetDefaultInternal(group.id)}
                    className="h-7 text-xs gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Star className="w-3 h-3" /> Definir como Padrão Interno
                  </Button>
                )}
                <div className="text-[10px] text-muted-foreground ml-auto">
                  Sinc: {new Date(group.lastSyncAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
}
