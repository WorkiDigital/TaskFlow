import { supabase } from "./supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AgentContext =
  | "dashboard"
  | "projects"
  | "templates"
  | "automations"
  | "contracts"
  | "onboarding";
export type AgentProvider = "claude" | "gpt" | "gemini";

export interface AIModel {
  id: string;
  label: string;
  description: string;
  isDefault?: boolean;
}

export const AI_MODELS: Record<AgentProvider, AIModel[]> = {
  claude: [
    {
      id: "claude-sonnet-4-6",
      label: "Claude Sonnet 4.6",
      description: "Recomendado — equilíbrio entre custo e qualidade",
      isDefault: true,
    },
    {
      id: "claude-opus-4-7",
      label: "Claude Opus 4.7",
      description: "Mais poderoso — ideal para análises complexas",
    },
    {
      id: "claude-haiku-4-5-20251001",
      label: "Claude Haiku 4.5",
      description: "Mais rápido e econômico",
    },
  ],
  gpt: [
    {
      id: "gpt-4o",
      label: "GPT-4o",
      description: "Recomendado — multimodal e preciso",
      isDefault: true,
    },
    { id: "gpt-4o-mini", label: "GPT-4o Mini", description: "Mais rápido e econômico" },
    { id: "gpt-4-turbo", label: "GPT-4 Turbo", description: "Alta capacidade de contexto" },
  ],
  gemini: [
    {
      id: "gemini-2.5-pro",
      label: "Gemini 2.5 Pro",
      description: "Mais poderoso — lógica e contexto longo",
      isDefault: true,
    },
    {
      id: "gemini-2.5-flash",
      label: "Gemini 2.5 Flash",
      description: "Rápido e eficiente da série 2.5",
    },
    {
      id: "gemini-3-flash",
      label: "Gemini 3 Flash",
      description: "Focado em velocidade e tarefas diárias",
    },
    {
      id: "gemini-3.1-pro",
      label: "Gemini 3.1 Pro",
      description: "Lógica avançada e código — série 3.1",
    },
    {
      id: "gemini-3.5-flash",
      label: "Gemini 3.5 Flash",
      description: "Mais recente — ideal para agentes e automações",
    },
  ],
};
export type InsightCategory = "gap" | "issue" | "opportunity" | "warning";
export type InsightPriority = "low" | "medium" | "high" | "critical";
export type InsightStatus = "active" | "dismissed" | "acted_on";
export type ActionStatus = "pending" | "approved" | "dismissed" | "executed" | "failed";
export type ActionType =
  | "create_task"
  | "create_task_checklist"
  | "assign_task_owner"
  | "update_due_date"
  | "add_automation_step"
  | "link_template_to_contract"
  | "create_project_column"
  | "update_task_priority";

export interface AgentInsight {
  id: string;
  agency_id: string;
  context: AgentContext;
  context_entity_id: string | null;
  category: InsightCategory;
  priority: InsightPriority;
  title: string;
  description: string;
  evidence: Record<string, unknown>;
  status: InsightStatus;
  generated_by_user_id: string | null;
  dismissed_by: string | null;
  dismissed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentAction {
  id: string;
  agency_id: string;
  insight_id: string | null;
  context: AgentContext;
  action_type: ActionType;
  title: string;
  description: string | null;
  payload: Record<string, unknown>;
  preview_items: string[];
  status: ActionStatus;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  dismissed_by: string | null;
  dismissed_at: string | null;
  executed_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentExecutionLog {
  id: string;
  agency_id: string;
  action_id: string | null;
  insight_id: string | null;
  event_type: string;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AgentProviderConfig {
  provider: AgentProvider;
  model: string | null;
  isConfigured: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getCurrentUser(): Promise<{ userId: string; agencyId: string }> {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error("Não autenticado");

  const { data: userData, error } = await supabase
    .from("users")
    .select("agency_id")
    .eq("id", authData.user.id)
    .single();

  if (error || !userData?.agency_id) throw new Error("Usuário sem agência configurada");

  return { userId: authData.user.id, agencyId: userData.agency_id };
}

async function invokeAgent<T>(body: Record<string, unknown>): Promise<T> {
  const { userId, agencyId } = await getCurrentUser();

  const { data, error } = await supabase.functions.invoke<T>("agent-execute", {
    body: { ...body, userId, agencyId },
  });

  if (error) {
    const ctx = (error as { context?: unknown }).context;
    if (ctx instanceof Response) {
      const payload = (await ctx.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? error.message);
    }
    throw new Error(error.message);
  }

  const maybeError = data as { error?: string } | null;
  if (maybeError?.error) throw new Error(maybeError.error);

  return data as T;
}

function parsePreviewItems(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return [raw];
    }
  }
  return [];
}

function normalizeAction(action: Record<string, unknown>): AgentAction {
  return {
    ...action,
    preview_items: parsePreviewItems(action.preview_items),
  } as AgentAction;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const agentService = {
  // Read active insights from DB (no AI call)
  async getInsights(context: AgentContext): Promise<AgentInsight[]> {
    console.log("[AgentInsights] Buscando insights para contexto:", context);
    try {
      const { data, error } = await supabase
        .from("agent_insights")
        .select("*")
        .eq("context", context)
        .eq("status", "active")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        // If the table does not exist (404) or any other error, log and return empty list
        console.warn("[AgentInsights] Erro ao buscar insights (possível tabela ausente):", error);
        return [];
      }
      return (data ?? []) as AgentInsight[];
    } catch (err) {
      console.error("[AgentInsights] Exceção ao buscar insights:", err);
      return [];
    }
  },

  // Trigger AI analysis → stores insights → returns them
  async generateInsights(
    context: AgentContext,
  ): Promise<{ insights: AgentInsight[]; provider: AgentProvider; logs: string[] }> {
    console.log("[AgentInsights] Gerando insights via IA para contexto:", context);
    return invokeAgent({ mode: "analyze", context });
  },

  // Convert insights → suggested actions
  async suggestActions(context: AgentContext): Promise<{ actions: AgentAction[]; logs: string[] }> {
    console.log("[AgentInsights] Gerando sugestões de ações para contexto:", context);
    const result = await invokeAgent<{ actions: Array<Record<string, unknown>>; logs: string[] }>({
      mode: "suggest",
      context,
    });
    return {
      ...result,
      actions: (result.actions ?? []).map(normalizeAction),
    };
  },

  // Get pending/suggested actions for context
  async getActions(context: AgentContext): Promise<AgentAction[]> {
    console.log("[AgentActionPreview] Buscando ações para contexto:", context);
    const { data, error } = await supabase
      .from("agent_actions")
      .select("*")
      .eq("context", context)
      .in("status", ["pending", "approved"])
      .order("created_at", { ascending: false });

    if (error) throw error;
    return ((data ?? []) as Array<Record<string, unknown>>).map(normalizeAction);
  },

  // Approve an action (direct DB update, no Edge Function)
  async approveAction(actionId: string): Promise<AgentAction> {
    console.log("[AgentApproval] Aprovando ação:", actionId);
    const { data: authData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("agent_actions")
      .update({
        status: "approved",
        approved_by: authData.user?.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", actionId)
      .select()
      .single();

    if (error) throw error;
    return normalizeAction(data as Record<string, unknown>);
  },

  // Dismiss an action
  async dismissAction(actionId: string): Promise<void> {
    console.log("[AgentApproval] Descartando ação:", actionId);
    const { data: authData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("agent_actions")
      .update({
        status: "dismissed",
        dismissed_by: authData.user?.id,
        dismissed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", actionId);

    if (error) throw error;
  },

  // Dismiss an insight
  async dismissInsight(insightId: string): Promise<void> {
    console.log("[AgentInsights] Descartando insight:", insightId);
    const { data: authData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("agent_insights")
      .update({
        status: "dismissed",
        dismissed_by: authData.user?.id,
        dismissed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", insightId);

    if (error) throw error;
  },

  // Execute an approved action via Edge Function
  async executeApprovedAction(
    actionId: string,
  ): Promise<{ success: boolean; result: Record<string, unknown>; logs: string[] }> {
    console.log("[AgentApproval] Executando ação aprovada:", actionId);
    return invokeAgent({ mode: "execute", actionId });
  },

  // Get execution logs for an action
  async getExecutionLogs(actionId: string): Promise<AgentExecutionLog[]> {
    const { data, error } = await supabase
      .from("agent_execution_logs")
      .select("*")
      .eq("action_id", actionId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data ?? []) as AgentExecutionLog[];
  },

  // Get recent logs for the agency
  async getRecentLogs(limit = 30): Promise<AgentExecutionLog[]> {
    const { data, error } = await supabase
      .from("agent_execution_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as AgentExecutionLog[];
  },

  // Get current AI provider config (via Edge Function to bypass RLS)
  async getProviderConfig(): Promise<AgentProviderConfig> {
    const { data, error } = await supabase.functions.invoke<{
      provider: AgentProvider;
      model: string | null;
      isConfigured: boolean;
    }>("agency-settings", { body: { action: "get_ai_provider" } });

    if (error || !data) return { provider: "claude", model: null, isConfigured: false };
    return {
      provider: data.provider ?? "claude",
      model: data.model ?? null,
      isConfigured: data.isConfigured ?? false,
    };
  },

  // Update AI provider, model and key (via Edge Function — agency_settings requires service role)
  async updateProviderConfig(
    provider: AgentProvider,
    apiKey?: string,
    model?: string,
  ): Promise<void> {
    console.log("[AgentInsights] Atualizando provider:", provider, "modelo:", model);
    const { data, error } = await supabase.functions.invoke("agency-settings", {
      body: {
        action: "update_ai_provider",
        provider,
        apiKey: apiKey ?? null,
        model: model ?? null,
      },
    });

    if (error) {
      const ctx = (error as { context?: unknown }).context;
      if (ctx instanceof Response) {
        const payload = (await ctx.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? error.message);
      }
      throw new Error(error.message);
    }

    const maybeError = data as { error?: string } | null;
    if (maybeError?.error) throw new Error(maybeError.error);
  },
};
