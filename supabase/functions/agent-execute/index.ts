import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.27.0";
import OpenAI from "https://esm.sh/openai@4.56.0";
// @ts-ignore - Deno ESM import
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getSupabaseAdmin() {
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    supabaseKey,
    { global: { headers: { Authorization: `Bearer ${supabaseKey}` } } },
  );
}

// ─── AI Provider Router ────────────────────────────────────────────────────────

const DEFAULT_MODELS: Record<string, string> = {
  claude: "claude-sonnet-4-6",
  gpt: "gpt-4o",
  gemini: "gemini-2.5-pro",
};

async function callAIProvider(
  provider: string,
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  selectedModel?: string,
): Promise<string> {
  const model = selectedModel ?? DEFAULT_MODELS[provider] ?? DEFAULT_MODELS["claude"];
  console.log(`[AgentAnalyze] Chamando provider: ${provider} | modelo: ${model}`);

  if (provider === "claude") {
    const anthropic = new Anthropic({ apiKey });
    const msg = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });
    return msg.content[0].type === "text" ? msg.content[0].text : "";
  }

  if (provider === "gpt") {
    const openai = new OpenAI({ apiKey });
    const chat = await openai.chat.completions.create({
      model,
      max_tokens: 4096,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });
    return chat.choices[0]?.message?.content ?? "";
  }

  if (provider === "gemini") {
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({ model });
    const result = await geminiModel.generateContent(`${systemPrompt}\n\n${userMessage}`);
    return result.response.text();
  }

  throw new Error(`Provider não suportado: ${provider}`);
}

// ─── Context Data Fetcher ──────────────────────────────────────────────────────

async function fetchContextData(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  agencyId: string,
  context: string,
): Promise<Record<string, unknown>> {
  const data: Record<string, unknown> = {};

  const { data: team } = await supabase
    .from("users")
    .select("id, full_name, role, status, department, job_title")
    .eq("agency_id", agencyId)
    .eq("status", "active");
  data.team = team ?? [];

  if (["dashboard", "projects"].includes(context)) {
    const { data: projects } = await supabase
      .from("projects")
      .select(
        "id, name, status, created_at, template_id, client_id, project_tasks(id, title, priority, assignee_id, due_date, status, column_id)",
      )
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false })
      .limit(20);
    data.projects = projects ?? [];
  }

  if (["dashboard", "templates"].includes(context)) {
    const { data: templates } = await supabase
      .from("agency_templates")
      .select(
        "id, name, status, category, template_tasks(id, title, assignee_rule, relative_due_date, template_task_checklists(id)), template_columns(id, title)",
      )
      .eq("agency_id", agencyId);
    data.templates = templates ?? [];
  }

  if (["dashboard", "automations"].includes(context)) {
    const { data: flows } = await supabase
      .from("automation_flows")
      .select(
        "id, name, is_active, mode, automation_steps(id, type, enabled, config_status, config)",
      )
      .eq("agency_id", agencyId);
    data.automations = flows ?? [];
  }

  if (["dashboard", "contracts"].includes(context)) {
    const { data: contracts } = await supabase
      .from("contracts")
      .select("id, status, client_id, template_id, created_at, signed_at")
      .eq("agency_id", agencyId)
      .limit(30);
    data.contracts = contracts ?? [];

    const { data: templates } = await supabase
      .from("agency_templates")
      .select("id, name, linked_contract_template_id")
      .eq("agency_id", agencyId);
    data.operationalTemplates = templates ?? [];
  }

  if (["dashboard", "onboarding"].includes(context)) {
    const { data: runs } = await supabase
      .from("onboarding_runs")
      .select("id, status, started_at, completed_at, client_id")
      .order("started_at", { ascending: false })
      .limit(10);
    data.onboardingRuns = runs ?? [];
  }

  return data;
}

// ─── Analyze Mode ─────────────────────────────────────────────────────────────

async function handleAnalyze(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  agencyId: string,
  userId: string,
  context: string,
  logs: string[],
) {
  logs.push(`[AgentAnalyze] Iniciando análise — contexto: ${context}`);

  const { data: settings } = await supabase
    .from("agency_settings")
    .select("ai_provider, ai_provider_keys, ai_model")
    .single();

  const provider: string = (settings as { ai_provider?: string } | null)?.ai_provider ?? "claude";
  const keys = ((settings as { ai_provider_keys?: Record<string, string> } | null)?.ai_provider_keys ?? {}) as Record<string, string>;
  const selectedModel: string | null = (settings as { ai_model?: string | null } | null)?.ai_model ?? null;
  const envKey =
    provider === "claude"
      ? "ANTHROPIC_API_KEY"
      : provider === "gpt"
      ? "OPENAI_API_KEY"
      : "GEMINI_API_KEY";
  const apiKey = keys[provider] ?? Deno.env.get(envKey) ?? "";

  if (!apiKey) throw new Error(`API key não configurada para provider: ${provider}`);

  const contextData = await fetchContextData(supabase, agencyId, context);
  logs.push(`[AgentAnalyze] Dados coletados. Provider: ${provider}`);

  const systemPrompt = `Você é o Agente Operacional de uma agência de marketing digital brasileira.
Analise os dados operacionais fornecidos e gere insights priorizados.

Regras:
- Seja específico e acionável. Nunca gere insights vagos.
- 'critical': impacto imediato em receita ou entrega de cliente
- 'high': bloqueia eficiência operacional
- 'medium': oportunidade de melhoria significativa
- 'low': sugestão de otimização
- Categorias: 'gap' (algo faltando), 'issue' (problema ativo), 'opportunity' (algo a aproveitar), 'warning' (risco futuro)
- Gere entre 3 e 8 insights relevantes

Responda EXCLUSIVAMENTE com JSON válido, sem markdown:
{
  "insights": [
    {
      "category": "gap|issue|opportunity|warning",
      "priority": "low|medium|high|critical",
      "title": "string curto (máx 80 chars)",
      "description": "string detalhada explicando o problema e impacto",
      "evidence": { "key": "value de dados que justificam o insight" },
      "suggested_actions": ["ação 1", "ação 2"]
    }
  ]
}`;

  const userMessage = `Contexto atual: ${context}\n\nDados da operação:\n${JSON.stringify(contextData, null, 2)}`;

  const rawText = await callAIProvider(provider, apiKey, systemPrompt, userMessage, selectedModel ?? undefined);
  logs.push(`[AgentAnalyze] Resposta recebida do provider`);

  let parsed: { insights: Array<{ category: string; priority: string; title: string; description: string; evidence?: Record<string, unknown>; suggested_actions?: string[] }> };
  try {
    const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Resposta do provider não é JSON válido: ${rawText.slice(0, 200)}`);
  }

  // Dismiss stale insights for this context
  await supabase
    .from("agent_insights")
    .update({ status: "dismissed", dismissed_at: new Date().toISOString() })
    .eq("agency_id", agencyId)
    .eq("context", context)
    .eq("status", "active");

  const insightsToInsert = (parsed.insights ?? []).map((i) => ({
    agency_id: agencyId,
    context,
    category: i.category,
    priority: i.priority,
    title: i.title,
    description: i.description,
    evidence: i.evidence ?? {},
    status: "active",
    generated_by_user_id: userId,
  }));

  const { data: insertedInsights, error: insightError } = await supabase
    .from("agent_insights")
    .insert(insightsToInsert)
    .select();

  if (insightError) throw insightError;

  await supabase.from("agent_execution_logs").insert([{
    agency_id: agencyId,
    event_type: "analyze_completed",
    message: `Análise concluída: ${insertedInsights?.length ?? 0} insights gerados para contexto "${context}" via ${provider}`,
    metadata: { context, insightCount: insertedInsights?.length ?? 0, provider },
  }]);

  logs.push(`[AgentAnalyze] ${insertedInsights?.length ?? 0} insights salvos`);

  return new Response(
    JSON.stringify({ insights: insertedInsights, provider, logs }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
  );
}

// ─── Suggest Mode ─────────────────────────────────────────────────────────────

function mapInsightToActions(
  insight: Record<string, unknown>,
  agencyId: string,
  userId: string,
  contextData: Record<string, unknown>,
): Array<Record<string, unknown>> {
  const actions: Array<Record<string, unknown>> = [];
  const category = insight.category as string;
  const context = insight.context as string;
  const evidence = (insight.evidence ?? {}) as Record<string, unknown>;

  const projects = (contextData.projects ?? []) as Array<Record<string, unknown>>;
  const automations = (contextData.automations ?? []) as Array<Record<string, unknown>>;
  const operationalTemplates = (contextData.operationalTemplates ?? []) as Array<Record<string, unknown>>;

  if (category === "gap" && ["projects", "dashboard"].includes(context)) {
    // Tasks without assignee
    for (const project of projects.slice(0, 3)) {
      const tasks = (project.project_tasks ?? []) as Array<Record<string, unknown>>;
      const unassigned = tasks.filter((t) => !t.assignee_id).slice(0, 3);
      for (const task of unassigned) {
        actions.push({
          agency_id: agencyId,
          insight_id: insight.id,
          context,
          action_type: "assign_task_owner",
          title: `Atribuir responsável para "${task.title}"`,
          description: `Tarefa sem responsável no projeto "${project.name}"`,
          payload: { task_id: task.id, project_id: project.id },
          preview_items: JSON.stringify([
            `Tarefa: ${task.title}`,
            `Projeto: ${project.name}`,
            `Ação: atribuir responsável`,
          ]),
          status: "pending",
          created_by: userId,
        });
      }

      // Tasks without due date
      const noDueDate = tasks.filter((t) => !t.due_date && !t.assignee_id === false).slice(0, 2);
      for (const task of noDueDate) {
        actions.push({
          agency_id: agencyId,
          insight_id: insight.id,
          context,
          action_type: "update_due_date",
          title: `Definir prazo para "${task.title}"`,
          description: `Tarefa sem prazo definido no projeto "${project.name}"`,
          payload: { task_id: task.id, due_date: null },
          preview_items: JSON.stringify([
            `Tarefa: ${task.title}`,
            `Projeto: ${project.name}`,
            `Ação: definir prazo (sugerido: +2 dias)`,
          ]),
          status: "pending",
          created_by: userId,
        });
      }
    }
  }

  if (category === "gap" && ["automations", "dashboard"].includes(context)) {
    for (const flow of automations.slice(0, 2)) {
      const steps = (flow.automation_steps ?? []) as Array<Record<string, unknown>>;
      const hasTemplate = steps.some((s) => s.type === "apply_agency_template");
      if (!hasTemplate) {
        actions.push({
          agency_id: agencyId,
          insight_id: insight.id,
          context,
          action_type: "add_automation_step",
          title: `Adicionar step de template à automação "${flow.name}"`,
          description: `Automação sem step de aplicação de template operacional`,
          payload: {
            flow_id: flow.id,
            step_type: "apply_agency_template",
            step_name: "Aplicar template operacional",
            step_description: "Criado pelo Agente Operacional",
            config: { requireManualReview: true },
          },
          preview_items: JSON.stringify([
            `Automação: ${flow.name}`,
            `Novo step: Aplicar template operacional`,
            `Status inicial: desativado (requer revisão)`,
          ]),
          status: "pending",
          created_by: userId,
        });
      }
    }
  }

  if (category === "gap" && ["contracts", "dashboard"].includes(context)) {
    for (const tpl of operationalTemplates.filter((t) => !t.linked_contract_template_id).slice(0, 2)) {
      actions.push({
        agency_id: agencyId,
        insight_id: insight.id,
        context,
        action_type: "link_template_to_contract",
        title: `Vincular template "${tpl.name}" a um contrato`,
        description: `Template operacional sem contrato vinculado`,
        payload: { template_id: tpl.id, contract_template_id: null },
        preview_items: JSON.stringify([
          `Template: ${tpl.name}`,
          `Ação: vincular a template de contrato`,
          `Nota: selecione o contrato após aprovar`,
        ]),
        status: "pending",
        created_by: userId,
      });
    }
  }

  // Fallback: if no specific actions mapped, create a generic suggestion note
  if (actions.length === 0 && (evidence as Record<string, unknown>)) {
    actions.push({
      agency_id: agencyId,
      insight_id: insight.id,
      context,
      action_type: "create_task",
      title: `Resolver: ${(insight.title as string).slice(0, 60)}`,
      description: insight.description as string,
      payload: { title: `Resolver: ${insight.title}`, project_id: null },
      preview_items: JSON.stringify([
        `Ação: criar tarefa de acompanhamento`,
        `Título: Resolver — ${(insight.title as string).slice(0, 50)}`,
      ]),
      status: "pending",
      created_by: userId,
    });
  }

  return actions;
}

async function handleSuggest(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  agencyId: string,
  userId: string,
  context: string,
  logs: string[],
) {
  logs.push(`[AgentSuggest] Gerando sugestões para contexto: ${context}`);

  const { data: insights } = await supabase
    .from("agent_insights")
    .select("*")
    .eq("agency_id", agencyId)
    .eq("context", context)
    .eq("status", "active");

  const contextData = await fetchContextData(supabase, agencyId, context);
  const actionsToCreate: Array<Record<string, unknown>> = [];

  for (const insight of insights ?? []) {
    const mapped = mapInsightToActions(insight, agencyId, userId, contextData);
    actionsToCreate.push(...mapped);
  }

  const { data: insertedActions, error: actErr } = await supabase
    .from("agent_actions")
    .insert(actionsToCreate)
    .select();

  if (actErr) throw actErr;

  await supabase.from("agent_execution_logs").insert([{
    agency_id: agencyId,
    event_type: "action_suggested",
    message: `${insertedActions?.length ?? 0} ações sugeridas para contexto "${context}"`,
    metadata: { context, actionCount: insertedActions?.length ?? 0 },
  }]);

  logs.push(`[AgentSuggest] ${insertedActions?.length ?? 0} ações criadas`);

  return new Response(
    JSON.stringify({ actions: insertedActions, logs }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
  );
}

// ─── Execute Mode ─────────────────────────────────────────────────────────────

async function executeAction(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  agencyId: string,
  action: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const p = action.payload as Record<string, unknown>;
  const actionType = action.action_type as string;

  console.log(`[AgentAction] Executando: ${actionType}`);

  if (actionType === "create_task") {
    const { data, error } = await supabase
      .from("project_tasks")
      .insert([{
        agency_id: agencyId,
        project_id: p.project_id ?? null,
        column_id: p.column_id ?? null,
        title: p.title,
        description: p.description ?? null,
        priority: p.priority ?? "medium",
        assignee_id: p.assignee_id ?? null,
        due_date: p.due_date ?? null,
        source: "automation",
        status: "todo",
      }])
      .select()
      .single();
    if (error) throw error;
    return { created_task_id: (data as { id: string }).id };
  }

  if (actionType === "create_task_checklist") {
    const items = (p.items ?? []) as Array<{ title: string; position?: number }>;
    const rows = items.map((item, i) => ({
      agency_id: agencyId,
      task_id: p.task_id,
      title: item.title,
      position: item.position ?? i,
      is_done: false,
    }));
    const { data, error } = await supabase.from("project_task_checklists").insert(rows).select();
    if (error) throw error;
    return { created_checklist_items: (data as unknown[]).length };
  }

  if (actionType === "assign_task_owner") {
    const { data, error } = await supabase
      .from("project_tasks")
      .update({ assignee_id: p.assignee_id, updated_at: new Date().toISOString() })
      .eq("id", p.task_id)
      .eq("agency_id", agencyId)
      .select()
      .single();
    if (error) throw error;
    return { updated_task_id: (data as { id: string }).id };
  }

  if (actionType === "update_due_date") {
    const { data, error } = await supabase
      .from("project_tasks")
      .update({ due_date: p.due_date, updated_at: new Date().toISOString() })
      .eq("id", p.task_id)
      .eq("agency_id", agencyId)
      .select()
      .single();
    if (error) throw error;
    return { updated_task_id: (data as { id: string }).id };
  }

  if (actionType === "add_automation_step") {
    const { data: existing } = await supabase
      .from("automation_steps")
      .select("step_order")
      .eq("flow_id", p.flow_id)
      .order("step_order", { ascending: false })
      .limit(1);
    const nextOrder = ((existing?.[0] as { step_order?: number } | undefined)?.step_order ?? 0) + 1;

    const { data, error } = await supabase
      .from("automation_steps")
      .insert([{
        flow_id: p.flow_id,
        agency_id: agencyId,
        type: p.step_type,
        name: p.step_name,
        description: p.step_description ?? "",
        step_order: nextOrder,
        enabled: false,
        is_automatic: false,
        config: p.config ?? {},
        config_status: "pending",
      }])
      .select()
      .single();
    if (error) throw error;
    return { created_step_id: (data as { id: string }).id };
  }

  if (actionType === "link_template_to_contract") {
    const { data, error } = await supabase
      .from("agency_templates")
      .update({
        linked_contract_template_id: p.contract_template_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", p.template_id)
      .eq("agency_id", agencyId)
      .select()
      .single();
    if (error) throw error;
    return { updated_template_id: (data as { id: string }).id };
  }

  if (actionType === "update_task_priority") {
    const { data, error } = await supabase
      .from("project_tasks")
      .update({ priority: p.priority, updated_at: new Date().toISOString() })
      .eq("id", p.task_id)
      .eq("agency_id", agencyId)
      .select()
      .single();
    if (error) throw error;
    return { updated_task_id: (data as { id: string }).id };
  }

  if (actionType === "create_project_column") {
    const { data: existing } = await supabase
      .from("project_columns")
      .select("position")
      .eq("project_id", p.project_id)
      .order("position", { ascending: false })
      .limit(1);
    const nextPos = ((existing?.[0] as { position?: number } | undefined)?.position ?? 0) + 1;

    const { data, error } = await supabase
      .from("project_columns")
      .insert([{
        agency_id: agencyId,
        project_id: p.project_id,
        title: p.title,
        position: nextPos,
        color: p.color ?? "#6B7280",
        is_final_column: false,
      }])
      .select()
      .single();
    if (error) throw error;
    return { created_column_id: (data as { id: string }).id };
  }

  throw new Error(`Tipo de ação não suportado: ${actionType}`);
}

async function handleExecute(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  agencyId: string,
  userId: string,
  actionId: string,
  userRole: string,
  logs: string[],
) {
  if (!["owner", "admin"].includes(userRole)) {
    throw new Error("Permissão negada: execute_agent_actions requer role owner ou admin");
  }

  const { data: action, error: fetchErr } = await supabase
    .from("agent_actions")
    .select("*")
    .eq("id", actionId)
    .eq("agency_id", agencyId)
    .single();

  if (fetchErr || !action) throw new Error("Ação não encontrada");
  if ((action as { status: string }).status !== "approved") {
    throw new Error(`Ação deve estar aprovada. Status atual: ${(action as { status: string }).status}`);
  }

  logs.push(`[AgentExecute] Executando ação: ${(action as { action_type: string }).action_type}`);

  await supabase.from("agent_execution_logs").insert([{
    agency_id: agencyId,
    action_id: actionId,
    event_type: "execute_started",
    message: `Executando: ${(action as { action_type: string }).action_type}`,
    metadata: { action_type: (action as { action_type: string }).action_type, user_id: userId },
  }]);

  let result: Record<string, unknown>;
  try {
    result = await executeAction(supabase, agencyId, action as Record<string, unknown>);
  } catch (execError) {
    const errMsg = execError instanceof Error ? execError.message : String(execError);
    await supabase
      .from("agent_actions")
      .update({ status: "failed", error_message: errMsg, updated_at: new Date().toISOString() })
      .eq("id", actionId);
    await supabase.from("agent_execution_logs").insert([{
      agency_id: agencyId,
      action_id: actionId,
      event_type: "execute_failed",
      message: errMsg,
      metadata: {},
    }]);
    throw execError;
  }

  await supabase
    .from("agent_actions")
    .update({ status: "executed", executed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", actionId);

  if ((action as { insight_id?: string }).insight_id) {
    await supabase
      .from("agent_insights")
      .update({ status: "acted_on", updated_at: new Date().toISOString() })
      .eq("id", (action as { insight_id: string }).insight_id);
  }

  await supabase.from("agent_execution_logs").insert([{
    agency_id: agencyId,
    action_id: actionId,
    event_type: "execute_completed",
    message: `Ação executada com sucesso: ${(action as { action_type: string }).action_type}`,
    metadata: result,
  }]);

  logs.push(`[AgentExecute] Concluído com sucesso`);

  return new Response(
    JSON.stringify({ success: true, result, logs }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
  );
}

// ─── Main Handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = getSupabaseAdmin();
  const logs: string[] = [];

  try {
    const payload = await req.json();
    const { mode, agencyId, userId, context, actionId } = payload;

    if (!mode || !agencyId || !userId) {
      throw new Error("Parâmetros obrigatórios ausentes: mode, agencyId, userId");
    }

    const { data: userRow } = await supabase
      .from("users")
      .select("agency_id, role")
      .eq("id", userId)
      .eq("agency_id", agencyId)
      .single();

    if (!userRow) throw new Error("Usuário não pertence a esta agência");

    const userRole = (userRow as { role: string }).role;
    logs.push(`[AgentExecute] Mode: ${mode}, Agency: ${agencyId}, Role: ${userRole}`);

    if (mode === "analyze") {
      return await handleAnalyze(supabase, agencyId, userId, context ?? "dashboard", logs);
    }

    if (mode === "suggest") {
      return await handleSuggest(supabase, agencyId, userId, context ?? "dashboard", logs);
    }

    if (mode === "execute") {
      if (!actionId) throw new Error("actionId é obrigatório para mode=execute");
      return await handleExecute(supabase, agencyId, userId, actionId, userRole, logs);
    }

    throw new Error(`Modo inválido: ${mode}`);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logs.push(`[AgentExecute] Erro: ${errMsg}`);
    return new Response(
      JSON.stringify({ error: errMsg, logs }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});
