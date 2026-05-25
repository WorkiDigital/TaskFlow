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
import { FileText, Plus, Copy, Archive, CheckCircle, Edit2, Eye, X } from "lucide-react";
import {
  ContractTemplate,
  listContractTemplates,
  createContractTemplate,
  updateContractTemplate,
  archiveContractTemplate,
  duplicateContractTemplate,
  publishContractTemplate,
} from "@/services/contractsService";
import { extractTemplateVariables } from "@/lib/contractVariables";

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  published: "Publicado",
  archived: "Arquivado",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  published: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  archived: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

const CATEGORY_OPTIONS = ["Retainer", "Projeto", "Consultoria", "Setup", "Outros"];

interface TemplateFormState {
  name: string;
  description: string;
  category: string;
  service_type: string;
  content: string;
}

const EMPTY_FORM: TemplateFormState = {
  name: "",
  description: "",
  category: "",
  service_type: "",
  content: "",
};

export function TemplatesTab() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<ContractTemplate | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await listContractTemplates();
    if (res.error) toast.error(res.error);
    else setTemplates(res.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (t: ContractTemplate) => {
    setEditingId(t.id);
    setForm({
      name: t.name,
      description: t.description ?? "",
      category: t.category ?? "",
      service_type: t.service_type ?? "",
      content: t.content,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.content.trim()) {
      toast.error("Nome e conteúdo são obrigatórios");
      return;
    }
    setSaving(true);
    if (editingId) {
      const res = await updateContractTemplate(editingId, form);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Template atualizado");
        setDialogOpen(false);
        load();
      }
    } else {
      const res = await createContractTemplate(form);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Template criado");
        setDialogOpen(false);
        load();
      }
    }
    setSaving(false);
  };

  const handlePublish = async (id: string) => {
    const res = await publishContractTemplate(id);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Template publicado");
      load();
    }
  };

  const handleArchive = async (id: string) => {
    const res = await archiveContractTemplate(id);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Template arquivado");
      load();
    }
  };

  const handleDuplicate = async (id: string) => {
    const res = await duplicateContractTemplate(id);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Template duplicado");
      load();
    }
  };

  const detectedVars = extractTemplateVariables(form.content);

  if (loading) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">Carregando modelos...</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{templates.length} modelo(s) cadastrado(s)</p>
        <Button size="sm" onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Novo modelo
        </Button>
      </div>

      {templates.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <FileText className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Nenhum modelo de contrato criado ainda.</p>
          <Button size="sm" variant="outline" onClick={openCreate} className="mt-2">
            Criar primeiro modelo
          </Button>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <GlassCard
              key={t.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{t.name}</p>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[t.status]}`}
                    >
                      {STATUS_LABELS[t.status]}
                    </span>
                  </div>
                  {t.description && (
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {t.category && (
                      <Badge variant="outline" className="text-xs">
                        {t.category}
                      </Badge>
                    )}
                    {(t.variables ?? []).length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {(t.variables ?? []).length} variável(is)
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  title="Visualizar"
                  onClick={() => setPreviewTemplate(t)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  title="Editar"
                  onClick={() => openEdit(t)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  title="Duplicar"
                  onClick={() => handleDuplicate(t.id)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                {t.status === "draft" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1 text-xs"
                    onClick={() => handlePublish(t.id)}
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Publicar
                  </Button>
                )}
                {t.status !== "archived" && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    title="Arquivar"
                    onClick={() => handleArchive(t.id)}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border-border">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar modelo" : "Novo modelo de contrato"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nome *</Label>
                <Input
                  placeholder="Ex: Contrato de Retainer"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input
                placeholder="Descrição breve do modelo"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                Conteúdo *{" "}
                <span className="text-xs text-muted-foreground ml-1">
                  Use {"{{variavel}}"} para campos dinâmicos
                </span>
              </Label>
              <Textarea
                rows={12}
                placeholder="Escreva o conteúdo do contrato. Ex: Este contrato é firmado entre {{nome_cliente}} e {{nome_empresa}}..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="font-mono text-xs"
              />
            </div>
            {detectedVars.length > 0 && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Variáveis detectadas:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {detectedVars.map((v) => (
                    <code
                      key={v}
                      className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary"
                    >{`{{${v}}}`}</code>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Configure as origens dessas variáveis na aba <strong>Variáveis</strong>.
                </p>
              </div>
            )}
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

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-background border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-8">
              <span>{previewTemplate?.name}</span>
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[previewTemplate?.status ?? "draft"]}`}
              >
                {STATUS_LABELS[previewTemplate?.status ?? "draft"]}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="whitespace-pre-wrap text-sm leading-relaxed py-2">
            {previewTemplate?.content}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
