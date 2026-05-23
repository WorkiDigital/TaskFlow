import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
};

type AgencySettings = {
  name: string | null;
  evolution_api_url: string | null;
  evolution_api_key: string | null;
  autentique_token: string | null;
};

function getSupabaseAdmin() {
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    supabaseKey,
    { global: { headers: { Authorization: `Bearer ${supabaseKey}` } } },
  );
}

function normalizePhone(value?: string | null) {
  return String(value ?? "").replace(/\D/g, "");
}

function uniqueValues(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function renderTemplate(template: string, variables: Record<string, string>) {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, key) => variables[String(key).trim()] ?? "");
}

async function requestEvolution(url: string, apiKey: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      apikey: apiKey,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const responseText = await response.text();
  const payload = responseText ? JSON.parse(responseText) : {};

  if (!response.ok) {
    const message = payload?.response?.message ?? payload?.message ?? payload?.error;
    const detail = Array.isArray(message) ? message.join(" ") : message;
    throw new Error(detail ?? `Evolution API retornou HTTP ${response.status}: ${responseText || response.statusText}`);
  }

  return payload;
}

async function getInstanceApiKey(baseUrl: string, globalApiKey: string, instanceName: string) {
  const payload = await requestEvolution(
    `${baseUrl}/instance/fetchInstances?instanceName=${encodeURIComponent(instanceName)}`,
    globalApiKey,
  );

  if (!Array.isArray(payload) && typeof payload === "object") {
    return String(payload?.token ?? payload?.apikey ?? payload?.instance?.apikey ?? payload?.instance?.token ?? globalApiKey);
  }

  const instances = Array.isArray(payload) ? payload : Array.isArray(payload?.value) ? payload.value : [];
  const match = instances.find((item: Record<string, unknown>) => {
    const instance = item.instance as Record<string, unknown> | undefined;
    return instance?.instanceName === instanceName || item.name === instanceName;
  });
  const instance = match?.instance as Record<string, unknown> | undefined;

  return String(instance?.apikey ?? instance?.token ?? match?.token ?? match?.apikey ?? globalApiKey);
}

function extractGroupJid(payload: Record<string, unknown>) {
  const candidates = [
    payload.jid,
    payload.id,
    payload.groupJid,
    payload.remoteJid,
    (payload.group as Record<string, unknown> | undefined)?.jid,
    (payload.group as Record<string, unknown> | undefined)?.id,
  ];

  return candidates.map(value => String(value ?? "")).find(value => value.endsWith("@g.us")) ?? "";
}

function getMessage(state: WorkspaceState, id: string, fallback: string) {
  return state.messages?.find(message => message.id === id)?.body ?? fallback;
}

function getPayloadValues(payload: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(payload).map(([key, item]) => {
    const value = item && typeof item === "object" && "value" in item
      ? (item as { value?: unknown }).value
      : item;
    return [key, String(value ?? "")];
  }));
}

function getDefaultFormId(state: WorkspaceState, type: "contractual" | "briefing") {
  const forms = state.formTemplates ?? [];
  return forms.find(form => form.type === type && form.isDefault)?.id
    ?? forms.find(form => form.type === type)?.id
    ?? (type === "contractual" ? "form_contractual_default" : "form_briefing_default");
}

function getFormType(state: WorkspaceState, formId: string): "contractual" | "briefing" {
  const form = state.formTemplates?.find(item => item.id === formId);
  if (form?.type) return form.type;
  return formId.includes("briefing") ? "briefing" : "contractual";
}

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
    .insert({
      run_id: runId,
      step_id: step.id,
      step_name: step.name,
      status,
      message,
      metadata,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = getSupabaseAdmin();
  let runId = "";
  const logs: unknown[] = [];
  let hadSkippedRequiredStep = false;

  try {
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

    if (!["start", "form_submitted"].includes(action)) throw new Error("Acao invalida para onboarding-execute.");

    const { data: workspaceRow, error: workspaceError } = await supabase
      .from("onboarding_workspace")
      .select("state")
      .eq("id", "default")
      .maybeSingle<{ state: WorkspaceState }>();
    if (workspaceError) throw workspaceError;

    const state = workspaceRow?.state ?? {};
    const steps = (state.flowSteps ?? [])
      .filter(step => step.enabled)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    if (steps.length === 0) throw new Error("Nenhuma etapa ativa no onboarding.");

    if (action === "form_submitted") {
      if (!formId) throw new Error("Informe formId para registrar o formulario.");

      const { error: submissionError } = await supabase
        .from("form_submissions")
        .insert({
          form_id: formId,
          client_id: clientId || null,
          payload,
        });
      if (submissionError) throw submissionError;

      if (!clientId) {
        return new Response(JSON.stringify({
          runId: null,
          status: "received",
          logs: [{ status: "completed", message: "Formulario recebido, mas sem cliente vinculado para continuar automacao." }],
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
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
      .from("clients")
      .select("id, name, email, phone, address, whatsapp_group_id")
      .eq("id", clientId)
      .single<ClientRow>();
    if (clientError || !client) throw new Error("Cliente nao encontrado.");

    const { data: run, error: runError } = await supabase
      .from("onboarding_runs")
      .insert({
        client_id: client.id,
        status: "running",
        context: { instanceName, action, formId: formId || null },
      })
      .select()
      .single();
    if (runError) throw runError;
    runId = run.id;

    const { data: settings, error: settingsError } = await supabase
      .from("agency_settings")
      .select("name, evolution_api_url, evolution_api_key, autentique_token")
      .limit(1)
      .single<AgencySettings>();
    if (settingsError || !settings?.evolution_api_url || !settings?.evolution_api_key) {
      throw new Error("Credenciais da Evolution API nao encontradas em agency_settings.");
    }

    const baseUrl = settings.evolution_api_url.replace(/\/$/, "");
    const globalApiKey = settings.evolution_api_key;
    const instanceApiKey = await getInstanceApiKey(baseUrl, globalApiKey, instanceName);
    const clientPhone = normalizePhone(client.phone);
    let clientGroupJid = client.whatsapp_group_id ?? "";

    const variables = {
      nome_cliente: client.name,
      email_cliente: client.email ?? "",
      telefone_cliente: clientPhone,
      empresa_cliente: client.address ?? "",
      nome_agencia: settings.name ?? "Agencia",
      nome_projeto: `Projeto ${client.address || client.name}`,
      link_formulario_contrato: appOrigin ? `${String(appOrigin).replace(/\/$/, "")}/form/${getDefaultFormId(state, "contractual")}?clientId=${client.id}` : "",
      link_formulario_briefing: appOrigin ? `${String(appOrigin).replace(/\/$/, "")}/form/${getDefaultFormId(state, "briefing")}?clientId=${client.id}` : "",
      link_google_drive: "",
      ...submissionValues,
    };

    async function sendText(number: string, text: string, linkPreview = true) {
      return requestEvolution(`${baseUrl}/message/sendText/${instanceName}`, instanceApiKey, {
        method: "POST",
        body: JSON.stringify({
          number,
          text,
          delay: 1200,
          linkPreview,
        }),
      });
    }

    let executableSteps = steps;
    if (action === "form_submitted") {
      const receivedFormType = getFormType(state, formId);
      const awaitStepId = receivedFormType === "briefing" ? "await_briefing_form" : "await_contractual_form";
      const awaitStepIndex = steps.findIndex(step => step.id === awaitStepId);

      if (awaitStepIndex >= 0) {
        const awaitStep = steps[awaitStepIndex];
        logs.push(await logStep(supabase, runId, awaitStep, "completed", "Formulario recebido. Automacao retomada.", { formId }));
        executableSteps = steps.slice(awaitStepIndex + 1);
      }
    }

    for (const step of executableSteps) {
      logs.push(await logStep(supabase, runId, step, "running", "Executando etapa..."));

      try {
        if (step.id === "send_contractual_form") {
          if (!clientPhone) throw new Error("Cliente sem telefone para envio do formulario contratual.");
          const template = getMessage(state, "msg_send_contractual", "Ola, {{nome_cliente}}! Vamos iniciar seu onboarding: {{link_formulario_contrato}}");
          const text = renderTemplate(
            template.replace("[Clique aqui para preencher]", "{{link_formulario_contrato}}"),
            variables,
          );
          await sendText(clientPhone, text);
          logs.push(await logStep(supabase, runId, step, "completed", "Formulario contratual enviado por WhatsApp."));
        } else if (step.id === "await_contractual_form") {
          hadSkippedRequiredStep = true;
          logs.push(await logStep(supabase, runId, step, "skipped", "Aguardando webhook/formulario real. Etapa registrada como pendente."));
        } else if (step.id === "generate_contract") {
          hadSkippedRequiredStep = true;
          logs.push(await logStep(supabase, runId, step, "skipped", "Geracao real de contrato ainda depende de template/documento configurado."));
        } else if (step.id === "send_contract_signature") {
          hadSkippedRequiredStep = true;
          logs.push(await logStep(supabase, runId, step, "skipped", settings.autentique_token
            ? "Token Autentique existe, mas falta documento/template para envio real."
            : "Autentique ainda nao configurado para envio real."));
        } else if (step.id === "create_whatsapp_group") {
          const config = step.config ?? {};
          const participants = uniqueValues([
            ...(Array.isArray(config.participants) ? config.participants.map(String) : []),
            clientPhone,
          ].map(normalizePhone));
          const subject = renderTemplate(String(config.groupName ?? "Projeto {{nome_projeto}}"), variables);
          const description = renderTemplate(String(config.description ?? "Grupo oficial de acompanhamento do projeto."), variables);

          if (participants.length < 1) throw new Error("Nenhum participante valido para criar o grupo.");

          const payload = await requestEvolution(`${baseUrl}/group/create/${instanceName}`, instanceApiKey, {
            method: "POST",
            body: JSON.stringify({ subject, description, participants }),
          });

          clientGroupJid = extractGroupJid(payload as Record<string, unknown>);
          if (clientGroupJid) {
            await supabase.from("clients").update({ whatsapp_group_id: clientGroupJid }).eq("id", client.id);
          }

          logs.push(await logStep(supabase, runId, step, "completed", "Grupo do cliente criado na Evolution API.", { groupJid: clientGroupJid, subject }));
        } else if (step.id === "add_participants") {
          if (!clientGroupJid) {
            logs.push(await logStep(supabase, runId, step, "skipped", "Grupo do cliente ainda sem JID retornado para adicionar participantes."));
            hadSkippedRequiredStep = true;
            continue;
          }
          logs.push(await logStep(supabase, runId, step, "completed", "Participantes incluidos na criacao do grupo."));
        } else if (step.id === "update_group_description") {
          if (!clientGroupJid) {
            logs.push(await logStep(supabase, runId, step, "skipped", "Grupo do cliente ainda sem JID para atualizar descricao."));
            hadSkippedRequiredStep = true;
            continue;
          }
          logs.push(await logStep(supabase, runId, step, "skipped", "Descricao ja enviada na criacao do grupo. Atualizacao separada ainda nao foi necessaria."));
        } else if (step.id === "send_welcome_message") {
          if (!clientGroupJid) {
            logs.push(await logStep(supabase, runId, step, "skipped", "Grupo do cliente ainda sem JID para mensagem de boas-vindas."));
            hadSkippedRequiredStep = true;
            continue;
          }
          const text = renderTemplate(getMessage(state, "msg_welcome", "Bem-vindo ao projeto {{nome_projeto}}, {{nome_cliente}}!"), variables);
          await sendText(clientGroupJid, text);
          logs.push(await logStep(supabase, runId, step, "completed", "Mensagem de boas-vindas enviada no grupo do cliente."));
        } else if (step.id === "notify_internal_group") {
          const internalGroupId = String(step.config?.internalGroupId ?? "");
          if (!internalGroupId) {
            logs.push(await logStep(supabase, runId, step, "skipped", "Grupo interno nao selecionado."));
            hadSkippedRequiredStep = true;
            continue;
          }
          const text = renderTemplate(getMessage(state, "msg_internal_notify", "Novo cliente onboardado: {{nome_cliente}}"), variables);
          await sendText(internalGroupId, text);
          logs.push(await logStep(supabase, runId, step, "completed", "Grupo interno notificado."));
        } else if (step.id === "send_briefing_form") {
          if (!clientPhone) throw new Error("Cliente sem telefone para envio do briefing.");
          const template = getMessage(state, "msg_send_briefing", "Preencha o briefing do projeto, {{nome_cliente}}: {{link_formulario_briefing}}");
          const text = renderTemplate(
            template.replace("[Clique aqui para preencher]", "{{link_formulario_briefing}}"),
            variables,
          );
          await sendText(clientPhone, text);
          logs.push(await logStep(supabase, runId, step, "completed", "Formulario de briefing enviado por WhatsApp."));
        } else if (step.id === "await_briefing_form") {
          hadSkippedRequiredStep = true;
          logs.push(await logStep(supabase, runId, step, "skipped", "Aguardando webhook/formulario de briefing real."));
        } else if (step.id === "finalize_onboarding") {
          logs.push(await logStep(supabase, runId, step, "completed", "Execucao de onboarding finalizada."));
        } else {
          hadSkippedRequiredStep = true;
          logs.push(await logStep(supabase, runId, step, "skipped", "Etapa ainda sem executor real."));
        }
      } catch (stepError) {
        logs.push(await logStep(supabase, runId, step, "failed", stepError instanceof Error ? stepError.message : String(stepError)));
        throw stepError;
      }
    }

    const finalStatus = hadSkippedRequiredStep ? "partial" : "completed";
    await supabase
      .from("onboarding_runs")
      .update({ status: finalStatus, completed_at: new Date().toISOString() })
      .eq("id", runId);

    return new Response(JSON.stringify({ runId, status: finalStatus, logs }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    if (runId) {
      await supabase
        .from("onboarding_runs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : String(error),
        })
        .eq("id", runId);
    }

    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error), runId: runId || null, logs }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
