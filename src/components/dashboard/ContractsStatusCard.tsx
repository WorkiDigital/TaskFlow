import { GlassCard } from "@/components/ui/GlassCard";
import { mockContracts } from "@/lib/mock-data";

const labels = {
  draft: "Rascunho",
  pending: "Pendente",
  signed: "Assinado",
  expired: "Expirado",
} as const;

const colors = {
  draft: "bg-muted-foreground/60",
  pending: "bg-warning",
  signed: "bg-success",
  expired: "bg-destructive",
} as const;

export function ContractsStatusCard() {
  const total = mockContracts.length;
  const counts = mockContracts.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <GlassCard className="h-full">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Status dos contratos</h3>
        <p className="text-xs text-muted-foreground">{total} contratos no total</p>
      </div>
      <div className="space-y-4">
        {(Object.keys(labels) as Array<keyof typeof labels>).map((k) => {
          const n = counts[k] ?? 0;
          const pct = total === 0 ? 0 : (n / total) * 100;
          return (
            <div key={k}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{labels[k]}</span>
                <span className="font-medium">{n}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                <div className={`h-full rounded-full ${colors[k]} transition-all`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
