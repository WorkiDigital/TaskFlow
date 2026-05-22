import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import type { Client, ClientStatus } from "@/lib/types";
import { MoreHorizontal } from "lucide-react";

const statusMap: Record<ClientStatus, { label: string; tone: Parameters<typeof StatusBadge>[0]["tone"] }> = {
  active: { label: "Ativo", tone: "success" },
  onboarding: { label: "Onboarding", tone: "primary" },
  paused: { label: "Pausado", tone: "warning" },
  churned: { label: "Churn", tone: "danger" },
};

const fmt = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);

export function ClientsTable({ clients }: { clients: Client[] }) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-2xl border border-border md:block">
        <table className="w-full">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Empresa</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">MRR</th>
              <th className="px-4 py-3 font-medium">Desde</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {clients.map((c) => {
              const s = statusMap[c.status];
              return (
                <tr key={c.id} className="transition-colors hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.email}</div>
                  </td>
                  <td className="px-4 py-3">{c.company}</td>
                  <td className="px-4 py-3"><StatusBadge tone={s.tone}>{s.label}</StatusBadge></td>
                  <td className="px-4 py-3">{c.mrr > 0 ? fmt(c.mrr) : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(c.createdAt).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" aria-label="Ações">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="space-y-3 md:hidden">
        {clients.map((c) => {
          const s = statusMap[c.status];
          return (
            <div key={c.id} className="glass-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.company}</p>
                </div>
                <StatusBadge tone={s.tone}>{s.label}</StatusBadge>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>MRR {c.mrr > 0 ? fmt(c.mrr) : "—"}</span>
                <span>{new Date(c.createdAt).toLocaleDateString("pt-BR")}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
