import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function GlassCard({ className, hover = false, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass-card p-6 transition-all duration-300",
        hover && "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-glow)]",
        className,
      )}
      {...props}
    />
  );
}
