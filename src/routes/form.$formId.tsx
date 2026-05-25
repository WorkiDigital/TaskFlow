import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { onboardingService } from "@/services/onboardingService";
import { supabase } from "@/services/supabase";
import { initialOnboardingState } from "@/data/mockOnboardingData";
import type { FormField, FormTemplate, OnboardingWorkspaceState } from "@/data/onboardingTypes";
import { toast } from "sonner";

export const Route = createFileRoute("/form/$formId")({
  component: PublicFormPage,
});

function PublicFormPage() {
  const { formId } = Route.useParams();
  const clientId =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("clientId")
      : null;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formTemplate, setFormTemplate] = useState<FormTemplate | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadForm() {
      setLoading(true);
      const { data, error } = await supabase
        .from("onboarding_workspace")
        .select("state")
        .eq("id", "default")
        .maybeSingle<{ state: Partial<OnboardingWorkspaceState> }>();

      if (error) {
        console.error(error);
      }

      const remoteTemplates = data?.state?.formTemplates ?? [];
      const templates =
        remoteTemplates.length > 0 ? remoteTemplates : initialOnboardingState.formTemplates;
      const found = templates.find((template) => template.id === formId) ?? null;
      setFormTemplate(found);

      if (found) {
        setValues(Object.fromEntries(found.fields.map((field) => [field.id, ""])));
      }

      setLoading(false);
    }

    void loadForm();
  }, [formId]);

  const requiredFields = useMemo(
    () => formTemplate?.fields.filter((field) => field.required) ?? [],
    [formTemplate],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formTemplate) return;

    const missing = requiredFields.find((field) => !String(values[field.id] ?? "").trim());
    if (missing) {
      toast.error(`Preencha: ${missing.label}`);
      return;
    }

    setSubmitting(true);
    const payload = Object.fromEntries(
      formTemplate.fields.map((field) => [
        field.variableKey || field.id,
        {
          label: field.label,
          value: values[field.id] ?? "",
        },
      ]),
    );

    try {
      await onboardingService.submitPublicForm({
        formId: formTemplate.id,
        clientId,
        payload,
      });
      setSubmitted(true);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Nao foi possivel enviar o formulario.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Carregando formulario...
        </div>
      </div>
    );
  }

  if (!formTemplate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-8 text-center">
          <h1 className="text-xl font-semibold text-destructive">Formulario nao encontrado</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Confira se o link publico esta correto.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-8 text-center space-y-4">
          <CheckCircle2 className="w-14 h-14 text-success mx-auto" />
          <h1 className="text-2xl font-semibold">Formulario recebido</h1>
          <p className="text-sm text-muted-foreground">
            Obrigado. Suas respostas foram enviadas com sucesso.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex justify-center px-4 py-8">
      <div className="glass-card w-full max-w-2xl p-6 sm:p-8 h-fit">
        <div className="mb-6 border-b border-border pb-5">
          <p className="text-xs uppercase tracking-widest text-primary font-semibold">
            {formTemplate.type === "contractual" ? "Formulario contratual" : "Briefing"}
          </p>
          <h1 className="text-2xl font-semibold mt-2">{formTemplate.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Preencha os campos abaixo para continuar seu onboarding.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {formTemplate.fields.map((field) => (
            <PublicField
              key={field.id}
              field={field}
              value={values[field.id] ?? ""}
              onChange={(value) => setValues((prev) => ({ ...prev, [field.id]: value }))}
              disabled={submitting}
            />
          ))}

          <Button type="submit" disabled={submitting} className="w-full" size="lg">
            {submitting ? "Enviando..." : "Enviar formulario"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function PublicField({
  field,
  value,
  onChange,
  disabled,
}: {
  field: FormField;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {field.type === "textarea" ? (
        <Textarea
          id={field.id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          required={field.required}
          className="min-h-28 bg-white/5"
        />
      ) : field.type === "select" || field.type === "multiselect" ? (
        <select
          id={field.id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          required={field.required}
          className="h-10 w-full rounded-md border border-input bg-white/5 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">{field.placeholder || "Selecione..."}</option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <Input
          id={field.id}
          type={getInputType(field.type)}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          required={field.required}
          className="bg-white/5"
        />
      )}
      {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
    </div>
  );
}

function getInputType(type: FormField["type"]) {
  if (type === "email") return "email";
  if (type === "phone") return "tel";
  if (type === "date") return "date";
  if (type === "number" || type === "currency") return "number";
  if (type === "url") return "url";
  return "text";
}
