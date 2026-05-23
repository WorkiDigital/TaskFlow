import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Contract } from "@/lib/types";
import { FileText, ExternalLink } from "lucide-react";
import { ContractStatusBadge } from "@/components/contracts/ContractStatusBadge";
import { listContracts } from "@/services/contractsService";

export function ContractList() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("[ContractList] carregando contratos...");
    listContracts().then((result) => {
      if (result.error) {
        setError(result.error);
        console.error("[ContractList] erro:", result.error);
      } else {
        setContracts(result.data ?? []);
        console.log("[ContractList] contratos carregados:", result.data?.length ?? 0);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">Carregando contratos...</div>;
  }

  if (error) {
    return <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">Erro: {error}</div>;
  }

  if (contracts.length === 0) {
    return (
      <GlassCard className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <FileText className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Nenhum contrato encontrado.</p>
        <p className="text-xs text-muted-foreground/60">Crie um novo contrato usando o editor abaixo.</p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-3">
      {contracts.map((c) => (
        <GlassCard
          key={c.id}
          hover
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className="truncate font-medium">{c.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {c.client_name ?? c.client_id ?? "—"}
                {c.value ? ` · ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(c.value)}` : ""}
              </p>
              {c.signer_email && (
                <p className="text-xs text-muted-foreground">
                  Signatário: {c.signer_name ? `${c.signer_name} · ` : ""}{c.signer_email}
                </p>
              )}
              {c.signed_at && (
                <p className="text-xs text-muted-foreground">
                  Assinado em: {new Date(c.signed_at).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {c.signature_url && (
              <a
                href={c.signature_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:opacity-80"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Assinar
              </a>
            )}
            <span className="text-xs text-muted-foreground">
              {new Date(c.created_at).toLocaleDateString("pt-BR")}
            </span>
            <ContractStatusBadge status={c.status} />
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
