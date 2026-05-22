import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ContractBuilder() {
  const [form, setForm] = useState({
    title: "Retainer mensal — ",
    client: "",
    value: "",
    clauses: "1. Escopo do serviço.\n2. Prazos de entrega.\n3. Forma de pagamento.\n4. Confidencialidade.",
  });

  const save = () => {
    if (!form.title.trim() || !form.client.trim()) {
      toast.error("Título e cliente são obrigatórios");
      return;
    }
    console.log("[Contracts] contrato salvo (mock):", form);
    toast.success("Contrato salvo como rascunho");
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <GlassCard>
        <h3 className="text-base font-semibold">Editor</h3>
        <p className="text-sm text-muted-foreground">Monte um contrato a partir do template padrão.</p>

        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ct-title">Título</Label>
            <Input id="ct-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ct-client">Cliente</Label>
              <Input id="ct-client" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ct-value">Valor (R$)</Label>
              <Input id="ct-value" inputMode="numeric" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ct-clauses">Cláusulas</Label>
            <Textarea id="ct-clauses" rows={8} value={form.clauses} onChange={(e) => setForm({ ...form, clauses: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => toast("Pré-visualização (demo)")}>Pré-visualizar</Button>
            <Button onClick={save}>Salvar rascunho</Button>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="bg-background/40">
        <h3 className="text-base font-semibold">Pré-visualização</h3>
        <div className="mt-5 rounded-xl border border-border bg-background/50 p-5 text-sm leading-relaxed">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Contrato</p>
          <h4 className="mt-1 text-lg font-semibold">{form.title || "—"}</h4>
          <p className="mt-1 text-muted-foreground">
            Cliente: <span className="text-foreground">{form.client || "—"}</span>
          </p>
          <p className="text-muted-foreground">
            Valor: <span className="text-foreground">{form.value ? `R$ ${form.value}` : "—"}</span>
          </p>
          <pre className="mt-4 whitespace-pre-wrap font-sans text-sm text-foreground/90">{form.clauses}</pre>
        </div>
      </GlassCard>
    </div>
  );
}
