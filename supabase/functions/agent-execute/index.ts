import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getSupabaseAdmin() {
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  return createClient(Deno.env.get("SUPABASE_URL") ?? "", key, {
    global: { headers: { Authorization: `Bearer ${key}` } },
  });
}

type AuthContext = {
  userId: string;
  agencyId: string;
  role: string;
};

function getBearerToken(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? "";
}

async function requireAuthContext(
  req: Request,
  supabase: ReturnType<typeof getSupabaseAdmin>,
): Promise<AuthContext> {
  const token = getBearerToken(req);
  if (!token) throw new Error("Nao autenticado.");

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) throw new Error("Sessao invalida.");

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("id, agency_id, role")
    .eq("id", authData.user.id)
    .single<{ id: string; agency_id: string | null; role: string }>();

  if (userError || !userRow?.agency_id) throw new Error("Usuario sem agencia configurada.");

  return {
    userId: authData.user.id,
    agencyId: userRow.agency_id,
    role: userRow.role,
  };
}

// ─── AI Provider Router ───────────────────────────────────────────────────────

async function callAIProvider(
  provider: string,
  apiKey: string,
  model: string | null,
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  if (provider === "claude") {
    const resolvedModel = model ?? "claude-sonnet-4-6";
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: resolvedModel,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic API error ${res.status}: ${err}`);
    }
    const json = await res.json() as { content: Array<{ type: string; text: string }> };
    return json.content.find((c) => c.type === "text")?.text ?? "";
  }

  if (provider === "gpt") {
    const resolvedModel = model ?? "gpt-4o";
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: resolvedModel,
        max_tokens: 4096,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error ${res.status}: ${err}`);
    }
    const json = await res.json() as { choices: Array<{ message: { content: string } }> };
    return json.choices[0]?.message?.content ?? "";
  }

  if (provider === "gemini") {
    const resolvedModel = model ?? "gemini-2.5-pro";
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${resolvedModel}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${userMessage}` }] }],
          generationConfig: { maxOutputTokens: 4096 },
        }),
      },
    );
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${err}`);
    }
    const json = await res.json() as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
    };
    return json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  }

  throw new Error(`Provider não suportado: ${provider}`);
}

// ─── Context Data Fetcher ─────────────────────────────────────────────────────

async function fetchContextData(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  context: string,
  agencyId: string,
): Promise<Record<string, unknown>> {
  switch (context) {
    case "dashboard": {
      const [projects, contracts, onboardings] = await Promise.allSettled([
        supabase.from("projects").select("id, name, status, created_at, project_tasks(id, status, due_date, priority)")
          .eq("agency_id", agencyId).limit(20),
        supabase.from("contracts").select("id, title, status, created_at").eq("agency_id", agencyId).limit(30),
        supabase.from("onboarding_runs").select("id, status, created_at").eq("agency_id", agencyId).limit(10),
      ]);
      return {
        projects: projects.status === "fulfilled" ? projects.value.data : [],
        contracts: contracts.status === "fulfilled" ? contracts.value.data : [],
        onboardings: onboardings.status === "fulfilled" ? onboardings.value.data : [],
      };
    }
    case "projects": {
      const { data } = await supabase.from("projects")
        .select("id, name, status, created_at, project_tasks(id, title, status, due_date, priority, assignee_id)")
        .eq("agency_id", agencyId).limit(20);
      return { projects: data ?? [] };
    }
    case "templates": {
      const { data } = await supabase.from("agency_templates")
        .select("id, name, description, created_at, template_columns(id, title), template_tasks(id, title, priority, template_task_checklists(id, title))")
        .eq("agency_id", agencyId).limit(10);
      return { templates: data ?? [] };
    }
    case "automations": {
      const { data } = await supabase.from("automation_flows")
        .select("id, name, trigger, status, automation_steps(id, type, enabled, config)")
        .eq("agency_id", agencyId).limit(20);
      return { flows: data ?? [] };
    }
    case "contracts": {
      const { data } = await supabase.from("contracts")
        .select("id, title, status, created_at, signed_at").eq("agency_id", agencyId).limit(30);
      return { contracts: data ?? [] };
    }
    case "onboarding": {
      const { data: runs } = await supabase.from("onboarding_runs")
        .select("id, status, created_at, clients(name)")
        .eq("agency_id", agencyId).limit(10);
      const runIds = (runs ?? []).map((r: { id: string }) => r.id);
      const { data: logs } = runIds.length > 0
        ? await supabase.from("onboarding_step_logs").select("run_id, status, step_id").in("run_id", runIds)
        : { data: [] };
      return { runs: runs ?? [], step_logs: logs ?? [] };
    }
    default:
      return {};
  }
}

// ─── Analyze Handler ──────────────────────────────────────────────────────────

async function handleAnalyze(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  agencyId: string,
  userId: string,
  context: string,
): Promise<Response> {
  const logs: string[] = [];
  logs.push(`[AgentAnalyze] Iniciando análise para contexto: ${context}, agência: ${agencyId}`);

  // Fetch AI provider config
  const { data: settings } = await supabase.from("agency_settings")
    .select("ai_provider, ai_provider_keys, ai_model")
    .limit(1).maybeSingle();

  const provider = (settings as { ai_provider?: string } | null)?.ai_provider ?? "claude";
  const keys = ((settings as { ai_provider_keys?: Record<string, string> } | null)?.ai_provider_keys ?? {});
  const model = (settings as { ai_model?: string } | null)?.ai_model ?? null;
  const apiKey = keys[provider] ?? Deno.env.get(
    provider === "claude" ? "ANTHROPIC_API_KEY" :
    provider === "gpt" ? "OPENAI_API_KEY" : "GEMINI_API_KEY",
  ) ?? "";

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: `API key não configurada para provider: ${provider}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }

  logs.push(`[AgentAnalyze] Provider: ${provider}, modelo: ${model ?? "padrão"}`);

  // Fetch context data
  const contextData = await fetchContextData(supabase, context, agencyId);
  logs.push(`[AgentAnalyze] Dados do contexto carregados`);

  const systemPrompt = `Você é um assistente operacional especializado em gestão de agências digitais.
Analise os dados fornecidos e gere insights acionáveis em português.
Responda APENAS com JSON válido no formato:
{
  "insights": [
    {
      "category": "gap" | "issue" | "opportunity" | "warning",
      "priority": "low" | "medium" | "high" | "critical",
      "title": "Título curto (máx 80 chars)",
      "description": "Descrição detalhada do problema ou oportunidade",
      "evidence": { "campo": valor },
      "suggested_actions": ["ação 1", "ação 2"]
    }
  ]
}
Gere entre 1 e 5 insights relevantes. Priorize problemas reais com evidências nos dados.`;

  const userMessage = `Contexto: ${context}\nDados: ${JSON.stringify(contextData, null, 2)}`;

  let rawText: string;
  try {
    rawText = await callAIProvider(provider, apiKey, model, systemPrompt, userMessage);
    logs.push(`[AgentAnalyze] IA respondeu com ${rawText.length} caracteres`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logs.push(`[AgentAnalyze] Erro na chamada à IA: ${msg}`);
    return new Response(
      JSON.stringify({ error: msg, logs }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }

  // Parse JSON from AI response
  let parsedInsights: Array<{
    category: string; priority: string; title: string; description: string;
    evidence?: Record<string, unknown>; suggested_actions?: string[];
  }> = [];

  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : rawText;
    const parsed = JSON.parse(jsonStr) as { insights?: typeof parsedInsights };
    parsedInsights = parsed.insights ?? [];
  } catch {
    logs.push(`[AgentAnalyze] Falha ao parsear JSON da IA — usando fallback`);
    parsedInsights = [{
      category: "warning",
      priority: "medium",
      title: "Análise disponível",
      description: rawText.slice(0, 500),
      evidence: {},
    }];
  }

  // Invalidate previous active insights for this agency+context
  await supabase.from("agent_insights")
    .update({ status: "dismissed" })
    .eq("agency_id", agencyId)
    .eq("context", context)
    .eq("status", "active");

  // Insert new insights
  const validCategories = ["gap", "issue", "opportunity", "warning"];
  const validPriorities = ["low", "medium", "high", "critical"];
  const insightRows = parsedInsights.map((ins) => ({
    agency_id: agencyId,
    context,
    category: validCategories.includes(ins.category) ? ins.category : "warning",
    priority: validPriorities.includes(ins.priority) ? ins.priority : "medium",
    title: (ins.title ?? "Insight").slice(0, 255),
    description: ins.description ?? "",
    evidence: ins.evidence ?? {},
    status: "active",
    generated_by_user_id: userId,
  }));

  const { data: newInsights, error: insError } = await supabase.from("agent_insights")
    .insert(insightRows).select();

  if (insError) {
    logs.push(`[AgentAnalyze] Erro ao salvar insights: ${insError.message}`);
  } else {
    logs.push(`[AgentAnalyze] ${newInsights?.length ?? 0} insights salvos`);
  }

  // Log analyze_completed
  await supabase.from("agent_execution_logs").insert({
    agency_id: agencyId,
    event_type: "analyze_completed",
    message: `Análise concluída para contexto "${context}" via ${provider}. ${insightRows.length} insight(s) gerado(s).`,
    metadata: { context, provider, insightCount: insightRows.length },
  });

  return new Response(
    JSON.stringify({ insights: newInsights ?? [], provider, logs }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
  );
}

// ─── Suggest Handler ──────────────────────────────────────────────────────────

async function handleSuggest(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  agencyId: string,
  userId: string,
  context: string,
): Promise<Response> {
  const logs: string[] = [];
  logs.push(`[AgentSuggest] Gerando sugestões para contexto: ${context}`);

  const { data: insights, error: insError } = await supabase.from("agent_insights")
    .select("*")
    .eq("agency_id", agencyId)
    .eq("context", context)
    .eq("status", "active");

  if (insError || !insights?.length) {
    logs.push(`[AgentSuggest] Nenhum insight ativo encontrado`);
    return new Response(
      JSON.stringify({ actions: [], logs }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  }

  type InsightRow = {
    id: string;
    category: string;
    priority: string;
    title: string;
    description: string;
    evidence: Record<string, unknown>;
  };

  const actionRows: Array<{
    agency_id: string; insight_id: string; context: string; action_type: string;
    title: string; description: string; payload: Record<string, unknown>;
    preview_items: string[]; status: string; created_by: string;
  }> = [];

  for (const insight of (insights as InsightRow[])) {
    const ev = insight.evidence ?? {};

    if (insight.category === "gap" && ev.taskWithoutAssignee) {
      actionRows.push({
        agency_id: agencyId, insight_id: insight.id, context,
        action_type: "assign_task_owner",
        title: `Atribuir responsável: ${insight.title}`,
        description: insight.description,
        payload: { taskId: ev.taskId ?? null },
        preview_items: [`Atribuir responsável para tarefa identificada pelo insight`, `Contexto: ${context}`],
        status: "pending", created_by: userId,
      });
    } else if (insight.category === "issue" && ev.tasksWithoutDueDate) {
      actionRows.push({
        agency_id: agencyId, insight_id: insight.id, context,
        action_type: "update_due_date",
        title: `Definir prazo: ${insight.title}`,
        description: insight.description,
        payload: { taskIds: ev.taskIds ?? [] },
        preview_items: [`Definir prazo para ${(ev.taskIds as string[] | undefined)?.length ?? 1} tarefa(s) sem data`],
        status: "pending", created_by: userId,
      });
    } else if (insight.category === "opportunity" && context === "templates") {
      actionRows.push({
        agency_id: agencyId, insight_id: insight.id, context,
        action_type: "create_task_checklist",
        title: `Adicionar checklist: ${insight.title}`,
        description: insight.description,
        payload: { templateId: ev.templateId ?? null },
        preview_items: [`Criar checklist padrão para template`, `Melhora a padronização do processo`],
        status: "pending", created_by: userId,
      });
    } else if (insight.category === "warning" && context === "automations") {
      actionRows.push({
        agency_id: agencyId, insight_id: insight.id, context,
        action_type: "add_automation_step",
        title: `Completar automação: ${insight.title}`,
        description: insight.description,
        payload: { flowId: ev.flowId ?? null },
        preview_items: [`Adicionar etapa à automação (criada desabilitada por segurança)`, `Revisar e habilitar manualmente`],
        status: "pending", created_by: userId,
      });
    } else if (context === "contracts") {
      actionRows.push({
        agency_id: agencyId, insight_id: insight.id, context,
        action_type: "link_template_to_contract",
        title: `Vincular template: ${insight.title}`,
        description: insight.description,
        payload: { contractId: ev.contractId ?? null, templateId: ev.templateId ?? null },
        preview_items: [`Vincular template operacional ao contrato`, `Automatiza criação de projeto após assinatura`],
        status: "pending", created_by: userId,
      });
    } else {
      // Generic action for unrecognized patterns
      actionRows.push({
        agency_id: agencyId, insight_id: insight.id, context,
        action_type: "create_task",
        title: `Ação recomendada: ${insight.title}`,
        description: insight.description,
        payload: { insight_id: insight.id },
        preview_items: [`Criar tarefa a partir do insight identificado`, insight.description.slice(0, 100)],
        status: "pending", created_by: userId,
      });
    }
  }

  if (actionRows.length === 0) {
    logs.push(`[AgentSuggest] Nenhuma ação mapeada para os insights`);
    return new Response(
      JSON.stringify({ actions: [], logs }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  }

  const { data: newActions, error: actError } = await supabase.from("agent_actions")
    .insert(actionRows).select();

  if (actError) {
    logs.push(`[AgentSuggest] Erro ao salvar ações: ${actError.message}`);
    return new Response(
      JSON.stringify({ error: actError.message, logs }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }

  logs.push(`[AgentSuggest] ${newActions?.length ?? 0} ações sugeridas`);

  await supabase.from("agent_execution_logs").insert({
    agency_id: agencyId,
    event_type: "action_suggested",
    message: `${newActions?.length ?? 0} ação(ões) sugerida(s) para contexto "${context}"`,
    metadata: { context, actionCount: newActions?.length ?? 0 },
  });

  return new Response(
    JSON.stringify({ actions: newActions ?? [], logs }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
  );
}

// ─── Execute Handler ──────────────────────────────────────────────────────────

async function handleExecute(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  agencyId: string,
  _userId: string,
  actionId: string,
): Promise<Response> {
  const logs: string[] = [];
  logs.push(`[AgentExecute] Executando ação: ${actionId}`);

  // Fetch action
  const { data: action, error: actError } = await supabase.from("agent_actions")
    .select("*").eq("id", actionId).eq("agency_id", agencyId).maybeSingle();

  if (actError || !action) {
    return new Response(
      JSON.stringify({ error: "Ação não encontrada ou não pertence à agência" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 },
    );
  }

  type ActionRow = {
    status: string; action_type: string; payload: Record<string, unknown>;
    insight_id: string | null; context: string;
  };
  const act = action as ActionRow;

  if (act.status !== "approved") {
    return new Response(
      JSON.stringify({ error: `Ação precisa estar aprovada antes de executar. Status atual: ${act.status}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }

  await supabase.from("agent_execution_logs").insert({
    agency_id: agencyId, action_id: actionId,
    event_type: "execute_started",
    message: `Execução iniciada para ação tipo "${act.action_type}"`,
    metadata: { actionId, actionType: act.action_type },
  });

  let result: Record<string, unknown> = {};
  let execError: string | null = null;

  try {
    switch (act.action_type) {
      case "create_task": {
        const { data: task, error } = await supabase.from("project_tasks").insert({
          agency_id: agencyId,
          project_id: act.payload.project_id ?? null,
          column_id: act.payload.column_id ?? null,
          title: (act.payload.title as string) ?? "Tarefa criada pelo agente",
          priority: act.payload.priority ?? "medium",
          status: "backlog",
          source: "automation",
        }).select().single();
        if (error) throw error;
        result = { taskId: (task as { id: string }).id };
        logs.push(`[AgentExecute] Tarefa criada: ${(task as { id: string }).id}`);
        break;
      }
      case "create_task_checklist": {
        const { data: item, error } = await supabase.from("project_task_checklists").insert({
          task_id: act.payload.task_id ?? null,
          title: (act.payload.title as string) ?? "Item de checklist",
          is_checked: false,
        }).select().single();
        if (error) throw error;
        result = { checklistId: (item as { id: string }).id };
        logs.push(`[AgentExecute] Checklist criado`);
        break;
      }
      case "assign_task_owner": {
        const { error } = await supabase.from("project_tasks")
          .update({ assignee_id: act.payload.assignee_id, updated_at: new Date().toISOString() })
          .eq("id", act.payload.taskId as string)
          .eq("agency_id", agencyId);
        if (error) throw error;
        result = { taskId: act.payload.taskId };
        logs.push(`[AgentExecute] Responsável atribuído`);
        break;
      }
      case "update_due_date": {
        const taskIds = (act.payload.taskIds as string[]) ?? [];
        for (const tid of taskIds) {
          await supabase.from("project_tasks")
            .update({ due_date: act.payload.due_date ?? null, updated_at: new Date().toISOString() })
            .eq("id", tid).eq("agency_id", agencyId);
        }
        result = { updatedCount: taskIds.length };
        logs.push(`[AgentExecute] Prazos atualizados: ${taskIds.length}`);
        break;
      }
      case "add_automation_step": {
        const { data: step, error } = await supabase.from("automation_steps").insert({
          agency_id: agencyId,
          flow_id: act.payload.flowId ?? null,
          type: act.payload.type ?? "send_message",
          enabled: false, // always disabled for safety
          config: act.payload.config ?? {},
        }).select().single();
        if (error) throw error;
        result = { stepId: (step as { id: string }).id };
        logs.push(`[AgentExecute] Passo de automação criado (desabilitado)`);
        break;
      }
      case "link_template_to_contract": {
        const { error } = await supabase.from("contracts")
          .update({ template_id: act.payload.templateId ?? null })
          .eq("id", act.payload.contractId as string)
          .eq("agency_id", agencyId);
        if (error) throw error;
        result = { contractId: act.payload.contractId };
        logs.push(`[AgentExecute] Template vinculado ao contrato`);
        break;
      }
      case "create_project_column": {
        const { data: col, error } = await supabase.from("project_columns").insert({
          agency_id: agencyId,
          project_id: act.payload.project_id ?? null,
          title: (act.payload.title as string) ?? "Nova Coluna",
          position: act.payload.position ?? 0,
          color: act.payload.color ?? null,
        }).select().single();
        if (error) throw error;
        result = { columnId: (col as { id: string }).id };
        logs.push(`[AgentExecute] Coluna criada`);
        break;
      }
      case "update_task_priority": {
        const { error } = await supabase.from("project_tasks")
          .update({ priority: act.payload.priority ?? "medium", updated_at: new Date().toISOString() })
          .eq("id", act.payload.taskId as string)
          .eq("agency_id", agencyId);
        if (error) throw error;
        result = { taskId: act.payload.taskId };
        logs.push(`[AgentExecute] Prioridade atualizada`);
        break;
      }
      default:
        throw new Error(`Tipo de ação não suportado: ${act.action_type}`);
    }

    // Mark action as executed
    await supabase.from("agent_actions").update({
      status: "executed",
      executed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", actionId);

    // Mark parent insight as acted_on
    if (act.insight_id) {
      await supabase.from("agent_insights").update({
        status: "acted_on",
        updated_at: new Date().toISOString(),
      }).eq("id", act.insight_id);
    }

    await supabase.from("agent_execution_logs").insert({
      agency_id: agencyId, action_id: actionId,
      event_type: "execute_completed",
      message: `Ação "${act.action_type}" executada com sucesso`,
      metadata: { actionId, result },
    });

  } catch (err) {
    execError = err instanceof Error ? err.message : String(err);
    logs.push(`[AgentExecute] Erro ao executar: ${execError}`);

    await supabase.from("agent_actions").update({
      status: "failed",
      error_message: execError,
      updated_at: new Date().toISOString(),
    }).eq("id", actionId);

    await supabase.from("agent_execution_logs").insert({
      agency_id: agencyId, action_id: actionId,
      event_type: "execute_failed",
      message: `Falha ao executar ação "${act.action_type}": ${execError}`,
      metadata: { actionId, error: execError },
    });

    return new Response(
      JSON.stringify({ error: execError, logs }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }

  return new Response(
    JSON.stringify({ success: true, result, logs }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = getSupabaseAdmin();

  try {
    const body = await req.json() as {
      mode: string; context?: string; actionId?: string;
    };

    const { mode, context, actionId } = body;
    const { agencyId, userId, role } = await requireAuthContext(req, supabase);

    if (mode === "analyze") {
      if (!context) {
        return new Response(
          JSON.stringify({ error: "context é obrigatório para mode=analyze" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
        );
      }
      return await handleAnalyze(supabase, agencyId, userId, context);
    }

    if (mode === "suggest") {
      if (!context) {
        return new Response(
          JSON.stringify({ error: "context é obrigatório para mode=suggest" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
        );
      }
      return await handleSuggest(supabase, agencyId, userId, context);
    }

    if (mode === "execute") {
      if (!["owner", "admin", "manager"].includes(role)) {
        return new Response(
          JSON.stringify({ error: "Permissao insuficiente para executar acoes do agente." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 },
        );
      }
      if (!actionId) {
        return new Response(
          JSON.stringify({ error: "actionId é obrigatório para mode=execute" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
        );
      }
      return await handleExecute(supabase, agencyId, userId, actionId);
    }

    return new Response(
      JSON.stringify({ error: `Modo inválido: ${mode}. Use analyze, suggest ou execute.` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[AgentExecute] Erro geral:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
