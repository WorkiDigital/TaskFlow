// ─── Fluxos ─────────────────────────────────────────────────────────────────

export type FlowStepStatus = "configured" | "partial" | "pending";

export interface OnboardingFlowStep {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  status: FlowStepStatus;
  icon: string; // emoji
  order?: number;
  dependsOn?: string[];
  config?: Record<string, unknown>;
}

// ─── Formulários ─────────────────────────────────────────────────────────────

export type FieldType =
  | "text"
  | "textarea"
  | "email"
  | "phone"
  | "cpf_cnpj"
  | "date"
  | "number"
  | "currency"
  | "select"
  | "multiselect"
  | "upload"
  | "url";

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder: string;
  required: boolean;
  helpText: string;
  variableKey: string;
  options?: string[]; // para select/multiselect
}

export type FormType = "contractual" | "briefing";

export interface FormTemplate {
  id: string;
  name: string;
  type: FormType;
  fields: FormField[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Variáveis ────────────────────────────────────────────────────────────────

export interface Variable {
  id: string;
  key: string; // ex: nome_cliente
  label: string; // ex: Nome do Cliente
  mockValue: string; // ex: João Silva
  usedIn: string[]; // ex: ['Mensagem de boas-vindas', 'Contrato']
  isSystem: boolean; // não pode ser deletada
}

// ─── Mensagens ────────────────────────────────────────────────────────────────

export interface OnboardingMessage {
  id: string;
  name: string;
  description: string;
  body: string;
  icon: string; // emoji
}

// ─── Simulação ────────────────────────────────────────────────────────────────

export type SimLogStatus = "waiting" | "running" | "done" | "skipped" | "error";

export interface SimulationLog {
  stepId: string;
  stepName: string;
  status: SimLogStatus;
  message: string;
  ts: number;
}

// ─── Estado global do workspace ──────────────────────────────────────────────

export interface OnboardingWorkspaceState {
  flowSteps: OnboardingFlowStep[];
  formTemplates: FormTemplate[];
  variables: Variable[];
  messages: OnboardingMessage[];
}
