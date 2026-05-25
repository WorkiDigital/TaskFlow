import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Variable, Save } from "lucide-react";
import {
  ContractTemplate,
  listContractTemplates,
  listTemplateVariables,
  upsertTemplateVariableMappings,
} from "@/services/contractsService";
import type { ContractTemplateVariable } from "@/lib/contractVariables";
import { extractTemplateVariables } from "@/lib/contractVariables";

const SOURCE_TYPE_LABELS: Record<string, string> = {
  client_field: "Campo do cliente",
  commercial_field: "Campo comercial (deal)",
  service_field: "Campo do serviço",
  form_field: "Campo de formulário",
  fixed_value: "Valor fixo",
  manual_input: "Entrada manual",
};

const FIELD_TYPE_OPTIONS = ["text", "number", "date", "email", "phone", "currency", "textarea"];

const CLIENT_FIELD_OPTIONS = ["name", "email", "phone", "cpf_cnpj", "address"];
const COMMERCIAL_FIELD_OPTIONS = [
  "value",
  "duration_months",
  "start_date",
  "end_date",
  "payment_terms",
];
const SERVICE_FIELD_OPTIONS = ["name", "description", "category"];

type MappingRow = ContractTemplateVariable & { _dirty?: boolean };

export function VariablesTab() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [mappings, setMappings] = useState<MappingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listContractTemplates().then((res) => {
      if (res.error) toast.error(res.error);
      else {
        setTemplates(res.data ?? []);
        if (res.data?.[0]) setSelectedId(res.data[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    const template = templates.find((t) => t.id === selectedId);
    const allVars = extractTemplateVariables(template?.content ?? "");

    listTemplateVariables(selectedId).then((res) => {
      const existing = (res.data ?? []) as MappingRow[];
      const existingKeys = existing.map((m) => m.variable_key);
      const newRows: MappingRow[] = allVars
        .filter((k) => !existingKeys.includes(k))
        .map((k) => ({
          variable_key: k,
          label: k,
          source_type: "manual_input" as ContractTemplateVariable["source_type"],
          source_id: null,
          required: true,
          field_type: "text",
          fallback_value: null,
          _dirty: false,
        }));
      setMappings([...existing, ...newRows]);
      setLoading(false);
    });
  }, [selectedId, templates]);

  const updateRow = (key: string, patch: Partial<MappingRow>) => {
    setMappings((prev) =>
      prev.map((m) => (m.variable_key === key ? { ...m, ...patch, _dirty: true } : m)),
    );
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    const rows = mappings.map(({ _dirty: _d, ...m }) => m);
    const res = await upsertTemplateVariableMappings(selectedId, rows);
    if (res.error) toast.error(res.error);
    else toast.success("Mapeamentos salvos");
    setSaving(false);
  };

  const sourceFieldOptions = (sourceType: string) => {
    if (sourceType === "client_field") return CLIENT_FIELD_OPTIONS;
    if (sourceType === "commercial_field") return COMMERCIAL_FIELD_OPTIONS;
    if (sourceType === "service_field") return SERVICE_FIELD_OPTIONS;
    return [];
  };

  if (templates.length === 0) {
    return (
      <GlassCard className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <Variable className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          Crie um modelo de contrato primeiro para configurar variáveis.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Label className="shrink-0 text-sm">Modelo:</Label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Selecione um modelo..." />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving || !selectedId} className="gap-2">
          <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar mapeamentos"}
        </Button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Carregando variáveis...
        </div>
      ) : mappings.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <Variable className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Nenhuma variável encontrada neste modelo.</p>
          <p className="text-xs text-muted-foreground/60">
            Use {"{{variavel}}"} no conteúdo do modelo para criar variáveis dinâmicas.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {mappings.map((m) => {
            const fieldOptions = sourceFieldOptions(m.source_type);
            return (
              <GlassCard key={m.variable_key} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <code className="rounded bg-primary/10 px-2 py-0.5 text-sm text-primary">{`{{${m.variable_key}}}`}</code>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch
                      checked={m.required}
                      onCheckedChange={(v) => updateRow(m.variable_key, { required: v })}
                      id={`req-${m.variable_key}`}
                    />
                    <Label htmlFor={`req-${m.variable_key}`} className="cursor-pointer">
                      Obrigatório
                    </Label>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Rótulo</Label>
                    <Input
                      className="h-8 text-xs"
                      placeholder={m.variable_key}
                      value={m.label}
                      onChange={(e) => updateRow(m.variable_key, { label: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Origem</Label>
                    <Select
                      value={m.source_type}
                      onValueChange={(v) =>
                        updateRow(m.variable_key, {
                          source_type: v as ContractTemplateVariable["source_type"],
                          source_id: null,
                        })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SOURCE_TYPE_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k} className="text-xs">
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {fieldOptions.length > 0 ? (
                    <div className="space-y-1">
                      <Label className="text-xs">Campo</Label>
                      <Select
                        value={m.source_id ?? ""}
                        onValueChange={(v) => updateRow(m.variable_key, { source_id: v })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldOptions.map((f) => (
                            <SelectItem key={f} value={f} className="text-xs">
                              {f}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Label className="text-xs">
                        {m.source_type === "fixed_value"
                          ? "Valor fixo"
                          : m.source_type === "form_field"
                            ? "ID do campo"
                            : "ID/chave"}
                      </Label>
                      <Input
                        className="h-8 text-xs"
                        placeholder={
                          m.source_type === "fixed_value" ? "valor padrão" : "id_do_campo"
                        }
                        value={
                          m.source_type === "fixed_value"
                            ? (m.fallback_value ?? "")
                            : (m.source_id ?? "")
                        }
                        onChange={(e) =>
                          m.source_type === "fixed_value"
                            ? updateRow(m.variable_key, { fallback_value: e.target.value })
                            : updateRow(m.variable_key, { source_id: e.target.value })
                        }
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label className="text-xs">Tipo</Label>
                    <Select
                      value={m.field_type}
                      onValueChange={(v) => updateRow(m.variable_key, { field_type: v })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPE_OPTIONS.map((f) => (
                          <SelectItem key={f} value={f} className="text-xs">
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {m.source_type !== "fixed_value" && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Valor de fallback (opcional)
                    </Label>
                    <Input
                      className="h-7 text-xs"
                      placeholder="Valor usado se a variável não for encontrada"
                      value={m.fallback_value ?? ""}
                      onChange={(e) =>
                        updateRow(m.variable_key, { fallback_value: e.target.value || null })
                      }
                    />
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
