import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Plus, Search, User, FileText, CheckCircle2 } from "lucide-react";
import { listClientDeals, ClientDeal } from "@/services/contractsService";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { DealReviewDialog } from "./DealReviewDialog";

const STATUS_COLUMNS = [
  { id: "created", label: "Novo" },
  { id: "waiting_client_data", label: "Aguardando dados" },
  { id: "under_review", label: "Em revisão" },
  { id: "ready_to_generate_contract", label: "Pronto p/ contrato" },
  { id: "contract_generated", label: "Contrato gerado" },
  { id: "contract_sent", label: "Contrato enviado" },
  { id: "contract_signed", label: "Assinado" },
  { id: "ready_for_onboarding", label: "Pronto p/ Onboarding" },
];

export function PreOnboardingTab() {
  const [deals, setDeals] = useState<ClientDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewDeal, setReviewDeal] = useState<ClientDeal | null>(null);

  const loadDeals = async () => {
    setLoading(true);
    const res = await listClientDeals();
    if (res.error) {
      toast.error(res.error);
    } else {
      setDeals(res.data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDeals();
  }, []);

  if (loading) {
    return <div className="py-10 text-center text-sm text-muted-foreground">Carregando deals...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Pré-Onboarding</h3>
          <p className="text-sm text-muted-foreground">
            Acompanhe a jornada do cliente desde o fechamento até a assinatura do contrato.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={loadDeals}>Atualizar</Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
        {STATUS_COLUMNS.map((col) => {
          const colDeals = deals.filter((d) => d.status === col.id);
          return (
            <div key={col.id} className="min-w-[280px] w-[280px] shrink-0 space-y-3 snap-start">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-sm font-medium text-muted-foreground">{col.label}</h4>
                <Badge variant="secondary" className="text-xs">{colDeals.length}</Badge>
              </div>
              <div className="space-y-3">
                {colDeals.map((deal) => (
                  <GlassCard key={deal.id} className="p-3 space-y-3 cursor-pointer hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate max-w-[150px]" title={deal.clients?.name || `Cliente ${deal.client_id.slice(0, 4)}`}>
                            {deal.clients?.name || `Cliente ${deal.client_id.slice(0, 4)}`}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{deal.value ? `R$ ${deal.value}` : "Sem valor"}</p>
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border flex justify-end">
                      <Button size="sm" variant="ghost" className="h-7 text-xs w-full justify-center" onClick={() => setReviewDeal(deal)}>
                        Revisar
                      </Button>
                    </div>
                  </GlassCard>
                ))}
                {colDeals.length === 0 && (
                  <div className="h-24 rounded-xl border border-dashed border-border/50 flex items-center justify-center text-xs text-muted-foreground">
                    Vazio
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <DealReviewDialog
        deal={reviewDeal}
        open={!!reviewDeal}
        onOpenChange={(o) => !o && setReviewDeal(null)}
        onSaved={loadDeals}
      />
    </div>
  );
}
