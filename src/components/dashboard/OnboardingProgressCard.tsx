import { GlassCard } from "@/components/ui/GlassCard";
import { mockOnboardings } from "@/lib/mock-data";

export function OnboardingProgressCard() {
  return (
    <GlassCard className="h-full">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Progresso dos onboardings</h3>
        <p className="text-xs text-muted-foreground">{mockOnboardings.length} em andamento</p>
      </div>
      <ul className="space-y-4">
        {mockOnboardings.map((o) => (
          <li key={o.id}>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-medium">{o.clientName}</span>
              <span className="text-muted-foreground">{o.currentStep} · {o.progress}%</span>
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
    </GlassCard>
  );
}
