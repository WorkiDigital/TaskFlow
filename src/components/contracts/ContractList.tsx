import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Contract, ContractStatus } from "@/lib/types";
import { FileText, FolderSync } from "lucide-react";
import { mockAgencyTemplates } from "@/data/mockAgencyTemplates";
import { AgencyTemplate } from "@/data/templateTypes";

const map: Record<ContractStatus, { label: string; tone: Parameters<typeof StatusBadge>[0]["tone"] }> = {
  draft: { label: "Rascunho", tone: "neutral" },
  pending: { label: "Pendente assinatura", tone: "warning" },
  signed: { label: "Assinado", tone: "success" },
  expired: { label: "Expirado", tone: "danger" },
};

const fmt = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);

export function ContractList({ contracts }: { contracts: Contract[] }) {
  // Load templates from localStorage or fallback to defaults
  let templates: AgencyTemplate[] = mockAgencyTemplates;
  try {
    const raw = localStorage.getItem("taskflow_templates");
    if (raw) templates = JSON.parse(raw);
  } catch (e) {
    console.error("[ContractList] Error loading templates for contract badge:", e);
  }

  return (
    <div className="space-y-3">
      {contracts.map((c) => {
        const s = map[c.status];
        
        // Find if any template is linked to this contract title (case-insensitive check)
        const linkedTemplate = templates.find(
          (t) => t.linkedContractTitle?.toLowerCase() === c.title?.toLowerCase()
        );

        return (
          <GlassCard key={c.id} hover className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium">{c.title}</p>
                <p className="truncate text-xs text-muted-foreground">{c.clientName} · {fmt(c.value)}</p>
                {linkedTemplate && (
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full w-fit">
                    <FolderSync className="h-3 w-3" />
                    <span>Autocriação: {linkedTemplate.name} ({linkedTemplate.columns.length} colunas, {linkedTemplate.tasks.length} tar.)</span>
                  </div>
                )}
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
