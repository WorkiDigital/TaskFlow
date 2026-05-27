import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Briefcase, Plus, Edit2, Trash2, X } from "lucide-react";
import {
  AgencyService,
  listServices,
  createService,
  updateService,
  deleteService,
  upsertDeliverables,
  listServiceOnboardingPlans,
} from "@/services/contractsService";

const PRICING_LABELS: Record<string, string> = {
  recurring: "Recorrente",
  one_time: "Único",
  setup: "Setup",
  consulting: "Consultoria",
  custom: "Personalizado",
};

interface ServiceFormState {
  name: string;
  description: string;
  category: string;
  pricing_type: string;
  default_price: string;
  default_duration_months: string;
  default_onboarding_start_mode: string;
  default_onboarding_plan_id: string;
}

const EMPTY_FORM: ServiceFormState = {
  name: "",
  description: "",
  category: "",
  pricing_type: "recurring",
  default_price: "",
  default_duration_months: "",
  default_onboarding_start_mode: "manual",
  default_onboarding_plan_id: "none",
};

interface DeliverableRow {
  title: string;
  description: string;
}

export function ServicesTab() {
  const [services, setServices] = useState<AgencyService[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<AgencyService | null>(null);
  const [form, setForm] = useState<ServiceFormState>(EMPTY_FORM);
  const [deliverables, setDeliverables] = useState<DeliverableRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [plans, setPlans] = useState<{id: string; name: string}[]>([]);

  const load = async () => {
    setLoading(true);
    const [res, plansRes] = await Promise.all([listServices(), listServiceOnboardingPlans()]);
    if (res.error) toast.error(res.error);
    else setServices(res.data ?? []);
    
    if (plansRes.data) setPlans(plansRes.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditingService(null);
    setForm(EMPTY_FORM);
    setDeliverables([]);
    setDialogOpen(true);
  };

  const openEdit = (s: AgencyService) => {
    setEditingService(s);
    setForm({
      name: s.name,
      description: s.description ?? "",
      category: s.category ?? "",
      pricing_type: s.pricing_type,
      default_price: s.default_price != null ? String(s.default_price) : "",
      default_duration_months:
        s.default_duration_months != null ? String(s.default_duration_months) : "",
      default_onboarding_start_mode: s.default_onboarding_start_mode ?? "manual",
      default_onboarding_plan_id: s.default_onboarding_plan_id ?? "none",
    });
    setDeliverables(
      (s.service_deliverables ?? []).map((d) => ({
        title: d.title,
        description: d.description ?? "",
      })),
    );
    setDialogOpen(true);
  };

  const addDeliverable = () => setDeliverables((prev) => [...prev, { title: "", description: "" }]);
  const removeDeliverable = (i: number) =>
    setDeliverables((prev) => prev.filter((_, idx) => idx !== i));
  const updateDeliverable = (i: number, field: keyof DeliverableRow, value: string) => {
    setDeliverables((prev) => prev.map((d, idx) => (idx === i ? { ...d, [field]: value } : d)));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Nome do serviço é obrigatório");
      return;
    }
    setSaving(true);
    const payload: Partial<AgencyService> = {
      name: form.name,
      description: form.description || undefined,
      category: form.category || undefined,
      pricing_type: form.pricing_type,
      default_price: form.default_price ? Number(form.default_price) : undefined,
      default_duration_months: form.default_duration_months
        ? Number(form.default_duration_months)
        : undefined,
      default_onboarding_start_mode: form.default_onboarding_start_mode as any,
      default_onboarding_plan_id: form.default_onboarding_plan_id === "none" ? undefined : form.default_onboarding_plan_id,
    };

    let serviceId: string;
    if (editingService) {
      const res = await updateService(editingService.id, payload);
      if (res.error) {
        toast.error(res.error);
        setSaving(false);
        return;
      }
      serviceId = editingService.id;
    } else {
      const res = await createService(payload);
      if (res.error) {
        toast.error(res.error);
        setSaving(false);
        return;
      }
      serviceId = res.data!.id;
    }

    const delivRows = deliverables
      .filter((d) => d.title.trim())
      .map((d, i) => ({ title: d.title, description: d.description || undefined, position: i }));
    await upsertDeliverables(serviceId, delivRows);

    toast.success(editingService ? "Serviço atualizado" : "Serviço criado");
    setDialogOpen(false);
    load();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const res = await deleteService(id);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Serviço arquivado");
      load();
    }
    setDeletingId(null);
  };

  if (loading) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">Carregando serviços...</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{services.length} serviço(s) ativo(s)</p>
        <Button size="sm" onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Novo serviço
        </Button>
      </div>

      {services.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <Briefcase className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Nenhum serviço cadastrado ainda.</p>
          <Button size="sm" variant="outline" onClick={openCreate} className="mt-2">
            Criar primeiro serviço
          </Button>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {services.map((s) => (
            <GlassCard
              key={s.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{s.name}</p>
                    <Badge variant="outline" className="text-xs">
                      {PRICING_LABELS[s.pricing_type] ?? s.pricing_type}
                    </Badge>
                    {s.category && (
                      <Badge variant="secondary" className="text-xs">
                        {s.category}
                      </Badge>
                    )}
                  </div>
                  {s.description && (
                    <p className="text-xs text-muted-foreground">{s.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {s.default_price != null && (
                      <span>
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                          maximumFractionDigits: 0,
                        }).format(s.default_price)}
                      </span>
                    )}
                    {s.default_duration_months != null && (
                      <span>{s.default_duration_months} mês(es)</span>
                    )}
                  </div>
                  {(s.service_deliverables ?? []).length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {s.service_deliverables!.map((d) => (
                        <span
                          key={d.id}
                          className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                        >
                          {d.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(s)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  disabled={deletingId === s.id}
                  onClick={() => handleDelete(s.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-background border-border">
          <DialogHeader>
            <DialogTitle>{editingService ? "Editar serviço" : "Novo serviço"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Nome *</Label>
                <Input
                  placeholder="Ex: Gestão de Tráfego Pago"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo de cobrança</Label>
                <Select
                  value={form.pricing_type}
                  onValueChange={(v) => setForm({ ...form, pricing_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRICING_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Input
                  placeholder="Ex: Marketing Digital"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Valor padrão (R$)</Label>
                <Input
                  inputMode="numeric"
                  placeholder="0"
                  value={form.default_price}
                  onChange={(e) => setForm({ ...form, default_price: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Duração padrão (meses)</Label>
                <Input
                  inputMode="numeric"
                  placeholder="0"
                  value={form.default_duration_months}
                  onChange={(e) => setForm({ ...form, default_duration_months: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Início do Onboarding</Label>
                <Select
                  value={form.default_onboarding_start_mode}
                  onValueChange={(v) => setForm({ ...form, default_onboarding_start_mode: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual (Aprovado internamente)</SelectItem>
                    <SelectItem value="automatic_after_signature">Automático (Após Assinatura)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Plano de 7 Dias</Label>
                <Select
                  value={form.default_onboarding_plan_id}
                  onValueChange={(v) => setForm({ ...form, default_onboarding_plan_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um roteiro (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem Roteiro</SelectItem>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Descreva o serviço brevemente"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Entregáveis</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 text-xs"
                  onClick={addDeliverable}
                >
                  <Plus className="h-3 w-3" /> Adicionar
                </Button>
              </div>
              {deliverables.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhum entregável definido ainda.</p>
              )}
              {deliverables.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder={`Entregável ${i + 1}`}
                    value={d.title}
                    onChange={(e) => updateDeliverable(i, "title", e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0"
                    onClick={() => removeDeliverable(i)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
