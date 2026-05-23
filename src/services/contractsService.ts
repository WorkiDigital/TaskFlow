// src/services/contractsService.ts

/**
 * Serviço de contratos – camada de acesso ao Supabase.
 * Contém funções CRUD para contratos e templates de contrato.
 * Todos os métodos fazem logs padronizados com o prefixo `[ContractsService]`.
 */

import { supabase } from "@/services/supabase";
import type { Contract, ContractStatus } from "@/lib/types";

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
  client_id: string;
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
  // 1️⃣ Busca contrato
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('content, signer_email, signer_name, client_id')
    .eq('id', contractId)
    .maybeSingle();
  if (contractError) return { error: contractError.message };
  if (!contract) return { error: 'Contrato não encontrado' };

  // 2️⃣ Busca token Autentique nas configurações da agência
  const { data: settings, error: settingsError } = await supabase
    .from('agency_settings')
    .select('autentique_token')
    .limit(1)
    .single();
  if (settingsError) return { error: settingsError.message };
  const token = settings?.autentique_token;
  if (!token) return { error: 'Token Autentique não configurado' };

  // 3️⃣ Prepara o upload do documento
  const makeContractFile = (content: string) => new Blob([content], { type: 'text/plain;charset=utf-8' });
  const operations = {
    query: `mutation CreateDocumentMutation($document: DocumentInput!, $signers: [SignerInput!]!, $file: Upload!) {
      createDocument(document: $document, signers: $signers, file: $file) {
        id
        name
        signatures { public_id name email link { short_link } }
      }
    }`,
    variables: {
      document: { name: `Contrato - ${contract.signer_name ?? 'Cliente'}` },
      signers: [{ email: contract.signer_email ?? '', name: contract.signer_name ?? '', action: 'SIGN' }],
      file: null,
    },
  };

  const formData = new FormData();
  formData.append('operations', JSON.stringify(operations));
  formData.append('map', JSON.stringify({ file: ['variables.file'] }));

  // Se houver URL de arquivo, tenta obter o conteúdo, caso contrário usa o texto do contrato
  let fileContent = contract.content ?? '';
  if (fileUrl) {
    try {
      const resp = await fetch(fileUrl);
      if (resp.ok) fileContent = await resp.text();
    } catch (_) {
      // Ignora falha e continua com o conteúdo do contrato
    }
  }
  formData.append('file', makeContractFile(fileContent), `contrato-${contractId}.txt`);

  // 4️⃣ Faz a chamada ao Autentique
  const requestAutentique = async (token: string, formData: FormData) => {
    const response = await fetch('https://api.autentique.com.br/v2/graphql', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.errors) {
      const message = Array.isArray(payload.errors)
        ? payload.errors.map((i: any) => i.message).filter(Boolean).join(' ')
        : payload.message;
      throw new Error(message || `Autentique retornou HTTP ${response.status}`);
    }
    return payload;
  };

  try {
    const autentiquePayload = await requestAutentique(token, formData);
    const document = autentiquePayload?.data?.createDocument ?? {};
    const signatureUrl = document?.signatures?.[0]?.link?.short_link ?? null;

    // 5️⃣ Atualiza contrato no Supabase
    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        status: 'sent',
        autentique_document_id: document.id ?? null,
        signature_url: signatureUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contractId);
    if (updateError) return { error: updateError.message };

    return { data: { documentId: document.id ?? null, signatureUrl } };
  } catch (e) {
    const err = e as Error;
    return { error: err.message };
  }
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

/** Lista todos os contratos. */
export async function listContracts(): Promise<ServiceResult<Contract[]>> {
  console.log("[ContractsService] listContracts chamado");
  const { data, error } = await supabase.from("contracts").select("*");
  if (error) {
    console.error("[ContractsService] Erro ao listar contratos:", error.message);
    return { error: error.message };
  }
  return { data: data as Contract[] };
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
  const payload = {
    ...input,
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

