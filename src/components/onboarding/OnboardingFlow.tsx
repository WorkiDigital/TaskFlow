import { Check, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Onboarding } from "@/lib/types";

interface OnboardingFlowProps {
  onboarding: Onboarding;
}

export function OnboardingFlow({ onboarding }: OnboardingFlowProps) {
  return (
    <div className="flex w-full items-center gap-2 overflow-x-auto pb-2">
      {onboarding.steps.map((step, idx) => {
        const isDone = step.status === "done";
        const isActive = step.status === "in_progress";
        return (
          <div key={step.id} className="flex flex-1 items-center gap-2 min-w-[140px]">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                  isDone && "border-success/40 bg-success/15 text-success",
                  isActive && "border-primary/40 bg-primary/15 text-primary",
                  !isDone && !isActive && "border-border bg-background/30 text-muted-foreground",
                )}
              >
                {isDone ? (
                  <Check className="h-4 w-4" />
                ) : isActive ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
              </div>
              <span
                className={cn(
                  "text-sm whitespace-nowrap",
                  isActive ? "font-medium" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < onboarding.steps.length - 1 && (
              <div
                className={cn("h-px flex-1 min-w-[16px]", isDone ? "bg-success/40" : "bg-border")}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
