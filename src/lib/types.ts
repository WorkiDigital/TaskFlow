export type ClientStatus = "active" | "onboarding" | "paused" | "churned";
export type ContractStatus = "draft" | "pending" | "signed" | "expired";
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
  clientName: string;
  value: number;
  status: ContractStatus;
  createdAt: string;
  expiresAt?: string;
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
