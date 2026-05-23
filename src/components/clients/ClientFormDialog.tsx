import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/services/supabase";
import { onboardingService } from "@/services/onboardingService";

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreate: () => void;
}

export function ClientFormDialog({ open, onOpenChange, onCreate }: ClientFormDialogProps) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    const phone = form.phone.replace(/\D/g, "");

    if (!form.name.trim()) next.name = "Nome e obrigatorio";
    if (!form.email.includes("@")) next.email = "E-mail invalido";
    if (phone.length < 10) next.phone = "WhatsApp invalido";
    if (!form.company.trim()) next.company = "Empresa e obrigatoria";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);

    const { data: createdClient, error } = await supabase.from("clients").insert([
      {
        name: form.name,
        email: form.email,
        phone,
        address: form.company,
      },
    ]).select("id").single();

    if (error) {
      setLoading(false);
      console.error(error);
      toast.error("Erro ao criar cliente");
      return;
    }

    try {
      if (createdClient?.id) {
        const run = await onboardingService.startRun(createdClient.id);
        toast.success(run.status === "completed"
          ? "Cliente criado e onboarding executado"
          : "Cliente criado e onboarding iniciado com pendencias");
      } else {
        toast.success("Cliente criado com sucesso");
      }
    } catch (runError) {
      console.error(runError);
      toast.error(runError instanceof Error ? runError.message : "Cliente criado, mas onboarding falhou");
    } finally {
      setLoading(false);
    }

    setForm({ name: "", email: "", phone: "", company: "" });
    onCreate();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border">
        <DialogHeader>
          <DialogTitle>Novo cliente</DialogTitle>
          <DialogDescription>Cadastre um cliente para iniciar o fluxo de onboarding.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={loading} />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={loading} />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">WhatsApp</Label>
            <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} disabled={loading} placeholder="5585999999999" />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="company">Empresa</Label>
            <Input id="company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} disabled={loading} />
            {errors.company && <p className="text-xs text-destructive">{errors.company}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
