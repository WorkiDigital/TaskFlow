import { supabase } from "@/services/supabase";
import type { Contract, ContractStatus } from "@/lib/types";
import { getCurrentUserAgency } from "@/lib/auth";
import {
  extractTemplateVariables,
  renderContractTemplate,
  validateTemplateVariables,
  resolveContractVariables,
  type ContractTemplateVariable,
} from "@/lib/contractVariables";

export interface ServiceResult<T> {
  data?: T;
  error?: string;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContractTemplate {
  id: string;
  agency_id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  service_type?: string | null;
  content: string;
  variables: string[];
  required_variables: string[];
  status: "draft" | "published" | "archived";
  created_at?: string;
  updated_at?: string;
}

export interface CreateContractTemplateInput {
  name: string;
  content: string;
  description?: string;
  category?: string;
  service_type?: string;
}

export interface UpdateContractTemplateInput {
  name?: string;
  content?: string;
  description?: string;
  category?: string;
  service_type?: string;
  status?: "draft" | "published" | "archived";
}

export interface AgencyService {
  id: string;
  agency_id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  pricing_type: string;
  default_price?: number | null;
  default_duration_months?: number | null;
  default_contract_template_id?: string | null;
  default_project_template_id?: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
  service_deliverables?: ServiceDeliverable[];
}

export interface ServiceDeliverable {
  id: string;
  agency_id: string;
  service_id: string;
  title: string;
  description?: string | null;
  position: number;
}

export interface ClientDeal {
  id: string;
  agency_id: string;
  client_id: string;
  service_id?: string | null;
  contract_template_id?: string | null;
  value?: number | null;
  payment_terms?: string | null;
  duration_months?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  status: string;
  custom_deliverables: unknown[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateContractDraftInput {
  title: string;
  client_id?: string;
  client_name?: string;
  value?: number;
  content?: string;
  template_id?: string;
  signer_name?: string;
  signer_email?: string;
}

export interface UpdateContractInput {
  title?: string;
  client_id?: string;
  client_name?: string;
  value?: number;
  content?: string;
  status?: ContractStatus;
  signer_name?: string;
  signer_email?: string;
}

export interface AutentiqueResult {
  documentId: string | null;
  signatureUrl: string | null;
}

export interface GenerateContractInput {
  clientId: string;
  dealId?: string;
  templateId: string;
  formPayload?: Record<string, unknown>;
  manualValues?: Record<string, unknown>;
}

// ─── Autentique ───────────────────────────────────────────────────────────────

export async function sendContractToAutentique(
  contractId: string,
  fileUrl?: string,
): Promise<ServiceResult<AutentiqueResult>> {
  const { data, error } = await supabase.functions.invoke("contract-send-autentique", {
    body: { contractId, fileUrl: fileUrl || null },
  });
  if (error) {
    const ctx = (error as { context?: unknown }).context;
    if (ctx instanceof Response) {
      const payload = (await ctx.json().catch(() => null)) as { error?: string } | null;
      return { error: payload?.error ?? error.message };
    }
    return { error: error.message };
  }
  const result = data as { error?: string; documentId?: string; signatureUrl?: string };
  if (result?.error) return { error: result.error };
  return {
    data: { documentId: result.documentId ?? null, signatureUrl: result.signatureUrl ?? null },
  };
}

// ─── Contratos ────────────────────────────────────────────────────────────────

export async function listContracts(): Promise<ServiceResult<Contract[]>> {
  try {
    const { agencyId } = await getCurrentUserAgency();
    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false });
    if (error) return { error: error.message };
    return { data: data as Contract[] };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function getContract(id: string): Promise<ServiceResult<Contract>> {
  try {
    const { agencyId } = await getCurrentUserAgency();
    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", id)
      .eq("agency_id", agencyId)
      .maybeSingle();
    if (error) return { error: error.message };
    if (!data) return { error: "Contrato não encontrado" };
    return { data: data as Contract };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function createDraft(
  input: CreateContractDraftInput,
): Promise<ServiceResult<Contract>> {
  try {
    const { agencyId } = await getCurrentUserAgency();
    const { data, error } = await supabase
      .from("contracts")
      .insert({ ...input, agency_id: agencyId, status: "draft" as ContractStatus })
      .select("*")
      .single();
    if (error) return { error: error.message };
    return { data: data as Contract };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function updateContract(
  id: string,
  input: UpdateContractInput,
): Promise<ServiceResult<Contract>> {
  try {
    const { agencyId } = await getCurrentUserAgency();
    const { data, error } = await supabase
      .from("contracts")
      .update(input)
      .eq("id", id)
      .eq("agency_id", agencyId)
      .select("*")
      .single();
    if (error) return { error: error.message };
    return { data: data as Contract };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function deleteContract(id: string): Promise<ServiceResult<null>> {
  try {
    const { agencyId } = await getCurrentUserAgency();
    const { error } = await supabase
      .from("contracts")
      .delete()
      .eq("id", id)
      .eq("agency_id", agencyId);
    if (error) return { error: error.message };
    return { data: null };
  } catch (e) {
    return { error: String(e) };
  }
}

// ─── Geração de Contrato ──────────────────────────────────────────────────────

export async function generateContractFromTemplate(
  input: GenerateContractInput,
): Promise<ServiceResult<Contract>> {
  try {
    const { agencyId } = await getCurrentUserAgency();

    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .select("*")
      .eq("id", input.clientId)
      .single();
    if (clientErr) return { error: clientErr.message };

    let deal: Record<string, unknown> | undefined;
    let service: Record<string, unknown> | undefined;

    if (input.dealId) {
      const { data: dealData } = await supabase
        .from("client_deals")
        .select("*")
        .eq("id", input.dealId)
        .maybeSingle();
      if (dealData) deal = dealData as Record<string, unknown>;
    }

    if (deal?.service_id) {
      const { data: svcData } = await supabase
        .from("services")
        .select("*")
        .eq("id", deal.service_id)
        .maybeSingle();
      if (svcData) service = svcData as Record<string, unknown>;
    }

    const { data: template, error: tmplErr } = await supabase
      .from("contract_templates")
      .select("*")
      .eq("id", input.templateId)
      .eq("agency_id", agencyId)
      .single();
    if (tmplErr) return { error: tmplErr.message };

    const { data: mappingsData } = await supabase
      .from("contract_template_variables")
      .select("*")
      .eq("template_id", input.templateId)
      .eq("agency_id", agencyId);

    const mappings = (mappingsData ?? []) as ContractTemplateVariable[];

    const resolved = resolveContractVariables({
      client: client as Record<string, unknown>,
      deal,
      service,
      formPayload: input.formPayload ?? {},
      fixedValues: input.manualValues ?? {},
      mappings,
    });

    const requiredVars: string[] =
      (template.required_variables as string[]) ??
      mappings.filter((m) => m.required).map((m) => m.variable_key);

    const { valid, missing } = validateTemplateVariables({
      requiredVariables: requiredVars,
      resolvedValues: resolved,
    });

    if (!valid) {
      return { error: `Variáveis obrigatórias não preenchidas: ${missing.join(", ")}` };
    }

    const content = renderContractTemplate(template.content, resolved);
    const signerEmail = String(resolved.email_cliente || client.email || "").trim();
    const signerName = String(resolved.nome_cliente || client.name).trim();

    const { data: contract, error: contractErr } = await supabase
      .from("contracts")
      .insert({
        agency_id: agencyId,
        client_id: input.clientId,
        template_id: input.templateId,
        title: `Contrato — ${signerName}`,
        content,
        status: "draft",
        signer_name: signerName,
        signer_email: signerEmail,
      })
      .select("*")
      .single();

    if (contractErr) return { error: contractErr.message };
    return { data: contract as Contract };
  } catch (e) {
    return { error: String(e) };
  }
}

// ─── Templates de Contrato ────────────────────────────────────────────────────

export async function listContractTemplates(): Promise<ServiceResult<ContractTemplate[]>> {
  try {
    const { agencyId } = await getCurrentUserAgency();
    const { data, error } = await supabase
      .from("contract_templates")
      .select("*")
      .eq("agency_id", agencyId)
      .neq("status", "archived")
      .order("created_at", { ascending: false });
    if (error) return { error: error.message };
    return { data: data as ContractTemplate[] };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function getContractTemplate(id: string): Promise<ServiceResult<ContractTemplate>> {
  try {
    const { agencyId } = await getCurrentUserAgency();
    const { data, error } = await supabase
      .from("contract_templates")
      .select("*")
      .eq("id", id)
      .eq("agency_id", agencyId)
      .maybeSingle();
    if (error) return { error: error.message };
    if (!data) return { error: "Template não encontrado" };
    return { data: data as ContractTemplate };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function createContractTemplate(
  input: CreateContractTemplateInput,
): Promise<ServiceResult<ContractTemplate>> {
  try {
    const { agencyId } = await getCurrentUserAgency();
    const variables = extractTemplateVariables(input.content);
    const { data, error } = await supabase
      .from("contract_templates")
      .insert({
        ...input,
        agency_id: agencyId,
        variables,
        required_variables: variables,
        status: "draft",
      })
      .select("*")
      .single();
    if (error) return { error: error.message };
    return { data: data as ContractTemplate };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function updateContractTemplate(
  id: string,
  input: UpdateContractTemplateInput,
): Promise<ServiceResult<ContractTemplate>> {
  try {
    const { agencyId } = await getCurrentUserAgency();
    const extra: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.content) {
      extra.variables = extractTemplateVariables(input.content);
    }
    const { data, error } = await supabase
      .from("contract_templates")
      .update({ ...input, ...extra })
      .eq("id", id)
      .eq("agency_id", agencyId)
      .select("*")
      .single();
    if (error) return { error: error.message };
    return { data: data as ContractTemplate };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function archiveContractTemplate(id: string): Promise<ServiceResult<null>> {
  const res = await updateContractTemplate(id, { status: "archived" });
  return res.error ? { error: res.error } : { data: null };
}

export async function duplicateContractTemplate(
  id: string,
): Promise<ServiceResult<ContractTemplate>> {
  try {
    const { agencyId } = await getCurrentUserAgency();
    const { data: original, error: getErr } = await supabase
      .from("contract_templates")
      .select("*")
      .eq("id", id)
      .eq("agency_id", agencyId)
      .single();
    if (getErr) return { error: getErr.message };
    const { id: _id, created_at: _c, updated_at: _u, ...rest } = original;
    const { data, error } = await supabase
      .from("contract_templates")
      .insert({ ...rest, name: `${original.name} (cópia)`, status: "draft" })
      .select("*")
      .single();
    if (error) return { error: error.message };
    return { data: data as ContractTemplate };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function validateContractTemplate(
  id: string,
): Promise<ServiceResult<{ valid: boolean; missing: string[] }>> {
  try {
    const { agencyId } = await getCurrentUserAgency();
    const { data: template, error } = await supabase
      .from("contract_templates")
      .select("*")
      .eq("id", id)
      .eq("agency_id", agencyId)
      .single();
    if (error) return { error: error.message };

    const { data: mappings } = await supabase
      .from("contract_template_variables")
      .select("*")
      .eq("template_id", id)
      .eq("agency_id", agencyId);

    const requiredVars: string[] = template.required_variables ?? [];
    const mappedKeys = (mappings ?? []).map((m: ContractTemplateVariable) => m.variable_key);
    const missing = requiredVars.filter((k) => !mappedKeys.includes(k));
    return { data: { valid: missing.length === 0, missing } };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function publishContractTemplate(
  id: string,
): Promise<ServiceResult<ContractTemplate>> {
  const validation = await validateContractTemplate(id);
  if (validation.error) return { error: validation.error };
  if (!validation.data?.valid) {
    return {
      error: `Não é possível publicar: variáveis sem origem — ${validation.data?.missing.join(", ")}`,
    };
  }
  return updateContractTemplate(id, { status: "published" });
}

// ─── Variáveis de Template ────────────────────────────────────────────────────

export async function listTemplateVariables(
  templateId: string,
): Promise<ServiceResult<ContractTemplateVariable[]>> {
  try {
    const { agencyId } = await getCurrentUserAgency();
    const { data, error } = await supabase
      .from("contract_template_variables")
      .select("*")
      .eq("template_id", templateId)
      .eq("agency_id", agencyId)
      .order("created_at");
    if (error) return { error: error.message };
    return { data: (data ?? []) as ContractTemplateVariable[] };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function upsertTemplateVariableMappings(
  templateId: string,
  mappings: Omit<ContractTemplateVariable, "id" | "agency_id" | "template_id">[],
): Promise<ServiceResult<null>> {
  try {
    const { agencyId } = await getCurrentUserAgency();
    await supabase
      .from("contract_template_variables")
      .delete()
      .eq("template_id", templateId)
      .eq("agency_id", agencyId);
    if (mappings.length === 0) return { data: null };
    const rows = mappings.map((m) => ({ ...m, template_id: templateId, agency_id: agencyId }));
    const { error } = await supabase.from("contract_template_variables").insert(rows);
    if (error) return { error: error.message };
    return { data: null };
  } catch (e) {
    return { error: String(e) };
  }
}

// ─── Serviços ─────────────────────────────────────────────────────────────────

export async function listServices(): Promise<ServiceResult<AgencyService[]>> {
  try {
    const { agencyId } = await getCurrentUserAgency();
    const { data, error } = await supabase
      .from("services")
      .select("*, service_deliverables(*)")
      .eq("agency_id", agencyId)
      .eq("status", "active")
      .order("name");
    if (error) return { error: error.message };
    return { data: data as AgencyService[] };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function createService(
  input: Partial<AgencyService>,
): Promise<ServiceResult<AgencyService>> {
  try {
    const { agencyId } = await getCurrentUserAgency();
    const { service_deliverables: _d, id: _id, agency_id: _a, ...rest } = input as AgencyService;
    const { data, error } = await supabase
      .from("services")
      .insert({ ...rest, agency_id: agencyId, status: "active" })
      .select("*")
      .single();
    if (error) return { error: error.message };
    return { data: data as AgencyService };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function updateService(
  id: string,
  input: Partial<AgencyService>,
): Promise<ServiceResult<AgencyService>> {
  try {
    const { agencyId } = await getCurrentUserAgency();
    const { service_deliverables: _d, id: _id, agency_id: _a, ...rest } = input as AgencyService;
    const { data, error } = await supabase
      .from("services")
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("agency_id", agencyId)
      .select("*")
      .single();
    if (error) return { error: error.message };
    return { data: data as AgencyService };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function deleteService(id: string): Promise<ServiceResult<null>> {
  try {
    const { agencyId } = await getCurrentUserAgency();
    const { error } = await supabase
      .from("services")
      .update({ status: "archived" })
      .eq("id", id)
      .eq("agency_id", agencyId);
    if (error) return { error: error.message };
    return { data: null };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function upsertDeliverables(
  serviceId: string,
  deliverables: { title: string; description?: string; position: number }[],
): Promise<ServiceResult<null>> {
  try {
    const { agencyId } = await getCurrentUserAgency();
    await supabase
      .from("service_deliverables")
      .delete()
      .eq("service_id", serviceId)
      .eq("agency_id", agencyId);
    if (deliverables.length === 0) return { data: null };
    const rows = deliverables.map((d) => ({ ...d, service_id: serviceId, agency_id: agencyId }));
    const { error } = await supabase.from("service_deliverables").insert(rows);
    if (error) return { error: error.message };
    return { data: null };
  } catch (e) {
    return { error: String(e) };
  }
}

// ─── Client Deals ─────────────────────────────────────────────────────────────

export async function listClientDeals(clientId?: string): Promise<ServiceResult<ClientDeal[]>> {
  try {
    const { agencyId } = await getCurrentUserAgency();
    let query = supabase
      .from("client_deals")
      .select("*")
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false });
    if (clientId) query = query.eq("client_id", clientId);
    const { data, error } = await query;
    if (error) return { error: error.message };
    return { data: data as ClientDeal[] };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function createClientDeal(
  input: Partial<ClientDeal>,
): Promise<ServiceResult<ClientDeal>> {
  try {
    const { agencyId } = await getCurrentUserAgency();
    const { id: _id, agency_id: _a, ...rest } = input as ClientDeal;
    const { data, error } = await supabase
      .from("client_deals")
      .insert({ ...rest, agency_id: agencyId, status: rest.status ?? "draft" })
      .select("*")
      .single();
    if (error) return { error: error.message };
    return { data: data as ClientDeal };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function updateClientDeal(
  id: string,
  input: Partial<ClientDeal>,
): Promise<ServiceResult<ClientDeal>> {
  try {
    const { agencyId } = await getCurrentUserAgency();
    const { id: _id, agency_id: _a, ...rest } = input as ClientDeal;
    const { data, error } = await supabase
      .from("client_deals")
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("agency_id", agencyId)
      .select("*")
      .single();
    if (error) return { error: error.message };
    return { data: data as ClientDeal };
  } catch (e) {
    return { error: String(e) };
  }
}
