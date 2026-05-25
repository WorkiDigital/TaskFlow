import type { FormTemplate, FormField, FieldType } from "@/data/onboardingTypes";
import { cn } from "@/lib/utils";
import {
  Type,
  AlignLeft,
  Mail,
  Phone,
  CreditCard,
  Calendar,
  Hash,
  DollarSign,
  List,
  CheckSquare,
  Upload,
  Link2,
} from "lucide-react";

const FIELD_TYPE_CONFIG: Record<
  FieldType,
  { label: string; icon: React.ComponentType<{ className?: string }>; inputType?: string }
> = {
  text: { label: "Texto curto", icon: Type },
  textarea: { label: "Texto longo", icon: AlignLeft },
  email: { label: "E-mail", icon: Mail },
  phone: { label: "Telefone", icon: Phone },
  cpf_cnpj: { label: "CPF / CNPJ", icon: CreditCard },
  date: { label: "Data", icon: Calendar },
  number: { label: "Número", icon: Hash },
  currency: { label: "Valor monetário", icon: DollarSign },
  select: { label: "Seleção única", icon: List },
  multiselect: { label: "Múltipla escolha", icon: CheckSquare },
  upload: { label: "Upload de arquivo", icon: Upload },
  url: { label: "Link / URL", icon: Link2 },
};

interface FormPreviewProps {
  form: FormTemplate;
}

export function FormPreview({ form }: FormPreviewProps) {
  return (
    <div className="space-y-5">
      {/* Header do formulário */}
      <div className="pb-4 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
            Preview
          </span>
          <span className="text-xs text-muted-foreground">
            {form.type === "contractual" ? "Formulário Contratual" : "Formulário de Briefing"}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-foreground">{form.name}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {form.fields.length} campo{form.fields.length !== 1 ? "s" : ""} · Visualização de como o
          cliente verá
        </p>
      </div>

      {/* Campos renderizados */}
      <div className="space-y-4">
        {form.fields.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
              <AlignLeft className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Nenhum campo adicionado ainda</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Adicione campos no editor ao lado
            </p>
          </div>
        ) : (
          form.fields.map((field) => <PreviewField key={field.id} field={field} />)
        )}
      </div>

      {/* Footer do formulário */}
      {form.fields.length > 0 && (
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
            <span>{form.fields.filter((f) => f.required).length} campo(s) obrigatório(s)</span>
            <span className="text-primary">*</span>
          </div>
          <div className="h-10 rounded-xl bg-gradient-to-r from-primary to-accent flex items-center justify-center">
            <span className="text-sm font-semibold text-primary-foreground">Enviar formulário</span>
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewField({ field }: { field: FormField }) {
  const config = FIELD_TYPE_CONFIG[field.type];
  const Icon = config.icon;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <label className="text-sm font-medium text-foreground">
          {field.label}
          {field.required && <span className="text-destructive ml-0.5">*</span>}
        </label>
        {field.variableKey && (
          <span className="text-[10px] font-mono text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded-md border border-primary/15">
            {`{{${field.variableKey}}}`}
          </span>
        )}
      </div>

      {/* Input simulado */}
      {field.type === "textarea" ? (
        <div className="min-h-[80px] rounded-xl border border-border bg-input/50 px-3 py-2.5 flex items-start gap-2 cursor-not-allowed">
          <Icon className="w-3.5 h-3.5 text-muted-foreground/50 mt-0.5 shrink-0" />
          <span className="text-sm text-muted-foreground/50">
            {field.placeholder || "Digite aqui..."}
          </span>
        </div>
      ) : field.type === "select" || field.type === "multiselect" ? (
        <div className="h-10 rounded-xl border border-border bg-input/50 px-3 flex items-center justify-between cursor-not-allowed">
          <span className="text-sm text-muted-foreground/50">
            {field.placeholder || "Selecione..."}
          </span>
          <Icon className="w-3.5 h-3.5 text-muted-foreground/50" />
        </div>
      ) : field.type === "upload" ? (
        <div className="h-20 rounded-xl border border-dashed border-border bg-input/30 flex flex-col items-center justify-center gap-1 cursor-not-allowed">
          <Upload className="w-5 h-5 text-muted-foreground/40" />
          <span className="text-xs text-muted-foreground/50">
            {field.placeholder || "Arraste ou clique para selecionar"}
          </span>
        </div>
      ) : (
        <div className="h-10 rounded-xl border border-border bg-input/50 px-3 flex items-center gap-2 cursor-not-allowed">
          <Icon className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
          <span className="text-sm text-muted-foreground/50">{field.placeholder || ""}</span>
        </div>
      )}

      {field.helpText && <p className="text-xs text-muted-foreground/70 pl-1">{field.helpText}</p>}
    </div>
  );
}
