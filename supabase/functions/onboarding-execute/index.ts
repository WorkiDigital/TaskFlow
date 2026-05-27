import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";
import {
  corsHeaders,
  getSupabaseAdmin,
  normalizePhone,
  renderTemplate,
  requestEvolution,
  getInstanceApiKey,
} from "../_shared/helpers.ts";
import { executeStep } from "../_shared/executeStep.ts";

// ── Types ────────────────────────────────────────────────────────────────────

type FlowStep = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  status?: string;
  order?: number;
  config?: Record<string, unknown>;
};

type WorkspaceState = {
  flowSteps?: FlowStep[];
  formTemplates?: Array<{ id: string; type: "contractual" | "briefing"; isDefault?: boolean }>;
  messages?: Array<{ id: string; body: string }>;
};

type ClientRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  whatsapp_group_id: string | null;
  agency_id: string | null;
};

type AgencySettings = {
  name: string | null;
  evolution_api_url: string | null;
  evolution_api_key: string | null;
  autentique_token: string | null;
};

type ContractTemplateRow = {
  id: string;
  name: string;
  content: string;
};

// ── Auth helpers (onboarding-specific — not shared) ──────────────────────────

function getBearerToken(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? "";
}

async function getOptionalAuthContext(req: Request, supabase: ReturnType<typeof getSupabaseAdmin>) {
  const token = getBearerToken(req);
  if (!token) return null;
  const { data: authData, error } = await supabase.auth.getUser(token);
  if (error || !authData.user) return null;
  const { data: userRow } = await supabase
    .from("users").select("agency_id").eq("id", authData.user.id).maybeSingle<{ agency_id: string | null }>();
  if (!userRow?.agency_id) return null;
  return { userId: authData.user.id, agencyId: userRow.agency_id };
}

// ── Onboarding-specific helpers ──────────────────────────────────────────────

function getPayloadValues(payload: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(payload).map(([key, item]) => {
    const value = item && typeof item === "object" && "value" in item
      ? (item as { value?: unknown }).value : item;
    return [key, String(value ?? "")];
  }));
}

function getDefaultFormId(state: WorkspaceState, type: "contractual" | "briefing") {
  const forms = state.formTemplates ?? [];
  return forms.find(f => f.type === type && f.isDefault)?.id
    ?? forms.find(f => f.type === type)?.id
    ?? (type === "contractual" ? "form_contractual_default" : "form_briefing_default");
}

function getFormType(state: WorkspaceState, formId: string): "contractual" | "briefing" {
  const form = state.formTemplates?.find(f => f.id === formId);
  if (form?.type) return form.type;
  return formId.includes("briefing") ? "briefing" : "contractual";
}

function getDefaultContractTemplate() {
  return [
    "CONTRATO DE PRESTACAO DE SERVICOS",
    "",
    "CONTRATANTE: {{nome_cliente}}",
    "E-MAIL: {{email_cliente}}",
    "CPF/CNPJ: {{cpf_cnpj_cliente}}",
    "ENDERECO: {{endereco_cliente}}",
    "",
    "PROJETO: {{nome_projeto}}",
    "VALOR: {{valor_projeto}}",
    "PRAZO: {{prazo_projeto}}",
    "",
    "A agencia {{nome_agencia}} prestara os servicos relacionados ao projeto descrito acima, conforme alinhamentos comerciais realizados entre as partes.",
    "",
    "Este documento foi gerado automaticamente pelo TaskFlow a partir dos dados preenchidos no formulario contratual.",
  ].join("\n");
}

function makeContractFile(content: string) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const lines = doc.splitTextToSize(content, 180);
  let y = 15;
  const pageHeight = doc.internal.pageSize.height;
  for (const line of lines) {
    if (y > pageHeight - 20) { doc.addPage(); y = 15; }
    doc.text(line, 15, y);
    y += 7;
  }
  return new Blob([doc.output("arraybuffer")], { type: "application/pdf" });
}

async function requestAutentique(token: string, formData: FormData) {
  const resp = await fetch("https://api.autentique.com.br/v2/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const payload = await resp.json().catch(() => ({}));
  if (!resp.ok || payload.errors) {
    const msg = Array.isArray(payload.errors)
      ? payload.errors.map((e: { message?: string }) => e.message).filter(Boolean).join(" ")
      : payload.message;
    throw new Error(msg || `Autentique HTTP ${resp.status}`);
  }
  return payload;
}

// logStep writes to onboarding_step_logs (different from automation_step_logs)
async function logStep(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  runId: string,
  step: FlowStep,
  status: "running" | "completed" | "failed" | "skipped",
  message: string,
  metadata: Record<string, unknown> = {},
) {
  const { data, error } = await supabase
    .from("onboarding_step_logs")
    .insert({ run_id: runId, step_id: step.id, step_name: step.name, status, message, metadata })
    .select().single();
  if (error) throw error;
  return data;
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = getSupabaseAdmin();
  let runId = "";
  const logs: unknown[] = [];
  let hadSkippedRequiredStep = false;
  let pausedForForm = false;

  try {
    const authContext = await getOptionalAuthContext(req, supabase);
    const body = await req.json();
    const {
      action,
      clientId,
      instanceName = "TaskFlow-Evolution-1",
      appOrigin = "",
      formId = "",
      payload = {},
    } = body as {
      action: "start" | "form_submitted";
      clientId?: string | null;
      instanceName?: string;
      appOrigin?: string;
      formId?: string;
      payload?: Record<string, unknown>;
    };

    let resolvedOrigin = appOrigin;
    if (!resolvedOrigin) {
      const headerOrigin = req.headers.get("origin") || req.headers.get("referer") || "";
      if (headerOrigin) {
        try { resolvedOrigin = new URL(headerOrigin).origin; } catch { resolvedOrigin = headerOrigin; }
      }
    }

    if (!["start", "form_submitted"].includes(action)) throw new Error("Acao invalida para onboarding-execute.");
    if (action === "start" && !authContext) {
      return new Response(JSON.stringify({ error: "Nao autenticado para iniciar onboarding." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 });
    }

    const { data: workspaceRow, error: workspaceError } = await supabase
      .from("onboarding_workspace").select("state").eq("id", "default").maybeSingle<{ state: WorkspaceState }>();
    if (workspaceError) throw workspaceError;

    const state = workspaceRow?.state ?? {};
    const steps = (state.flowSteps ?? [])
      .filter((s: FlowStep) => s.enabled)
      .sort((a: FlowStep, b: FlowStep) => (a.order ?? 0) - (b.order ?? 0));

    if (steps.length === 0) throw new Error("Nenhuma etapa ativa no onboarding.");

    // Save form submission and patch client fields
    if (action === "form_submitted") {
      if (!formId) throw new Error("Informe formId para registrar o formulario.");
      const { error: submissionError } = await supabase
        .from("form_submissions").insert({ form_id: formId, client_id: clientId || null, payload });
      if (submissionError) throw submissionError;

      if (!clientId) {
        return new Response(JSON.stringify({
          runId: null, status: "received",
          logs: [{ status: "completed", message: "Formulario recebido, mas sem cliente vinculado para continuar automacao." }],
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
      }
    }

    if (!clientId) throw new Error("Informe clientId para iniciar o onboarding.");

    const submissionValues = getPayloadValues(payload);
    const clientPatch: Record<string, string> = {};
    if (submissionValues.nome_cliente) clientPatch.name = submissionValues.nome_cliente;
    if (submissionValues.email_cliente) clientPatch.email = submissionValues.email_cliente;
    if (submissionValues.telefone_cliente) clientPatch.phone = normalizePhone(submissionValues.telefone_cliente);
    if (submissionValues.endereco_cliente) clientPatch.address = submissionValues.endereco_cliente;
    if (action === "form_submitted" && Object.keys(clientPatch).length > 0) {
      await supabase.from("clients").update(clientPatch).eq("id", clientId);
    }

    const { data: client, error: clientError } = await supabase
      .from("clients").select("id, name, email, phone, address, whatsapp_group_id, agency_id")
      .eq("id", clientId).single<ClientRow>();
    if (clientError || !client) throw new Error("Cliente nao encontrado.");

    const agencyId = client.agency_id ?? null;
    if (authContext && agencyId && authContext.agencyId !== agencyId) {
      return new Response(JSON.stringify({ error: "Cliente nao pertence a agencia do usuario autenticado." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 });
    }
    if (action === "start" && (!agencyId || authContext?.agencyId !== agencyId)) {
      return new Response(JSON.stringify({ error: "Sem permissao para iniciar onboarding deste cliente." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 });
    }

    // Pause/resume: on form_submitted look for existing awaiting_form run
    let run: { id: string; context: Record<string, unknown> } | null = null;
    let runContext: Record<string, unknown> = { instanceName, action, formId: formId || null, agencyId };

    if (action === "form_submitted") {
      const { data: existingRun } = await supabase
        .from("onboarding_runs").select("id, context")
        .eq("client_id", clientId).eq("status", "awaiting_form")
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (existingRun) {
        run = existingRun as { id: string; context: Record<string, unknown> };
        runId = existingRun.id;
        runContext = { ...(existingRun.context ?? {}), resumedAt: new Date().toISOString(), formId, action };
        await supabase.from("onboarding_runs").update({ status: "running", context: runContext }).eq("id", runId);
      }
    }

    if (!run) {
      // Concurrency lock: if a run is already active for this client, return it instead of creating a duplicate
      if (action === "start") {
        const { data: activeRun } = await supabase
          .from("onboarding_runs")
          .select("id, status, context")
          .eq("client_id", clientId)
          .in("status", ["running", "awaiting_form"])
          .limit(1)
          .maybeSingle<{ id: string; status: string; context: Record<string, unknown> }>();
        if (activeRun) {
          return new Response(JSON.stringify({ runId: activeRun.id, status: activeRun.status, logs: [] }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
          });
        }
      }

      const { data: newRun, error: runError } = await supabase
        .from("onboarding_runs")
        .insert({ client_id: client.id, agency_id: agencyId, status: "running", context: runContext })
        .select().single();
      if (runError) throw runError;
      run = newRun as { id: string; context: Record<string, unknown> };
      runId = newRun.id;
    }

    const { data: settings, error: settingsError } = await supabase
      .from("agency_settings")
      .select("name, evolution_api_url, evolution_api_key, autentique_token")
      .eq("agency_id", agencyId ?? authContext?.agencyId ?? "")
      .limit(1).single<AgencySettings>();
    if (settingsError || !settings?.evolution_api_url || !settings?.evolution_api_key) {
      throw new Error("Credenciais da Evolution API nao encontradas em agency_settings.");
    }

    const baseUrl = settings.evolution_api_url.replace(/\/$/, "");
    const globalApiKey = settings.evolution_api_key;
    const instanceApiKey = await getInstanceApiKey(baseUrl, globalApiKey, instanceName);
    const clientPhone = normalizePhone(client.phone);
    let clientGroupJid = client.whatsapp_group_id ?? "";
    let currentContext: Record<string, unknown> = { ...runContext, ...submissionValues };
    let generatedContract: { id: string; content: string; signerEmail: string; signerName: string } | null = null;

    const variables: Record<string, string> = {
      nome_cliente: client.name,
      email_cliente: client.email ?? "",
      telefone_cliente: clientPhone,
      empresa_cliente: client.address ?? "",
      nome_agencia: settings.name ?? "Agencia",
      nome_projeto: `Projeto ${client.address || client.name}`,
      link_formulario_contrato: resolvedOrigin
        ? `${resolvedOrigin.replace(/\/$/, "")}/form/${getDefaultFormId(state, "contractual")}?clientId=${client.id}`
        : "",
      link_formulario_briefing: resolvedOrigin
        ? `${resolvedOrigin.replace(/\/$/, "")}/form/${getDefaultFormId(state, "briefing")}?clientId=${client.id}`
        : "",
      ...submissionValues,
    };

    function sendText(number: string, text: string) {
      return requestEvolution(`${baseUrl}/message/sendText/${instanceName}`, instanceApiKey, {
        method: "POST",
        body: JSON.stringify({ number, text, delay: 1200, linkPreview: true }),
      });
    }

    // Determine start step for resumed runs
    let executableSteps = steps;
    if (action === "form_submitted") {
      const receivedFormType = getFormType(state, formId);
      const awaitStepId = receivedFormType === "briefing" ? "wait_briefing_form" : "wait_contract_form";
      const awaitStepIndex = steps.findIndex((s: FlowStep) => s.id === awaitStepId);
      if (awaitStepIndex >= 0) {
        const awaitStep = steps[awaitStepIndex];
        logs.push(await logStep(supabase, runId, awaitStep, "completed", "Formulario recebido. Automacao retomada.", { formId }));
        executableSteps = steps.slice(awaitStepIndex + 1);
      }
    }

    // ── Step execution loop ──────────────────────────────────────────────────
    for (const step of executableSteps) {
      logs.push(await logStep(supabase, runId, step, "running", "Executando etapa..."));

      try {

        // ── generate_contract — onboarding-exclusive (jsPDF + Autentique) ───
        if (step.id === "generate_contract") {
          const { data: template } = await supabase
            .from("contract_templates").select("id, name, content")
            .order("created_at", { ascending: false }).limit(1).maybeSingle<ContractTemplateRow>();
          const content = renderTemplate(template?.content ?? getDefaultContractTemplate(), variables);
          const signerEmail = String(variables.email_cliente || client.email || "").trim();
          const signerName = String(variables.nome_cliente || client.name).trim();
          const { data: contract, error: contractError } = await supabase
            .from("contracts")
            .insert({ client_id: client.id, agency_id: agencyId, template_id: template?.id ?? null, status: "draft", content, signer_name: signerName, signer_email: signerEmail })
            .select("id, content, signer_email, signer_name").single<{ id: string; content: string; signer_email: string | null; signer_name: string | null }>();
          if (contractError) throw contractError;
          generatedContract = { id: contract.id, content: contract.content, signerEmail: contract.signer_email ?? signerEmail, signerName: contract.signer_name ?? signerName };
          logs.push(await logStep(supabase, runId, step, "completed", "Contrato gerado e salvo no banco.", { contractId: generatedContract.id, templateId: template?.id ?? "default" }));

        // ── send_contract_signature — onboarding-exclusive (Autentique GraphQL) ─
        } else if (step.id === "send_contract_signature") {
          if (!settings.autentique_token) {
            hadSkippedRequiredStep = true;
            logs.push(await logStep(supabase, runId, step, "skipped", "Autentique ainda nao configurado."));
            continue;
          }
          if (!generatedContract) {
            const { data: latest } = await supabase
              .from("contracts").select("id, content, signer_email, signer_name")
              .eq("client_id", client.id).order("created_at", { ascending: false }).limit(1)
              .maybeSingle<{ id: string; content: string | null; signer_email: string | null; signer_name: string | null }>();
            if (latest?.id && latest.content) {
              generatedContract = { id: latest.id, content: latest.content, signerEmail: latest.signer_email ?? client.email ?? "", signerName: latest.signer_name ?? client.name };
            }
          }
          if (!generatedContract?.content) throw new Error("Nenhum contrato gerado para envio ao Autentique.");
          if (!generatedContract.signerEmail) throw new Error("Cliente sem e-mail para assinatura.");

          const operations = {
            query: `mutation CreateDocumentMutation($document: DocumentInput!, $signers: [SignerInput!]!, $file: Upload!) {
              createDocument(document: $document, signers: $signers, file: $file) {
                id name
                signatures { public_id name email link { short_link } }
              }
            }`,
            variables: {
              document: { name: `Contrato - ${variables.nome_cliente || client.name}` },
              signers: [{ email: generatedContract.signerEmail, name: generatedContract.signerName, action: "SIGN" }],
              file: null,
            },
          };
          const formData = new FormData();
          formData.append("operations", JSON.stringify(operations));
          formData.append("map", JSON.stringify({ "0": ["variables.file"] }));
          formData.append("0", makeContractFile(generatedContract.content), `contrato-${generatedContract.id}.pdf`);

          const autentiquePayload = await requestAutentique(settings.autentique_token, formData);
          const document = autentiquePayload?.data?.createDocument ?? {};
          const signatureUrl = document?.signatures?.[0]?.link?.short_link ?? null;
          await supabase.from("contracts").update({ status: "sent", autentique_document_id: document.id ?? null, signature_url: signatureUrl, updated_at: new Date().toISOString() }).eq("id", generatedContract.id);
          logs.push(await logStep(supabase, runId, step, "completed", "Contrato enviado ao Autentique.", { contractId: generatedContract.id, signatureUrl }));

        // ── send_7_day_plan — onboarding-exclusive ───────────────────────────
        } else if (step.id === "send_7_day_plan") {
          const { data: latestDeal } = await supabase
            .from("client_deals").select("id, services(default_onboarding_plan_id)")
            .eq("client_id", client.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
          const planId = (latestDeal?.services as unknown as { default_onboarding_plan_id: string })?.default_onboarding_plan_id;
          if (!planId) {
            hadSkippedRequiredStep = true;
            logs.push(await logStep(supabase, runId, step, "skipped", "Nenhum plano de 7 dias vinculado ao servico do cliente."));
            continue;
          }
          const { data: planSteps } = await supabase
            .from("service_onboarding_plan_steps").select("*").eq("plan_id", planId).order("day_number", { ascending: true });
          if (!planSteps?.length) {
            hadSkippedRequiredStep = true;
            logs.push(await logStep(supabase, runId, step, "skipped", "Plano de 7 dias vazio."));
            continue;
          }
          let planMessage = "Este é o roteiro dos seus próximos dias conosco:\n\n";
          for (const ps of planSteps) planMessage += `*Dia ${ps.day_number}:* ${ps.title}\n`;
          const renderedMsg = renderTemplate(planMessage, variables);
          const dest = clientGroupJid || (clientPhone ? clientPhone : null);
          if (!dest) throw new Error("Cliente sem grupo ou telefone configurado para receber o roteiro.");
          await sendText(dest, renderedMsg);
          logs.push(await logStep(supabase, runId, step, "completed", `Roteiro de 7 dias enviado para ${dest}.`));

        // ── All other steps — delegated to shared executeStep ────────────────
        } else {
          // Build logStep adapter for shared executor
          const sharedLogStep = async (_stepId: string, _stepType: string, status: "completed" | "skipped" | "failed", message: string, output?: Record<string, unknown>) => {
            await logStep(supabase, runId, { id: step.id, name: step.name, description: step.description, enabled: step.enabled }, status, message, output ?? {});
          };

          const result = await executeStep(
            {
              supabase,
              agencyId: agencyId ?? "",
              clientId,
              client,
              variables,
              baseUrl,
              instanceKey: instanceApiKey,
              instanceName,
              clientGroupJid,
              setClientGroupJid: (jid) => { clientGroupJid = jid; },
              contractId: generatedContract?.id ?? null,
              context: currentContext,
              setContext: (ctx) => { currentContext = ctx; },
              logs: logs as string[],
              logStep: sharedLogStep,
            },
            { id: step.id, type: step.id, config: step.config },
          );

          if (result === "pause") {
            await supabase.from("onboarding_runs")
              .update({ status: "awaiting_form", context: { ...runContext, awaitingStep: step.id } })
              .eq("id", runId);
            pausedForForm = true;
            break;
          }
        }

      } catch (stepError) {
        logs.push(await logStep(supabase, runId, step, "failed",
          stepError instanceof Error ? stepError.message : String(stepError)));
        throw stepError;
      }
    }

    if (!pausedForForm) {
      const finalStatus = hadSkippedRequiredStep ? "partial" : "completed";
      await supabase.from("onboarding_runs")
        .update({ status: finalStatus, completed_at: new Date().toISOString() }).eq("id", runId);
    }

    const { data: finalRun } = await supabase.from("onboarding_runs").select("status").eq("id", runId).single();
    return new Response(JSON.stringify({ runId, status: finalRun?.status ?? "completed", logs }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });

  } catch (error) {
    if (runId) {
      await supabase.from("onboarding_runs").update({
        status: "failed", completed_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : String(error),
      }).eq("id", runId);
    }
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error), runId: runId || null, logs }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
  }
});
