export type ClientStatus = "active" | "onboarding" | "paused" | "churned";
export type ContractStatus = "draft" | "pending" | "sent" | "signed" | "expired" | "cancelled" | "error";
export type ProjectStatus = "backlog" | "in_progress" | "review" | "done";
export type Priority = "low" | "medium" | "high";

export interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  status: ClientStatus;
  mrr: number;
  createdAt: string;
  avatar?: string;
}

export interface OnboardingStep {
  id: string;
  label: string;
  status: "pending" | "in_progress" | "done";
}

export interface Onboarding {
  id: string;
  clientName: string;
  startedAt: string;
  progress: number;
  currentStep: string;
  steps: OnboardingStep[];
}

export interface Contract {
  id: string;
  title: string;
  client_id?: string;
  client_name?: string;
  value?: number;
  content?: string;
  status: ContractStatus;
  template_id?: string;
  signer_name?: string;
  signer_email?: string;
  autentique_document_id?: string;
  signature_url?: string;
  signed_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  clientName: string;
  priority: Priority;
  assignee: string;
  status: ProjectStatus;
  dueDate?: string;
}

export interface Activity {
  id: string;
  type: "client" | "contract" | "onboarding" | "project";
  message: string;
  timestamp: string;
}

export interface Deadline {
  id: string;
  title: string;
  clientName: string;
  dueDate: string;
  type: "contract" | "delivery" | "meeting";
}
