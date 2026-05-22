import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  delta?: { value: string; positive: boolean };
  tint?: "primary" | "accent" | "success" | "warning";
}

const tints: Record<NonNullable<MetricCardProps["tint"]>, string> = {
  primary: "from-primary/30 to-primary/0 text-primary",
  accent: "from-accent/30 to-accent/0 text-accent",
  success: "from-success/30 to-success/0 text-success",
  warning: "from-warning/30 to-warning/0 text-warning",
};

export function MetricCard({ label, value, icon: Icon, delta, tint = "primary" }: MetricCardProps) {
  return (
    <GlassCard hover className="relative overflow-hidden">
      <div
        className={cn(
          "pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br blur-2xl opacity-60",
          tints[tint],
        )}
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className={cn("rounded-xl border border-border bg-background/40 p-2.5", tints[tint].split(" ").pop())}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {delta && (
        <div className="mt-4 flex items-center gap-1 text-xs">
          {delta.positive ? (
            <ArrowUpRight className="h-3.5 w-3.5 text-success" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
          )}
          <span className={delta.positive ? "text-success" : "text-destructive"}>{delta.value}</span>
          <span className="text-muted-foreground">vs. mês anterior</span>
        </div>
      )}
    </GlassCard>
  );
}
