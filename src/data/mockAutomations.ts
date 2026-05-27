export type AutomationMode =
  | "complete"
  | "custom"
  | "whatsapp_only"
  | "contract_only"
  | "briefing_only"
  | "internal_notification_only";

export type AutomationStepType =
  | "send_contract_form"
  | "wait_contract_form"
  | "generate_contract"
  | "send_contract_signature"
  | "confirm_contract_sent_client_group"
  | "wait_contract_signed"
  | "create_client_whatsapp_group"
  | "select_internal_agency_group"
  | "add_group_participants"
  | "update_group_description"
  | "send_client_group_welcome"
  | "mention_group_participants"
  | "send_internal_agency_notification"
  | "send_briefing_form"
  | "wait_briefing_form"
  | "notify_briefing_received"
  | "finish_onboarding"
  | "apply_agency_template"
  | "create_recurring_task";

export interface AutomationStep {
  id: string;
  type: AutomationStepType;
  name: string;
  description: string;
  enabled: boolean;
  order: number;
  configStatus: "not_configured" | "partial" | "configured";
  isAutomatic: boolean;
  dependsOn?: AutomationStepType[];
  config?: any;
}

export type AutomationTrigger =
  | "client_created"
  | "contract_signed"
  | "contract_sent"
  | "task_moved_column"
  | "project_created"
  | "manual";

export interface AutomationFlow {
  id: string;
  name: string;
  description?: string;
  mode: AutomationMode;
  trigger?: AutomationTrigger | string;
  status: "active" | "paused" | "draft";
  steps: AutomationStep[];
  createdAt: string;
  updatedAt: string;
}

// Mock inicial
export const mockAutomationFlows: AutomationFlow[] = [
  {
    id: "auto-001",
    name: "Onboarding Padrão Completo",
    mode: "complete",
    status: "active",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: "step-1",
        type: "send_contract_form",
        name: "Enviar formulário de dados contratuais",
        description: "Coleta nome, CNPJ, endereço e detalhes via form online.",
        enabled: true,
        order: 1,
        configStatus: "configured",
        isAutomatic: true,
      },
      {
        id: "step-2",
        type: "wait_contract_form",
        name: "Aguardar preenchimento",
        description: "Pausa o fluxo até o cliente enviar o form.",
        enabled: true,
        order: 2,
        configStatus: "configured",
        isAutomatic: true,
        dependsOn: ["send_contract_form"],
      },
      {
        id: "step-3",
        type: "generate_contract",
        name: "Gerar contrato com variáveis",
        description: "Preenche o template com os dados do form.",
        enabled: true,
        order: 3,
        configStatus: "configured",
        isAutomatic: true,
        dependsOn: ["wait_contract_form"],
      },
      {
        id: "step-4",
        type: "create_client_whatsapp_group",
        name: "Criar grupo do cliente",
        description: "Cria grupo no WhatsApp para o novo projeto.",
        enabled: true,
        order: 4,
        configStatus: "partial",
        isAutomatic: true,
      },
    ],
  },
  {
    id: "auto-002",
    name: "Onboarding Somente WhatsApp",
    mode: "whatsapp_only",
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    steps: [],
  },
];
