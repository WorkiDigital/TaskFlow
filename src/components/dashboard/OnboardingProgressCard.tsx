import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getOnboardingProgress, type OnboardingProgressItem } from "@/services/dashboardService";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  running: "Em andamento",
  awaiting_form: "Aguardando form.",
  partial: "Parcial",
  completed: "Concluído",
  failed: "Falhou",
};

const STATUS_COLOR: Record<string, string> = {
  running: "text-blue-400",
  awaiting_form: "text-yellow-400",
  partial: "text-orange-400",
  completed: "text-emerald-400",
  failed: "text-destructive",
};

export function OnboardingProgressCard() {
  const [items, setItems] = useState<OnboardingProgressItem[] | null>(null);

  useEffect(() => {
    getOnboardingProgress()
      .then(setItems)
      .catch((e) => {
        console.error("[Dashboard] onboardings:", e);
        setItems([]);
      });
  }, []);

  return (
    <GlassCard className="h-full">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Progresso dos onboardings</h3>
        <p className="text-xs text-muted-foreground">
          {items ? `${items.length} recente${items.length !== 1 ? "s" : ""}` : "Carregando..."}
        </p>
      </div>

      {!items ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Nenhum onboarding iniciado ainda.
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map((o) => (
            <li key={o.id}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-medium">{o.clientName}</span>
                <span className={cn("text-xs", STATUS_COLOR[o.status] ?? "text-muted-foreground")}>
                  {STATUS_LABELS[o.status] ?? o.status}
                  {o.totalSteps > 0 && ` · ${o.completedSteps}/${o.totalSteps}`}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                  style={{ width: `${o.progress}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
