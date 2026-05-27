import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClientDeal, updateClientDeal, generateContractFromTemplate, logClientDealEvent, listDealEvents } from "@/services/contractsService";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock } from "lucide-react";

interface DealReviewDialogProps {
  deal: ClientDeal | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: () => void;
}

export function DealReviewDialog({ deal, open, onOpenChange, onSaved }: DealReviewDialogProps) {
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (open && deal) {
      listDealEvents(deal.id).then(res => {
        if (res.data) setEvents(res.data);
      });
    }
  }, [open, deal]);

  if (!deal) return null;

  const handleAdvanceStatus = async (newStatus: string) => {
    setLoading(true);
    const { error } = await updateClientDeal(deal.id, { status: newStatus });
    if (!error) {
      await logClientDealEvent(deal.id, deal.client_id, "status_change", `Status alterado para: ${newStatus}`);
    }
    setLoading(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Status atualizado com sucesso!");
      onSaved();
      onOpenChange(false);
    }
  };

  const handleGenerateContract = async () => {
    if (!deal.contract_template_id) {
      toast.error("Nenhum template de contrato vinculado a este Deal.");
      return;
    }
    setLoading(true);
    const { error, data } = await generateContractFromTemplate({
      clientId: deal.client_id,
      dealId: deal.id,
      templateId: deal.contract_template_id
    });
    setLoading(false);
    if (error) {
      toast.error(error);
    } else {
      await logClientDealEvent(deal.id, deal.client_id, "contract_generated", "Contrato gerado automaticamente (Rascunho)", { contractId: data?.id });
      toast.success("Contrato gerado com sucesso (Rascunho)!");
      await handleAdvanceStatus("contract_generated");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle>Revisar Deal Comercial</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cliente</p>
              <p className="text-sm font-medium truncate" title={deal.clients?.name || deal.client_id}>
                {deal.clients?.name || `ID: ${deal.client_id.slice(0, 8)}`}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status Atual</p>
              <p className="text-sm font-medium">{deal.status}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor Estimado</p>
              <p className="text-sm font-medium">{deal.value ? `R$ ${deal.value}` : "Não definido"}</p>
            </div>
          </div>

          <div className="mt-6 border-t pt-4">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Timeline de Eventos
            </h4>
            {events.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">Nenhum evento registrado ainda.</p>
            ) : (
              <div className="space-y-3">
                {events.map((ev) => (
                  <div key={ev.id} className="text-sm bg-muted/30 p-2 rounded-md border border-border/50">
                    <p className="font-medium text-xs text-primary mb-1">{ev.type}</p>
                    <p className="text-xs text-muted-foreground">{ev.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-2 opacity-50">
                      {new Date(ev.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-col items-stretch">
          {deal.status === "created" && (
            <Button onClick={() => handleAdvanceStatus("waiting_client_data")} disabled={loading}>
              Solicitar Dados do Cliente
            </Button>
          )}
          {deal.status === "waiting_client_data" && (
            <Button onClick={() => handleAdvanceStatus("under_review")} disabled={loading}>
              Cliente preencheu (Avançar para Revisão)
            </Button>
          )}
          {deal.status === "under_review" && (
            <Button onClick={() => handleAdvanceStatus("ready_to_generate_contract")} disabled={loading}>
              Aprovar Revisão
            </Button>
          )}
          {deal.status === "ready_to_generate_contract" && (
            <Button onClick={handleGenerateContract} disabled={loading}>
              Gerar Contrato (Rascunho)
            </Button>
          )}
          {deal.status === "contract_generated" && (
            <Button onClick={() => handleAdvanceStatus("contract_sent")} disabled={loading}>
              Marcar como Contrato Enviado
            </Button>
          )}
          {deal.status === "contract_sent" && (
            <Button onClick={() => handleAdvanceStatus("contract_signed")} disabled={loading}>
              Marcar como Assinado
            </Button>
          )}
          {deal.status === "contract_signed" && (
            <Button onClick={() => handleAdvanceStatus("ready_for_onboarding")} disabled={loading}>
              Liberar para Onboarding
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
