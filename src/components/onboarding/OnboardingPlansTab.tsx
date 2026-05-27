import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, Map } from "lucide-react";
import { toast } from "sonner";
import {
  listServiceOnboardingPlans,
  createServiceOnboardingPlan,
  updateServiceOnboardingPlan,
  deleteServiceOnboardingPlan,
  getServiceOnboardingPlanSteps,
  upsertServiceOnboardingPlanSteps,
} from "@/services/contractsService";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Plan {
  id: string;
  name: string;
  description: string | null;
}

interface PlanStep {
  id: string;
  day_number: number;
  title: string;
}

export function OnboardingPlansTab() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planSteps, setPlanSteps] = useState<PlanStep[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadPlans = async () => {
    setLoading(true);
    const res = await listServiceOnboardingPlans();
    if (res.error) toast.error(res.error);
    else setPlans(res.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleEditPlan = async (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan);
      const res = await getServiceOnboardingPlanSteps(plan.id);
      if (res.error) {
        toast.error(res.error);
        setPlanSteps([]);
      } else {
        setPlanSteps(res.data ?? []);
      }
    } else {
      setEditingPlan({ id: "new", name: "", description: "" });
      setPlanSteps([{ id: "new_1", day_number: 1, title: "" }]);
    }
    setIsDialogOpen(true);
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este Roteiro?")) return;
    const res = await deleteServiceOnboardingPlan(id);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Roteiro excluído com sucesso.");
      loadPlans();
    }
  };

  const handleSavePlan = async () => {
    if (!editingPlan?.name.trim()) {
      toast.error("O nome do roteiro é obrigatório.");
      return;
    }
    if (planSteps.some((s) => !s.title.trim() || !s.day_number)) {
      toast.error("Preencha o título e o dia de todas as etapas.");
      return;
    }

    setSaving(true);
    let planId = editingPlan.id;

    if (planId === "new") {
      const res = await createServiceOnboardingPlan({
        name: editingPlan.name,
        description: editingPlan.description ?? undefined,
      });
      if (res.error) {
        toast.error(res.error);
        setSaving(false);
        return;
      }
      planId = res.data.id;
    } else {
      const res = await updateServiceOnboardingPlan(planId, {
        name: editingPlan.name,
        description: editingPlan.description ?? undefined,
      });
      if (res.error) {
        toast.error(res.error);
        setSaving(false);
        return;
      }
    }

    const stepsRes = await upsertServiceOnboardingPlanSteps(planId, planSteps);
    if (stepsRes.error) {
      toast.error("Roteiro salvo, mas erro ao salvar as etapas: " + stepsRes.error);
    } else {
      toast.success("Roteiro salvo com sucesso!");
      setIsDialogOpen(false);
      loadPlans();
    }
    setSaving(false);
  };

  const addStep = () => {
    const nextDay = planSteps.length > 0 ? Math.max(...planSteps.map(s => s.day_number)) + 1 : 1;
    setPlanSteps([...planSteps, { id: `new_${Date.now()}`, day_number: nextDay, title: "" }]);
  };

  const removeStep = (id: string) => {
    setPlanSteps(planSteps.filter((s) => s.id !== id));
  };

  if (loading) return <div className="py-10 text-center text-sm text-muted-foreground">Carregando roteiros...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Roteiros de 7 Dias</h3>
          <p className="text-sm text-muted-foreground">
            Configure as sequências de mensagens diárias para o onboarding dos seus serviços.
          </p>
        </div>
        <Button size="sm" onClick={() => handleEditPlan()}>
          <Plus className="w-4 h-4 mr-2" /> Novo Roteiro
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <GlassCard key={plan.id} className="p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Map className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-medium text-sm truncate max-w-[150px]">{plan.name}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">{plan.description || "Sem descrição"}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button size="sm" variant="ghost" onClick={() => handleDeletePlan(plan.id)} className="h-7 text-xs text-destructive hover:bg-destructive/10">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleEditPlan(plan)} className="h-7 text-xs">
                <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Editar
              </Button>
            </div>
          </GlassCard>
        ))}
        {plans.length === 0 && (
          <div className="col-span-full h-32 rounded-xl border border-dashed border-border/50 flex flex-col items-center justify-center text-muted-foreground">
            <Map className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">Nenhum roteiro cadastrado.</p>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl bg-background border-border">
          <DialogHeader>
            <DialogTitle>{editingPlan?.id === "new" ? "Novo Roteiro" : "Editar Roteiro"}</DialogTitle>
          </DialogHeader>
          {editingPlan && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <Label>Nome do Roteiro</Label>
                  <Input
                    placeholder="Ex: Roteiro Gestão de Tráfego"
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Descrição</Label>
                  <Textarea
                    placeholder="Descrição breve..."
                    value={editingPlan.description ?? ""}
                    onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-3">
                  <Label>Dias e Etapas do Roteiro</Label>
                  <Button size="sm" variant="outline" onClick={addStep} className="h-7 text-xs">
                    <Plus className="w-3 h-3 mr-1" /> Adicionar Dia
                  </Button>
                </div>
                <ScrollArea className="h-[250px] pr-3 -mr-3">
                  <div className="space-y-2">
                    {planSteps.map((step, index) => (
                      <div key={step.id} className="flex gap-2 items-start bg-muted/20 p-2 rounded-md border border-border/50">
                        <div className="w-20 shrink-0 space-y-1.5">
                          <Label className="text-[10px] text-muted-foreground">Dia</Label>
                          <Input
                            type="number"
                            className="h-8 text-sm"
                            value={step.day_number}
                            onChange={(e) => {
                              const newSteps = [...planSteps];
                              newSteps[index].day_number = Number(e.target.value);
                              setPlanSteps(newSteps);
                            }}
                          />
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <Label className="text-[10px] text-muted-foreground">Mensagem / Título</Label>
                          <Input
                            className="h-8 text-sm"
                            placeholder="Mensagem deste dia..."
                            value={step.title}
                            onChange={(e) => {
                              const newSteps = [...planSteps];
                              newSteps[index].title = e.target.value;
                              setPlanSteps(newSteps);
                            }}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground mt-[22px] hover:text-destructive"
                          onClick={() => removeStep(step.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {planSteps.length === 0 && (
                      <p className="text-xs text-center text-muted-foreground py-4">Nenhuma etapa. Adicione um dia.</p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSavePlan} disabled={saving}>
              {saving ? "Salvando..." : "Salvar Roteiro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
