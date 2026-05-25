import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { WhatsAppConnectionStatus } from "@/data/mockWhatsAppConnection";
import { evolutionService } from "@/services/evolutionService";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WhatsAppTestMessagePanelProps {
  connectionStatus: WhatsAppConnectionStatus;
  instanceName: string;
}

export function WhatsAppTestMessagePanel({
  connectionStatus,
  instanceName,
}: WhatsAppTestMessagePanelProps) {
  const [target, setTarget] = useState("");
  const [message, setMessage] = useState("");
  const [linkPreview, setLinkPreview] = useState(true);
  const [mentionsEveryOne, setMentionsEveryOne] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const isConnected = connectionStatus === "connected";

  const handleSend = async () => {
    if (!target.trim() || !message.trim()) {
      toast.error("Preencha o destino e a mensagem.");
      return;
    }

    setIsSending(true);
    try {
      await evolutionService.sendTextMessage({
        instanceName,
        number: target,
        text: message,
        delay: 1200,
        linkPreview,
        mentionsEveryOne,
        mentioned: [],
      });
      toast.success("Mensagem de teste enviada com sucesso!");
      setMessage("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel enviar a mensagem.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <GlassCard className="p-6 flex flex-col h-full">
      <div className="mb-6">
        <h3 className="text-lg font-semibold tracking-tight">Mensagem de Teste</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Valide se a instância está enviando mensagens corretamente.
        </p>
      </div>

      {!isConnected ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground border border-dashed border-white/10 rounded-xl min-h-[300px]">
          <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
          <p>Conecte o WhatsApp para enviar mensagens de teste.</p>
        </div>
      ) : (
        <div className="flex-1 space-y-4">
          <div className="space-y-1.5">
            <Label>Destino (Número ou JID)</Label>
            <Input
              placeholder="Ex: 5511999999999 ou 12036...01@g.us"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="bg-black/20"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Mensagem</Label>
            <Textarea
              placeholder="Digite sua mensagem de teste..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="bg-black/20 resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
            <div className="flex items-center gap-2">
              <Switch checked={linkPreview} onCheckedChange={setLinkPreview} id="link-preview" />
              <Label htmlFor="link-preview" className="text-xs font-normal cursor-pointer">
                Preview de Links
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={mentionsEveryOne}
                onCheckedChange={setMentionsEveryOne}
                id="mention-all"
              />
              <Label htmlFor="mention-all" className="text-xs font-normal cursor-pointer">
                Mencionar Todos
              </Label>
            </div>
          </div>

          <div className="pt-4 mt-auto">
            <Button
              onClick={handleSend}
              disabled={isSending || !target.trim() || !message.trim()}
              className="w-full gap-2 bg-primary hover:bg-primary/90"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isSending ? "Enviando..." : "Enviar Teste"}
            </Button>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
