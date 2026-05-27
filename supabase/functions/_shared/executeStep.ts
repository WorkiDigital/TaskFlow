import { normalizePhone, renderTemplate, requestEvolution, extractGroupJid } from "./helpers.ts";

// Context passed from either edge function into each step handler
export type StepContext = {
  supabase: ReturnType<typeof import("https://esm.sh/@supabase/supabase-js@2").createClient>;
  agencyId: string;
  clientId: string | null;
  client: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    whatsapp_group_id: string | null;
  } | null;
  variables: Record<string, string>;
  baseUrl: string;
  instanceKey: string;
  instanceName: string;
  clientGroupJid: string;
  setClientGroupJid: (jid: string) => void;
  contractId: string | null;
  context: Record<string, unknown>;
  setContext: (ctx: Record<string, unknown>) => void;
  logs: string[];
  logStep: (stepId: string, stepType: string, status: "completed" | "skipped" | "failed", message: string, output?: Record<string, unknown>) => Promise<void>;
};

type Step = {
  id: string;
  type?: string;
  name?: string;
  config?: Record<string, unknown>;
};

// Resolved step type — supports both step.type (automation) and step.id (onboarding)
function stepType(step: Step): string {
  return step.type ?? step.id;
}

export async function executeStep(ctx: StepContext, step: Step): Promise<"pause" | "continue"> {
  const {
    supabase, agencyId, clientId, client, variables,
    baseUrl, instanceKey, instanceName, clientGroupJid,
    setClientGroupJid, contractId, context, setContext,
    logStep, logs,
  } = ctx;
  const cfg = (step.config ?? {}) as Record<string, unknown>;
  const type = stepType(step);

  const clientPhone = normalizePhone(client?.phone);

  async function sendText(dest: string, text: string) {
    return requestEvolution(`${baseUrl}/message/sendText/${instanceName}`, instanceKey, {
      method: "POST",
      body: JSON.stringify({ number: dest, text, delay: 1200, linkPreview: true }),
    });
  }

  try {
    switch (type) {

      // ── send_contract_form ─────────────────────────────────────────────────
      case "send_contract_form": {
        if (!clientPhone) {
          await logStep(step.id, type, "skipped", "Cliente sem telefone.");
          break;
        }
        const formUrl = String(cfg.formUrl ?? context.formUrl ?? "");
        if (!formUrl) {
          await logStep(step.id, type, "skipped", "URL do formulário não configurada.");
          break;
        }
        const text = renderTemplate(
          String(cfg.message ?? "Olá {{nome_cliente}}! Para iniciarmos, preencha seus dados: {{link_formulario_contrato}}"),
          { ...variables, link_formulario_contrato: formUrl },
        );
        await sendText(`${clientPhone}@s.whatsapp.net`, text);
        await logStep(step.id, type, "completed", "Formulário contratual enviado.", { formUrl });
        break;
      }

      // ── wait_contract_form — caller must handle pause ─────────────────────
      case "wait_contract_form":
        await logStep(step.id, type, "skipped", "Fluxo pausado aguardando formulário contratual.");
        return "pause";

      // ── send_contract_signature ────────────────────────────────────────────
      case "send_contract_signature": {
        if (!contractId) {
          await logStep(step.id, type, "skipped", "Nenhum contractId disponível.");
          break;
        }
        const { data: contract } = await supabase
          .from("contracts")
          .select("signature_url")
          .eq("id", contractId)
          .maybeSingle<{ signature_url: string | null }>();
        if (!contract?.signature_url) {
          await logStep(step.id, type, "skipped", "Contrato sem link de assinatura.");
          break;
        }
        const dest = clientGroupJid || `${clientPhone}@s.whatsapp.net`;
        const text = renderTemplate(
          String(cfg.message ?? "Olá {{nome_cliente}}! Seu contrato está pronto: {{link_assinatura}}"),
          { ...variables, link_assinatura: contract.signature_url },
        );
        await sendText(dest, text);
        await logStep(step.id, type, "completed", "Link de assinatura enviado.", { signatureUrl: contract.signature_url });
        break;
      }

      // ── confirm_contract_sent_client_group ─────────────────────────────────
      case "confirm_contract_sent_client_group": {
        if (!clientGroupJid) {
          await logStep(step.id, type, "skipped", "Grupo sem JID.");
          break;
        }
        const { data: contract } = contractId
          ? await supabase.from("contracts").select("signature_url").eq("id", contractId).maybeSingle<{ signature_url: string | null }>()
          : { data: null };
        if (!contract?.signature_url) {
          await logStep(step.id, type, "skipped", "Sem link de assinatura disponível.");
          break;
        }
        const text = renderTemplate(
          String(cfg.message ?? "📝 {{nome_cliente}}, seu contrato foi enviado: {{link_assinatura}}"),
          { ...variables, link_assinatura: contract.signature_url },
        );
        await sendText(clientGroupJid, text);
        await logStep(step.id, type, "completed", "Confirmação enviada ao grupo.", { clientGroupJid });
        break;
      }

      // ── wait_contract_signed ───────────────────────────────────────────────
      case "wait_contract_signed": {
        const { data: contract } = contractId
          ? await supabase.from("contracts").select("status").eq("id", contractId).maybeSingle<{ status: string }>()
          : { data: null };
        if (contract?.status === "signed") {
          await logStep(step.id, type, "completed", "Contrato já assinado — continuando.");
          break;
        }
        await logStep(step.id, type, "skipped", "Aguardando assinatura do contrato.");
        return "pause";
      }

      // ── create_client_whatsapp_group ───────────────────────────────────────
      case "create_client_whatsapp_group": {
        if (!baseUrl || !instanceKey) {
          await logStep(step.id, type, "skipped", "Evolution API não configurada.");
          break;
        }
        const groupName = renderTemplate(String(cfg.groupName ?? "{{nome_cliente}} — Projeto"), variables);
        const participants = [clientPhone ? `${clientPhone}@s.whatsapp.net` : ""].filter(Boolean);
        const groupPayload = await requestEvolution(`${baseUrl}/group/create/${instanceName}`, instanceKey, {
          method: "POST",
          body: JSON.stringify({ subject: groupName, participants }),
        });
        const jid = extractGroupJid(groupPayload as Record<string, unknown>);
        setClientGroupJid(jid);
        if (jid && clientId) {
          await supabase.from("clients").update({ whatsapp_group_id: jid }).eq("id", clientId);
        }
        await logStep(step.id, type, "completed", `Grupo criado: ${jid}`, { groupJid: jid });
        break;
      }

      // ── select_internal_agency_group ───────────────────────────────────────
      case "select_internal_agency_group": {
        const jid = String(cfg.groupJid ?? "");
        if (!jid) {
          await logStep(step.id, type, "skipped", "JID do grupo interno não configurado.");
          break;
        }
        setContext({ ...context, internalGroupJid: jid });
        await logStep(step.id, type, "completed", `Grupo interno: ${jid}`, { jid });
        break;
      }

      // ── add_group_participants ─────────────────────────────────────────────
      case "add_group_participants": {
        if (!clientGroupJid) {
          await logStep(step.id, type, "skipped", "Grupo sem JID.");
          break;
        }
        const raw = Array.isArray(cfg.participants) ? (cfg.participants as string[]) : [];
        const extra = raw.map(normalizePhone).filter(p => p && p !== clientPhone).map(p => `${p}@s.whatsapp.net`);
        if (!extra.length) {
          await logStep(step.id, type, "completed", "Nenhum participante extra configurado.");
          break;
        }
        await requestEvolution(`${baseUrl}/group/updateParticipant/${instanceName}`, instanceKey, {
          method: "PUT",
          body: JSON.stringify({ groupJid: clientGroupJid, action: "add", participants: extra }),
        });
        await logStep(step.id, type, "completed", `${extra.length} participante(s) adicionado(s).`, { extra });
        break;
      }

      // ── update_group_description ───────────────────────────────────────────
      case "update_group_description": {
        if (!clientGroupJid) {
          await logStep(step.id, type, "skipped", "Grupo sem JID.");
          break;
        }
        const description = renderTemplate(
          String(cfg.description ?? "Grupo oficial do projeto {{nome_projeto}} — {{nome_cliente}}."),
          variables,
        );
        await requestEvolution(`${baseUrl}/group/updateGroupDescription/${instanceName}`, instanceKey, {
          method: "PUT",
          body: JSON.stringify({ groupJid: clientGroupJid, description }),
        });
        await logStep(step.id, type, "completed", "Descrição do grupo atualizada.", { clientGroupJid });
        break;
      }

      // ── send_client_group_welcome ──────────────────────────────────────────
      case "send_client_group_welcome": {
        if (!clientGroupJid) {
          await logStep(step.id, type, "skipped", "Grupo sem JID.");
          break;
        }
        const text = renderTemplate(
          String(cfg.message ?? "👋 Bem-vindo(a) ao grupo do projeto, {{nome_cliente}}!"),
          variables,
        );
        await sendText(clientGroupJid, text);
        await logStep(step.id, type, "completed", "Boas-vindas enviadas.", { clientGroupJid });
        break;
      }

      // ── mention_group_participants ─────────────────────────────────────────
      case "mention_group_participants": {
        if (!clientGroupJid) {
          await logStep(step.id, type, "skipped", "Grupo sem JID.");
          break;
        }
        await sendText(clientGroupJid, renderTemplate(String(cfg.message ?? "Olá a todos! 👋"), variables));
        await logStep(step.id, type, "completed", "Menção enviada.", { clientGroupJid });
        break;
      }

      // ── send_internal_agency_notification ─────────────────────────────────
      case "send_internal_agency_notification": {
        const dest = String(context.internalGroupJid ?? cfg.groupJid ?? cfg.internalGroupId ?? "");
        if (!dest) {
          await logStep(step.id, type, "skipped", "Grupo interno sem JID.");
          break;
        }
        const text = renderTemplate(
          String(cfg.message ?? "🔔 Novo cliente onboardado: {{nome_cliente}}. Projeto: {{nome_projeto}}."),
          variables,
        );
        await sendText(dest, text);
        await logStep(step.id, type, "completed", "Notificação interna enviada.", { dest });
        break;
      }

      // ── send_briefing_form ─────────────────────────────────────────────────
      case "send_briefing_form": {
        const formUrl = String(cfg.formUrl ?? context.briefingFormUrl ?? variables.link_formulario_briefing ?? "");
        if (!formUrl) {
          await logStep(step.id, type, "skipped", "URL do briefing não configurada.");
          break;
        }
        const dest = clientGroupJid || (clientPhone ? `${clientPhone}@s.whatsapp.net` : "");
        if (!dest) {
          await logStep(step.id, type, "skipped", "Cliente sem telefone/grupo.");
          break;
        }
        const text = renderTemplate(
          String(cfg.message ?? "📋 {{nome_cliente}}, precisamos do seu briefing: {{link_formulario_briefing}}"),
          { ...variables, link_formulario_briefing: formUrl },
        );
        await sendText(dest, text);
        await logStep(step.id, type, "completed", "Briefing enviado.", { dest, formUrl });
        break;
      }

      // ── wait_briefing_form — caller must handle pause ──────────────────────
      case "wait_briefing_form":
        await logStep(step.id, type, "skipped", "Fluxo pausado aguardando briefing.");
        return "pause";

      // ── notify_briefing_received ───────────────────────────────────────────
      case "notify_briefing_received": {
        const dest = String(context.internalGroupJid ?? cfg.groupJid ?? "");
        if (!dest) {
          await logStep(step.id, type, "skipped", "Grupo interno sem JID.");
          break;
        }
        const text = renderTemplate(
          String(cfg.message ?? "✅ Briefing recebido de {{nome_cliente}}!"),
          variables,
        );
        await sendText(dest, text);
        await logStep(step.id, type, "completed", "Notificação de briefing enviada.", { dest });
        break;
      }

      // ── apply_agency_template ──────────────────────────────────────────────
      case "apply_agency_template": {
        const templateId = String(cfg.templateId ?? "");
        if (!templateId) {
          await logStep(step.id, type, "skipped", "templateId não configurado.");
          break;
        }
        const { data: tmpl } = await supabase
          .from("agency_templates")
          .select("*, template_columns(*), template_tasks(*, template_task_checklists(*))")
          .eq("id", templateId)
          .maybeSingle<{
            id: string; name: string; description: string | null;
            template_columns: Array<{ id: string; title: string; position: number; color: string | null; is_final_column?: boolean }>;
            template_tasks: Array<{
              id: string; title: string; description: string | null; priority: string;
              column_id?: string; template_column_id?: string;
              assignee_rule?: { type?: string; value?: string } | null;
              template_task_checklists?: Array<{ title: string }>;
            }>;
          }>();
        if (!tmpl) {
          await logStep(step.id, type, "failed", `Template ${templateId} não encontrado.`);
          break;
        }
        const projectName = renderTemplate(String(cfg.projectNamePattern ?? tmpl.name), variables);
        const { data: project } = await supabase
          .from("projects")
          .insert({ agency_id: agencyId, client_id: clientId ?? null, name: projectName, description: tmpl.description, status: "planning", source: "automation", template_id: tmpl.id })
          .select().single<{ id: string }>();
        if (!project) break;

        const colMap: Record<string, string> = {};
        for (const col of tmpl.template_columns ?? []) {
          const { data: c } = await supabase.from("project_columns")
            .insert({ agency_id: agencyId, project_id: project.id, title: col.title, position: col.position, color: col.color })
            .select().single<{ id: string }>();
          if (c) colMap[col.id] = c.id;
        }
        for (const task of tmpl.template_tasks ?? []) {
          let assigneeId: string | null = null;
          const rule = task.assignee_rule;
          if (rule?.type === "specific_user" && rule.value) assigneeId = rule.value;
          else if (rule?.type === "role" && rule.value) {
            const { data: rd } = await supabase.from("agency_roles").select("id").eq("agency_id", agencyId).eq("name", rule.value).maybeSingle<{ id: string }>();
            if (rd) {
              const { data: ud } = await supabase.from("users").select("id").eq("agency_id", agencyId).eq("agency_role_id", rd.id).limit(1).maybeSingle<{ id: string }>();
              if (ud) assigneeId = ud.id;
            }
          }
          const { data: newTask } = await supabase.from("project_tasks")
            .insert({ agency_id: agencyId, project_id: project.id, column_id: colMap[task.template_column_id ?? task.column_id ?? ""] ?? null, title: renderTemplate(task.title, variables), description: task.description, priority: task.priority, assignee_id: assigneeId, source: "template" })
            .select().single<{ id: string }>();
          if (newTask) {
            for (const chk of task.template_task_checklists ?? []) {
              await supabase.from("project_task_checklists").insert({ agency_id: agencyId, task_id: newTask.id, title: chk.title, is_done: false });
            }
          }
        }
        setContext({ ...context, projectId: project.id });
        await logStep(step.id, type, "completed", `Projeto "${projectName}" criado.`, { projectId: project.id });
        break;
      }

      // ── finish_onboarding / finalize_onboarding ────────────────────────────
      case "finish_onboarding": {
        if (clientGroupJid) {
          const text = renderTemplate(
            String(cfg.message ?? "🎉 {{nome_cliente}}, seu onboarding está completo! Bem-vindo(a) ao projeto {{nome_projeto}}."),
            variables,
          );
          await sendText(clientGroupJid, text).catch(() => null);
        }
        await logStep(step.id, type, "completed", "Onboarding finalizado com sucesso.");
        break;
      }

      // ── create_recurring_task ──────────────────────────────────────────────
      case "create_recurring_task": {
        const title = String(cfg.title ?? "Tarefa recorrente");
        const projectId = String(context.projectId ?? cfg.projectId ?? "");
        if (!projectId) {
          await logStep(step.id, type, "skipped", "projectId não disponível.");
          break;
        }
        const dueDays = Number(cfg.dueDays ?? 7);
        const dueDate = new Date(Date.now() + dueDays * 86400000).toISOString().slice(0, 10);
        const { data: t } = await supabase.from("project_tasks")
          .insert({ agency_id: agencyId, project_id: projectId, title: renderTemplate(title, variables), priority: String(cfg.priority ?? "medium"), due_date: dueDate, source: "automation" })
          .select().single<{ id: string }>();
        await logStep(step.id, type, "completed", `Tarefa "${title}" criada (prazo: ${dueDate}).`, { taskId: t?.id });
        break;
      }

      default:
        logs.push(`[executeStep] Step type "${type}" não implementado neste shared executor.`);
        return "continue";
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logs.push(`[executeStep] Step "${type}" ERRO: ${msg}`);
    await logStep(step.id, type, "failed", msg).catch(() => null);
  }

  return "continue";
}
