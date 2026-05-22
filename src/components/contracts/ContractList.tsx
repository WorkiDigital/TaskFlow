import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Contract, ContractStatus } from "@/lib/types";
import { FileText } from "lucide-react";

const map: Record<ContractStatus, { label: string; tone: Parameters<typeof StatusBadge>[0]["tone"] }> = {
  draft: { label: "Rascunho", tone: "neutral" },
  pending: { label: "Pendente assinatura", tone: "warning" },
  signed: { label: "Assinado", tone: "success" },
  expired: { label: "Expirado", tone: "danger" },
};

const fmt = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);

export function ContractList({ contracts }: { contracts: Contract[] }) {
  return (
    <div className="space-y-3">
      {contracts.map((c) => {
        const s = map[c.status];
        return (
          <GlassCard key={c.id} hover className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium">{c.title}</p>
                <p className="truncate text-xs text-muted-foreground">{c.clientName} · {fmt(c.value)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {new Date(c.createdAt).toLocaleDateString("pt-BR")}
              </span>
              <StatusBadge tone={s.tone}>{s.label}</StatusBadge>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}
