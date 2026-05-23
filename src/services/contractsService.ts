// src/services/contractsService.ts

/**
 * Serviço de contratos – camada de acesso ao Supabase.
 * Contém funções CRUD para contratos e templates de contrato.
 * Todos os métodos fazem logs padronizados com o prefixo `[ContractsService]`.
 */

import { supabase } from "@/services/supabase";
import type { Contract, ContractStatus } from "@/lib/types";
import { getCurrentUserAgency } from "@/lib/auth";

/**
 * Tipo de retorno genérico usado nas funções de serviço.
 */
export interface ServiceResult<T> {
  data?: T;
  error?: string;
}

/**
 * Dados necessários para criar um rascunho de contrato.
 */
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

/**
 * Dados para atualizar um contrato existente.
 */
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

/**
 * Envia um contrato já criado ao Autentique para assinatura.
 * Caso `fileUrl` seja fornecido, o conteúdo do arquivo será baixado e enviado.
 * Se não houver arquivo, envia o conteúdo do contrato como texto.
 */
export interface AutentiqueResult {
  documentId: string | null;
  signatureUrl: string | null;
}

export async function sendContractToAutentique(
  contractId: string,
  fileUrl?: string,
): Promise<ServiceResult<AutentiqueResult>> {
  console.log("[ContractsService] sendContractToAutentique via Edge Function:", contractId);

  const { data, error } = await supabase.functions.invoke("contract-send-autentique", {
    body: { contractId, fileUrl: fileUrl || null },
  });

  if (error) {
    const ctx = (error as { context?: unknown }).context;
    if (ctx instanceof Response) {
      const payload = await ctx.json().catch(() => null) as { error?: string } | null;
      return { error: payload?.error ?? error.message };
    }
    return { error: error.message };
  }

  const result = data as { error?: string; documentId?: string; signatureUrl?: string };
  if (result?.error) return { error: result.error };

  return { data: { documentId: result.documentId ?? null, signatureUrl: result.signatureUrl ?? null } };
}

/**
 * Representação de um template de contrato.
 */
export interface ContractTemplate {
  id: string;
  name: string;
  content: string;
}

/**
 * Dados para criar um novo template.
 */
export interface CreateContractTemplateInput {
  name: string;
  content: string;
}

/**
 * Dados para atualizar um template existente.
 */
export interface UpdateContractTemplateInput {
  name?: string;
  content?: string;
}

/** ------------------------------------------------------------ */
/**                         CONTRATOS                           */
/** ------------------------------------------------------------ */

/** Lista todos os contratos da agência atual. */
export async function listContracts(): Promise<ServiceResult<Contract[]>> {
  console.log("[ContractsService] listContracts chamado");
  try {
    const { agencyId } = await getCurrentUserAgency();
    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .eq("agency_id", agencyId);
    if (error) {
      console.error("[ContractsService] Erro ao listar contratos:", error.message);
      return { error: error.message };
    }
    return { data: data as Contract[] };
  } catch (e) {
    return { error: String(e) };
  }
}

/** Busca um contrato pelo ID. */
export async function getContract(id: string): Promise<ServiceResult<Contract>> {
  console.log("[ContractsService] getContract", id);
  const { data, error } = await supabase
    .from("contracts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[ContractsService] Erro ao obter contrato:", error.message);
    return { error: error.message };
  }
  if (!data) return { error: "Contrato não encontrado" };
  return { data: data as Contract };
}

/** Cria um contrato em rascunho (status = 'draft'). */
export async function createDraft(
  input: CreateContractDraftInput,
): Promise<ServiceResult<Contract>> {
  console.log("[ContractsService] createDraft", input);
  // client_name não é coluna do banco — removido antes do insert
  const { client_name: _ignored, ...rest } = input;
  let agencyId: string | undefined;
  try {
    const ctx = await getCurrentUserAgency();
    agencyId = ctx.agencyId;
  } catch (_) {}
  const payload = {
    ...rest,
    ...(agencyId ? { agency_id: agencyId } : {}),
    status: "draft" as ContractStatus,
    created_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("contracts")
    .insert(payload)
    .select("*")
    .single();
  if (error) {
    console.error("[ContractsService] Erro ao criar rascunho:", error.message);
    return { error: error.message };
  }
  return { data: data as Contract };
}

/** Atualiza um contrato existente. */
export async function updateContract(
  id: string,
  input: UpdateContractInput,
): Promise<ServiceResult<Contract>> {
  console.log("[ContractsService] updateContract", id, input);
  const { data, error } = await supabase
    .from("contracts")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    console.error("[ContractsService] Erro ao atualizar contrato:", error.message);
    return { error: error.message };
  }
  return { data: data as Contract };
}

/** Deleta um contrato pelo ID. */
export async function deleteContract(id: string): Promise<ServiceResult<null>> {
  console.log("[ContractsService] deleteContract", id);
  const { error } = await supabase.from("contracts").delete().eq("id", id);
  if (error) {
    console.error("[ContractsService] Erro ao deletar contrato:", error.message);
    return { error: error.message };
  }
  return { data: null };
}

/** ------------------------------------------------------------ */
/**                     TEMPLATE DE CONTRATAR                    */
/** ------------------------------------------------------------ */

/** Lista todos os templates de contrato. */
export async function listContractTemplates(): Promise<
  ServiceResult<ContractTemplate[]>
> {
  console.log("[ContractsService] listContractTemplates");
  const { data, error } = await supabase.from("contract_templates").select("*");
  if (error) {
    console.error(
      "[ContractsService] Erro ao listar templates:",
      error.message,
    );
    return { error: error.message };
  }
  return { data: data as ContractTemplate[] };
}

/** Busca um template pelo ID. */
export async function getContractTemplate(
  id: string,
): Promise<ServiceResult<ContractTemplate>> {
  console.log("[ContractsService] getContractTemplate", id);
  const { data, error } = await supabase
    .from("contract_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error(
      "[ContractsService] Erro ao obter template:",
      error.message,
    );
    return { error: error.message };
  }
  if (!data) return { error: "Template não encontrado" };
  return { data: data as ContractTemplate };
}

/** Cria um novo template de contrato. */
export async function createContractTemplate(
  input: CreateContractTemplateInput,
): Promise<ServiceResult<ContractTemplate>> {
  console.log("[ContractsService] createContractTemplate", input);
  const payload = {
    ...input,
    created_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("contract_templates")
    .insert(payload)
    .select("*")
    .single();
  if (error) {
    console.error(
      "[ContractsService] Erro ao criar template:",
      error.message,
    );
    return { error: error.message };
  }
  return { data: data as ContractTemplate };
}

/** Atualiza um template existente. */
export async function updateContractTemplate(
  id: string,
  input: UpdateContractTemplateInput,
): Promise<ServiceResult<ContractTemplate>> {
  console.log("[ContractsService] updateContractTemplate", id, input);
  const { data, error } = await supabase
    .from("contract_templates")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    console.error(
      "[ContractsService] Erro ao atualizar template:",
      error.message,
    );
    return { error: error.message };
  }
  return { data: data as ContractTemplate };
}

/** ------------------------------------------------------------ */
/**                         UTILIDADES                           */
/** ------------------------------------------------------------ */

