import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Loader2, QrCode } from "lucide-react";
import { WhatsAppConnectionStatus } from "@/data/mockWhatsAppConnection";

interface QRCodeConnectionCardProps {
  status: WhatsAppConnectionStatus;
  onGenerateQR: () => void;
  isLoading: boolean;
  qrCode?: string;
  pairingCode?: string;
}

export function QRCodeConnectionCard({
  status,
  onGenerateQR,
  isLoading,
  qrCode,
  pairingCode,
}: QRCodeConnectionCardProps) {
  const [timeLeft, setTimeLeft] = useState(45);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === "waiting_qr" && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [status, timeLeft]);

  // Reset timer when a new QR is requested
  useEffect(() => {
    if (status === "waiting_qr") {
      setTimeLeft(45);
    }
  }, [status]);

  if (status === "connected") {
    return (
      <GlassCard className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[300px] border-emerald-500/30 bg-emerald-500/5">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 text-emerald-500">
          <QrCode className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-semibold text-emerald-500 mb-2">WhatsApp Conectado</h3>
        <p className="text-sm text-muted-foreground">
          Sua instância está pronta para enviar e receber mensagens.
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
      <div className="w-full flex justify-between items-start mb-6">
        <h3 className="text-lg font-semibold tracking-tight text-left">Pareamento</h3>
        {status === "waiting_qr" && (
          <span className="text-xs font-mono font-medium text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md">
            Expira em {timeLeft}s
          </span>
        )}
      </div>

      {status === "waiting_qr" ? (
        <div className="flex flex-col items-center">
          <div className="bg-white p-4 rounded-xl mb-4">
            {qrCode?.startsWith("data:image") || qrCode?.startsWith("http") ? (
              <img
                src={qrCode}
                alt="QR Code WhatsApp"
                className="w-48 h-48 object-contain mix-blend-multiply"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-center text-xs text-black/70">
                QR Code indisponivel. Gere novamente em alguns segundos.
              </div>
            )}
          </div>
          {pairingCode && (
            <p className="font-mono text-sm tracking-widest bg-white/5 px-4 py-2 rounded-lg border border-white/10 mb-4">
              {pairingCode}
            </p>
          )}
          <div className="text-xs text-muted-foreground text-left max-w-xs space-y-1">
            <p>1. Abra o WhatsApp no celular</p>
            <p>
              2. Toque em <strong>Dispositivos conectados</strong>
            </p>
            <p>
              3. Toque em <strong>Conectar um dispositivo</strong>
            </p>
            <p>4. Aponte a câmera para o QR Code</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 w-full">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
            <QrCode className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Gere um QR Code para conectar seu aparelho.
          </p>
          <Button onClick={onGenerateQR} disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando...
              </>
            ) : (
              "Gerar QR Code"
            )}
          </Button>
        </div>
      )}
    </GlassCard>
  );
}
