import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { mockOnboardings } from "@/lib/mock-data";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/onboarding")({
  component: OnboardingPage,
});

function OnboardingPage() {
  const [form, setForm] = useState({ goal: "", audience: "", deadline: "", budget: "" });

  useEffect(() => {
    console.log("[OnboardingFlow] página carregada");
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.goal.trim() || !form.audience.trim()) {
      toast.error("Preencha objetivo e público");
      return;
    }
    console.log("[OnboardingFlow] briefing enviado (mock):", form);
    toast.success("Briefing salvo");
    setForm({ goal: "", audience: "", deadline: "", budget: "" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Onboarding</h2>
        <p className="text-sm text-muted-foreground">
          Acompanhe os novos clientes em jornada de ativação.
        </p>
      </div>

      <div className="space-y-4">
        {mockOnboardings.map((o) => (
          <GlassCard key={o.id} hover>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <h3 className="text-lg font-semibold">{o.clientName}</h3>
              </div>
              <div className="text-sm text-muted-foreground">
                Etapa atual · <span className="font-medium text-foreground">{o.currentStep}</span> · {o.progress}%
              </div>
            </div>
            <div className="mt-5">
              <OnboardingFlow onboarding={o} />
            </div>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <h3 className="text-base font-semibold">Novo briefing</h3>
        <p className="text-sm text-muted-foreground">Comece um onboarding capturando o briefing inicial.</p>
        <form onSubmit={submit} className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="goal">Objetivo principal</Label>
            <Textarea id="goal" rows={3} value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="audience">Público-alvo</Label>
            <Input id="audience" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deadline">Prazo</Label>
            <Input id="deadline" placeholder="Ex: 90 dias" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="budget">Orçamento</Label>
            <Input id="budget" placeholder="R$" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit">Salvar briefing</Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
