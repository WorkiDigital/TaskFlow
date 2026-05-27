import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  getSupabaseAdmin,
  normalizePhone,
  getInstanceApiKey,
} from "../_shared/helpers.ts";
import { executeStep } from "../_shared/executeStep.ts";

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = getSupabaseAdmin();
  const logs: string[] = [];

  try {
    const payload = await req.json();
    const {
      action = "trigger",
      trigger,
      agencyId,
      clientId,
      contractId,
      runId: resumeRunId,
      columnId,
      taskId,
      context: extraContext = {},
    } = payload;

    // ── column_notification ───────────────────────────────────────────────────
    if (action === "column_notification") {
      if (!agencyId || !columnId) throw new Error("agencyId e columnId são obrigatórios.");

      const { data: settings } = await supabase
        .from("agency_settings")
        .select("evolution_api_url, evolution_api_key, evolution_instance_name")
        .eq("agency_id", agencyId)
        .maybeSingle<{ evolution_api_url: string | null; evolution_api_key: string | null; evolution_instance_name: string | null }>();

      const { data: col } = await supabase
        .from("project_columns").select("title, automation_config").eq("id", columnId)
        .maybeSingle<{ title: string; automation_config: Record<string, unknown> }>();

      const { data: task } = taskId
        ? await supabase.from("project_tasks").select("title, project_id").eq("id", taskId).maybeSingle<{ title: string; project_id: string }>()
        : { data: null };

      const { data: project } = task?.project_id
        ? await supabase.from("projects").select("client_id, name").eq("id", task.project_id).maybeSingle<{ client_id: string | null; name: string }>()
        : { data: null };

      const { data: client } = project?.client_id
        ? await supabase.from("clients").select("name, phone, whatsapp_group_id").eq("id", project.client_id).maybeSingle<{ name: string; phone: string | null; whatsapp_group_id: string | null }>()
        : { data: null };

      if (settings?.evolution_api_url && settings?.evolution_api_key && settings?.evolution_instance_name && (client?.whatsapp_group_id || client?.phone)) {
        const baseUrl = String(settings.evolution_api_url).replace(/\/$/, "");
        const instanceName = String(settings.evolution_instance_name);
        const instanceKey = await getInstanceApiKey(baseUrl, settings.evolution_api_key, instanceName);
        const dest = client.whatsapp_group_id ?? `${normalizePhone(client.phone)}@s.whatsapp.net`;
        const message = `📋 *${client?.name ?? "Cliente"}*, a tarefa *${task?.title ?? ""}* foi movida para a etapa *${col?.title ?? ""}* do projeto *${project?.name ?? ""}*.`;

        const { requestEvolution } = await import("../_shared/helpers.ts");
        await requestEvolution(`${baseUrl}/message/sendText/${instanceName}`, instanceKey, {
          method: "POST",
          body: JSON.stringify({ number: dest, text: message }),
        });
        logs.push(`WhatsApp enviado para ${dest}`);
      } else {
        logs.push("Evolution API não configurada ou cliente sem número — mensagem ignorada.");
      }

      return new Response(JSON.stringify({ status: "ok", logs }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── resume ────────────────────────────────────────────────────────────────
    if (action === "resume") {
      if (!resumeRunId) throw new Error("runId é obrigatório para action=resume.");
      const { data: run, error: runErr } = await supabase
        .from("automation_runs").select("*").eq("id", resumeRunId)
        .single<{ id: string; agency_id: string; flow_id: string | null; client_id: string | null; contract_id: string | null; status: string; current_step_index: number; context: Record<string, unknown> }>();
      if (runErr || !run) throw new Error(`Run ${resumeRunId} não encontrado.`);
      if (!["awaiting_form", "awaiting_signature", "running"].includes(run.status)) {
        throw new Error(`Run ${resumeRunId} não pode ser retomado (status: ${run.status}).`);
      }
      const mergedContext = { ...run.context, ...extraContext };
      await supabase.from("automation_runs").update({ status: "running", context: mergedContext }).eq("id", run.id);
      await executeFlow(supabase, logs, run.id, run.agency_id, run.flow_id!, run.client_id, run.contract_id, run.current_step_index, mergedContext);
      return new Response(JSON.stringify({ status: "resumed", runId: run.id, logs }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── trigger ───────────────────────────────────────────────────────────────
    if (!trigger || !agencyId) throw new Error("trigger e agencyId são obrigatórios.");

    const { data: flows } = await supabase
      .from("automation_flows").select("id, name")
      .eq("agency_id", agencyId).eq("is_active", true).eq("trigger", trigger);

    if (!flows?.length) {
      return new Response(JSON.stringify({ status: "no_flows", logs }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const runIds: string[] = [];
    for (const flow of flows) {
      const { data: run } = await supabase
        .from("automation_runs")
        .insert({ agency_id: agencyId, flow_id: flow.id, client_id: clientId ?? null, contract_id: contractId ?? null, status: "running", current_step_index: 0, context: { trigger, ...extraContext } })
        .select().single<{ id: string }>();
      if (run) {
        runIds.push(run.id);
        await executeFlow(supabase, logs, run.id, agencyId, flow.id, clientId ?? null, contractId ?? null, 0, { trigger, ...extraContext });
      }
    }

    return new Response(JSON.stringify({ status: "ok", runIds, logs }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg, logs }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
    });
  }
});

// ── Flow execution ────────────────────────────────────────────────────────────

async function executeFlow(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  logs: string[],
  runId: string,
  agencyId: string,
  flowId: string,
  clientId: string | null,
  contractId: string | null,
  startIndex: number,
  context: Record<string, unknown>,
) {
  const { data: steps } = await supabase
    .from("automation_steps").select("*").eq("flow_id", flowId).eq("agency_id", agencyId).eq("enabled", true)
    .order("step_order", { ascending: true });

  if (!steps?.length) {
    await supabase.from("automation_runs").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", runId);
    return;
  }

  const { data: settings } = await supabase
    .from("agency_settings")
    .select("evolution_api_url, evolution_api_key, evolution_instance_name, autentique_token")
    .eq("agency_id", agencyId)
    .maybeSingle<{ evolution_api_url: string | null; evolution_api_key: string | null; evolution_instance_name: string | null; autentique_token: string | null }>();

  const { data: client } = clientId
    ? await supabase.from("clients").select("id, name, email, phone, address, whatsapp_group_id").eq("id", clientId)
        .maybeSingle<{ id: string; name: string; email: string | null; phone: string | null; address: string | null; whatsapp_group_id: string | null }>()
    : { data: null };

  const baseUrl = String(settings?.evolution_api_url ?? "").replace(/\/$/, "");
  const globalKey = String(settings?.evolution_api_key ?? "");
  const instanceName = String(settings?.evolution_instance_name ?? "");
  const instanceKey = baseUrl && globalKey && instanceName
    ? await getInstanceApiKey(baseUrl, globalKey, instanceName)
    : globalKey;

  const clientPhone = normalizePhone(client?.phone);
  let clientGroupJid = client?.whatsapp_group_id ?? "";
  let currentContext = { ...context };

  const variables: Record<string, string> = {
    nome_cliente: client?.name ?? "",
    email_cliente: client?.email ?? "",
    telefone_cliente: clientPhone,
    endereco_cliente: client?.address ?? "",
    ...Object.fromEntries(Object.entries(context).map(([k, v]) => [k, String(v ?? "")])),
  };

  // logStep writes to automation_step_logs
  async function logStep(stepId: string, stepType: string, status: "completed" | "skipped" | "failed", message: string, output: Record<string, unknown> = {}) {
    await supabase.from("automation_step_logs").insert({ run_id: runId, step_id: stepId, step_type: stepType, status, message, output });
  }

  for (let i = startIndex; i < steps.length; i++) {
    const step = steps[i];
    logs.push(`[automation-execute] step[${i}] type=${step.type}`);
    await supabase.from("automation_runs").update({ current_step_index: i }).eq("id", runId);

    const result = await executeStep(
      {
        supabase,
        agencyId,
        clientId,
        client,
        variables,
        baseUrl,
        instanceKey,
        instanceName,
        clientGroupJid,
        setClientGroupJid: (jid) => { clientGroupJid = jid; },
        contractId,
        context: currentContext,
        setContext: (ctx) => { currentContext = ctx; },
        logs,
        logStep,
      },
      { id: step.id, type: step.type, config: step.config ?? {} },
    );

    if (result === "pause") {
      const pauseStatus = step.type === "wait_contract_signed" ? "awaiting_signature" : "awaiting_form";
      await supabase.from("automation_runs").update({
        status: pauseStatus,
        context: { ...currentContext, awaitingStep: step.type, awaitingStepIndex: i },
      }).eq("id", runId);
      return;
    }
  }

  await supabase.from("automation_runs").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", runId);
  logs.push(`[automation-execute] Run ${runId} completo.`);
}
