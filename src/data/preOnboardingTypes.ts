export interface Service {
  id: string;
  agency_id: string;
  name: string;
  description?: string;
  category?: string;
  pricing_type?: "fixed" | "recurring" | "custom";
  default_price?: number;
  default_duration_months?: number;
  default_contract_template_id?: string;
  default_project_template_id?: string;
  default_onboarding_plan_id?: string;
  default_onboarding_start_mode?: "manual" | "automatic_after_signature" | "approval_required";
  status: "active" | "archived";
  created_at?: string;
  updated_at?: string;
}

export interface ServiceDeliverable {
  id: string;
  agency_id: string;
  service_id: string;
  title: string;
  description?: string;
  position: number;
  created_at?: string;
  updated_at?: string;
}

export interface ClientDeal {
  id: string;
  agency_id: string;
  workspace_id?: string;
  client_id: string;
  service_id?: string;
  contract_template_id?: string;
  value?: number;
  payment_terms?: string;
  duration_months?: number;
  start_date?: string;
  end_date?: string;
  custom_deliverables?: string;
  data_collection_mode?: "portal" | "public_link" | "internal" | "external_integration";
  onboarding_start_mode?: "manual" | "automatic_after_signature" | "approval_required";
  status:
    | "created"
    | "waiting_client_data"
    | "client_data_submitted"
    | "under_review"
    | "ready_to_generate_contract"
    | "contract_generated"
    | "contract_sent"
    | "contract_signed"
    | "ready_for_onboarding"
    | "onboarding_running"
    | "onboarding_completed";
  created_at?: string;
  updated_at?: string;
}

export interface ServiceOnboardingPlan {
  id: string;
  agency_id: string;
  service_id?: string;
  name: string;
  description?: string;
  send_to_whatsapp_group: boolean;
  create_tasks: boolean;
  status: "active" | "archived";
  created_at?: string;
  updated_at?: string;
}

export interface ServiceOnboardingPlanStep {
  id: string;
  agency_id: string;
  plan_id: string;
  day_number: number;
  title: string;
  description?: string;
  message_template?: string;
  create_task: boolean;
  task_title?: string;
  responsible_role?: string;
  position: number;
  created_at?: string;
  updated_at?: string;
}

export interface ClientDealEvent {
  id: string;
  agency_id: string;
  workspace_id?: string;
  client_id: string;
  deal_id?: string;
  type: string;
  message?: string;
  metadata?: Record<string, any>;
  created_by?: string;
  created_at?: string;
}
