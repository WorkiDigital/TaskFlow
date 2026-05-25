import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type {
  OnboardingFlowStep,
  FormTemplate,
  Variable,
  OnboardingWorkspaceState,
} from "@/data/onboardingTypes";
import { initialOnboardingState } from "@/data/mockOnboardingData";
import { onboardingService } from "@/services/onboardingService";

const LS_KEY = "taskflow_onboarding_workspace";

function loadState(): OnboardingWorkspaceState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as OnboardingWorkspaceState;
  } catch {
    // ignore parse errors
  }
  return initialOnboardingState;
}

function saveState(state: OnboardingWorkspaceState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

function persistState(state: OnboardingWorkspaceState) {
  saveState(state);
  void onboardingService.saveWorkspace(state).catch((error) => {
    console.error("[Onboarding] failed to sync workspace to Supabase:", error);
  });
}

function withDefaults(state: Partial<OnboardingWorkspaceState>): OnboardingWorkspaceState {
  // Merge saved steps with defaults: keep user customisations (enabled, config, order)
  // but add any new default steps that are missing from the saved state.
  const savedSteps = state.flowSteps ?? [];
  const mergedSteps = initialOnboardingState.flowSteps.map((def) => {
    const saved = savedSteps.find((s) => s.id === def.id);
    // Always use default order so new/reintroduced steps appear in the correct position.
    // User customisations (enabled, config, name) are preserved via the spread.
    return saved ? { ...def, ...saved, order: def.order } : def;
  });
  // Append any extra steps the user added that aren't in the defaults.
  const extraSteps = savedSteps.filter(
    (s) => !initialOnboardingState.flowSteps.some((d) => d.id === s.id),
  );

  return {
    flowSteps: [...mergedSteps, ...extraSteps],
    formTemplates: state.formTemplates?.length
      ? state.formTemplates
      : initialOnboardingState.formTemplates,
    variables: state.variables?.length ? state.variables : initialOnboardingState.variables,
    messages: state.messages?.length ? state.messages : initialOnboardingState.messages,
  };
}

export function useOnboardingWorkspace() {
  const [state, setState] = useState<OnboardingWorkspaceState>(loadState);
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    let mounted = true;

    onboardingService
      .getWorkspace()
      .then((remoteState) => {
        if (!mounted) return;
        if (remoteState) {
          const hydratedState = withDefaults(remoteState);
          setState(hydratedState);
          saveState(hydratedState);
          // Persist corrected order back to Supabase so it stays fixed on next load.
          void onboardingService.saveWorkspace(hydratedState).catch(() => {});
          return;
        }

        const localState = loadState();
        setState(localState);
        void onboardingService.saveWorkspace(localState);
      })
      .catch((error) => {
        console.error("[Onboarding] failed to load remote workspace:", error);
      })
      .finally(() => {
        if (mounted) setIsSyncing(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const update = useCallback((patch: Partial<OnboardingWorkspaceState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      persistState(next);
      return next;
    });
  }, []);

  const toggleStep = useCallback((id: string) => {
    setState((prev) => {
      const next = {
        ...prev,
        flowSteps: prev.flowSteps.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
      };
      persistState(next);
      console.log("[Onboarding] step toggled:", id);
      return next;
    });
  }, []);

  const updateStep = useCallback((id: string, patch: Partial<OnboardingFlowStep>) => {
    setState((prev) => {
      const next = {
        ...prev,
        flowSteps: prev.flowSteps.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      };
      persistState(next);
      console.log("[Onboarding] step updated:", id, patch);
      return next;
    });
    toast.success("Etapa atualizada");
  }, []);

  const reorderStep = useCallback((id: string, direction: "up" | "down") => {
    setState((prev) => {
      const steps = [...prev.flowSteps].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const index = steps.findIndex((s) => s.id === id);
      if (direction === "up" && index > 0) {
        const temp = steps[index].order;
        steps[index].order = steps[index - 1].order;
        steps[index - 1].order = temp;
      } else if (direction === "down" && index < steps.length - 1) {
        const temp = steps[index].order;
        steps[index].order = steps[index + 1].order;
        steps[index + 1].order = temp;
      }
      const next = { ...prev, flowSteps: steps };
      persistState(next);
      return next;
    });
  }, []);

  const applyTemplateMode = useCallback((mode: "complete" | "whatsapp_only" | "custom") => {
    setState((prev) => {
      let newSteps = [...prev.flowSteps];
      if (mode === "complete") {
        newSteps = newSteps.map((s) => ({ ...s, enabled: true }));
      } else if (mode === "whatsapp_only") {
        const waSteps = [
          "create_whatsapp_group",
          "add_participants",
          "update_group_description",
          "send_welcome_message",
          "notify_internal_group",
          "finalize_onboarding",
        ];
        newSteps = newSteps.map((s) => ({ ...s, enabled: waSteps.includes(s.id) }));
      }
      const next = { ...prev, flowSteps: newSteps };
      persistState(next);
      return next;
    });
  }, []);

  const saveFormTemplate = useCallback((form: FormTemplate) => {
    setState((prev) => {
      const exists = prev.formTemplates.find((f) => f.id === form.id);
      const updated = form.isDefault ? { ...form, updatedAt: new Date().toISOString() } : form;
      const templates = exists
        ? prev.formTemplates.map((f) => (f.id === form.id ? updated : f))
        : [
            ...prev.formTemplates,
            {
              ...updated,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ];
      const next = { ...prev, formTemplates: templates };
      persistState(next);
      console.log("[FormBuilder] template saved:", form.id);
      return next;
    });
    toast.success("Formulario salvo");
  }, []);

  const duplicateFormTemplate = useCallback((id: string) => {
    setState((prev) => {
      const src = prev.formTemplates.find((f) => f.id === id);
      if (!src) return prev;
      const copy: FormTemplate = {
        ...src,
        id: `form_${Date.now()}`,
        name: `${src.name} (copia)`,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fields: src.fields.map((f) => ({
          ...f,
          id: `field_${Math.random().toString(36).slice(2)}`,
        })),
      };
      const next = { ...prev, formTemplates: [...prev.formTemplates, copy] };
      persistState(next);
      console.log("[FormBuilder] template duplicated:", id);
      return next;
    });
    toast.success("Formulario duplicado");
  }, []);

  const deleteFormTemplate = useCallback((id: string) => {
    setState((prev) => {
      const next = { ...prev, formTemplates: prev.formTemplates.filter((f) => f.id !== id) };
      persistState(next);
      console.log("[FormBuilder] template deleted:", id);
      return next;
    });
    toast.success("Formulario excluido");
  }, []);

  const setDefaultForm = useCallback((id: string, type: FormTemplate["type"]) => {
    setState((prev) => {
      const next = {
        ...prev,
        formTemplates: prev.formTemplates.map((f) =>
          f.type === type ? { ...f, isDefault: f.id === id } : f,
        ),
      };
      persistState(next);
      return next;
    });
    toast.success("Formulario padrao definido");
  }, []);

  const addVariable = useCallback((v: Omit<Variable, "id">) => {
    const newVar: Variable = { ...v, id: `var_${Date.now()}` };
    setState((prev) => {
      const next = { ...prev, variables: [...prev.variables, newVar] };
      persistState(next);
      console.log("[VariableManager] variable added:", newVar.key);
      return next;
    });
    toast.success(`Variavel {{${v.key}}} criada`);
  }, []);

  const updateVariable = useCallback((id: string, patch: Partial<Variable>) => {
    setState((prev) => {
      const next = {
        ...prev,
        variables: prev.variables.map((v) => (v.id === id ? { ...v, ...patch } : v)),
      };
      persistState(next);
      console.log("[VariableManager] variable updated:", id);
      return next;
    });
    toast.success("Variavel atualizada");
  }, []);

  const deleteVariable = useCallback((id: string) => {
    setState((prev) => {
      const v = prev.variables.find((x) => x.id === id);
      if (v?.isSystem) {
        toast.error("Variaveis do sistema nao podem ser excluidas");
        return prev;
      }
      const next = { ...prev, variables: prev.variables.filter((x) => x.id !== id) };
      persistState(next);
      console.log("[VariableManager] variable deleted:", id);
      return next;
    });
    toast.success("Variavel excluida");
  }, []);

  const updateMessage = useCallback((id: string, body: string) => {
    setState((prev) => {
      const next = {
        ...prev,
        messages: prev.messages.map((m) => (m.id === id ? { ...m, body } : m)),
      };
      persistState(next);
      return next;
    });
  }, []);

  return {
    state,
    isSyncing,
    update,
    toggleStep,
    updateStep,
    saveFormTemplate,
    duplicateFormTemplate,
    deleteFormTemplate,
    setDefaultForm,
    addVariable,
    updateVariable,
    deleteVariable,
    updateMessage,
    reorderStep,
    applyTemplateMode,
  };
}
