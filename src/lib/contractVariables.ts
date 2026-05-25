export interface ContractTemplateVariable {
  variable_key: string;
  label: string;
  source_type:
    | "client_field"
    | "form_field"
    | "commercial_field"
    | "service_field"
    | "fixed_value"
    | "manual_input";
  source_id?: string | null;
  required: boolean;
  field_type: string;
  fallback_value?: string | null;
}

/** Extrai todas as variáveis {{chave}} do conteúdo de um template. */
export function extractTemplateVariables(content: string): string[] {
  const matches = content.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g);
  const keys = Array.from(matches, (m) => m[1]);
  return [...new Set(keys)];
}

/** Substitui variáveis {{chave}} pelos valores resolvidos. */
export function renderContractTemplate(content: string, values: Record<string, string>): string {
  return content.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => values[key] ?? `{{${key}}}`);
}

/** Valida se todas as variáveis obrigatórias estão preenchidas. */
export function validateTemplateVariables(args: {
  requiredVariables: string[];
  resolvedValues: Record<string, unknown>;
}): { valid: boolean; missing: string[] } {
  const missing = args.requiredVariables.filter(
    (k) => !args.resolvedValues[k] || String(args.resolvedValues[k]).trim() === "",
  );
  return { valid: missing.length === 0, missing };
}

/** Resolve o mapa final de variáveis combinando todas as fontes. */
export function resolveContractVariables(args: {
  client?: Record<string, unknown>;
  deal?: Record<string, unknown>;
  service?: Record<string, unknown>;
  formPayload?: Record<string, unknown>;
  fixedValues?: Record<string, unknown>;
  mappings: ContractTemplateVariable[];
}): Record<string, string> {
  const {
    client = {},
    deal = {},
    service = {},
    formPayload = {},
    fixedValues = {},
    mappings,
  } = args;

  const CLIENT_FIELD_MAP: Record<string, string> = {
    nome_cliente: "name",
    email_cliente: "email",
    telefone_cliente: "phone",
    cpf_cnpj_cliente: "cpf_cnpj",
    endereco_cliente: "address",
  };

  const DEAL_FIELD_MAP: Record<string, string> = {
    valor_contrato: "value",
    valor_projeto: "value",
    prazo_meses: "duration_months",
    data_inicio: "start_date",
    data_fim: "end_date",
    forma_pagamento: "payment_terms",
  };

  const SERVICE_FIELD_MAP: Record<string, string> = {
    nome_servico: "name",
    descricao_servico: "description",
    categoria_servico: "category",
  };

  const resolved: Record<string, string> = {};

  for (const mapping of mappings) {
    const key = mapping.variable_key;
    let value: unknown;

    switch (mapping.source_type) {
      case "client_field": {
        const field = mapping.source_id ?? CLIENT_FIELD_MAP[key];
        value = field ? client[field] : client[key];
        break;
      }
      case "commercial_field": {
        const field = mapping.source_id ?? DEAL_FIELD_MAP[key];
        value = field ? deal[field] : deal[key];
        break;
      }
      case "service_field": {
        const field = mapping.source_id ?? SERVICE_FIELD_MAP[key];
        value = field ? service[field] : service[key];
        break;
      }
      case "form_field": {
        value = formPayload[mapping.source_id ?? key] ?? formPayload[key];
        break;
      }
      case "fixed_value": {
        value = mapping.fallback_value ?? "";
        break;
      }
      case "manual_input":
      default:
        value = formPayload[key] ?? fixedValues[key];
        break;
    }

    // Fallback: tenta form payload com o próprio key
    if ((value === undefined || value === null || value === "") && formPayload[key]) {
      value = formPayload[key];
    }

    // Fallback declarado no mapeamento
    if ((value === undefined || value === null || value === "") && mapping.fallback_value) {
      value = mapping.fallback_value;
    }

    if (value !== undefined && value !== null) {
      resolved[key] = String(value);
    }
  }

  // Adiciona valores do formPayload sem mapeamento explícito
  for (const [k, v] of Object.entries(formPayload)) {
    if (!(k in resolved) && v !== undefined && v !== null) {
      resolved[k] = String(v);
    }
  }

  return resolved;
}

/** Retorna as variáveis que ainda precisam de formulário (source_type = form_field ou manual_input sem valor fixo). */
export function getMissingVariablesForForm(
  mappings: ContractTemplateVariable[],
  existingValues: Record<string, unknown> = {},
): ContractTemplateVariable[] {
  return mappings.filter((m) => {
    if (!m.required) return false;
    if (m.source_type === "fixed_value" && m.fallback_value) return false;
    if (existingValues[m.variable_key]) return false;
    return m.source_type === "form_field" || m.source_type === "manual_input";
  });
}
