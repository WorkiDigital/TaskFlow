import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getContractStatusCounts, type ContractStatusCount } from "@/services/dashboardService";

export function ContractsStatusCard() {
  const [counts, setCounts] = useState<ContractStatusCount[] | null>(null);

  useEffect(() => {
    getContractStatusCounts()
      .then(setCounts)
      .catch((e) => {
        console.error("[Dashboard] contratos:", e);
        setCounts([]);
      });
  }, []);

  const total = counts?.reduce((acc, c) => acc + c.count, 0) ?? 0;

  return (
    <GlassCard className="h-full">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Status dos contratos</h3>
        <p className="text-xs text-muted-foreground">
          {counts ? `${total} contrato${total !== 1 ? "s" : ""} no total` : "Carregando..."}
        </p>
      </div>

      {!counts ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {counts.map((c) => {
            const pct = total === 0 ? 0 : (c.count / total) * 100;
            return (
              <div key={c.status}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{c.label}</span>
                  <span className="font-medium">{c.count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className={`h-full rounded-full transition-all ${c.color}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          {total === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhum contrato criado ainda.
            </p>
          )}
        </div>
      )}
    </GlassCard>
  );
}
