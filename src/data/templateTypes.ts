import { TaskPriority } from "./mockProjects";

export type TemplateStatus = "active" | "draft" | "paused";

export type TemplateCategory =
  | "paid_traffic"
  | "social_media"
  | "launch"
  | "branding"
  | "web_design"
  | "creatives"
  | "onboarding"
  | "consulting"
  | "custom";

export type RelativeDateBase =
  | "contract_signed_at"
  | "project_start_date"
  | "briefing_completed_at"
  | "manual_date";

export interface AssigneeRule {
  type:
    | "specific_user"
    | "role"
    | "client_owner"
    | "project_manager"
    | "first_available"
    | "manual";
  value?: string; // specific user ID or role name
  fallback?: "manager" | "unassigned" | "manual_review";
}

export interface RelativeDueDate {
  amount: number;
  unit: "days" | "weeks" | "months";
  direction: "after" | "before";
  base: RelativeDateBase;
}

export interface TemplateChecklistItem {
  id: string;
  title: string;
}

export interface TemplateColumn {
  id: string;
  title: string;
  position: number;
  color: string; // Tailwind bg-class e.g. 'bg-blue-500'
  isFinalColumn?: boolean;
}

export interface TemplateTask {
  id: string;
  title: string;
  description: string;
  columnId: string;
  priority: TaskPriority;
  assigneeRule: AssigneeRule;
  relativeDueDate: RelativeDueDate;
  checklist: TemplateChecklistItem[];
  dependencies: string[]; // array of template task IDs this task depends on
  tags: string[];
  isClientVisible: boolean;
}

export interface TemplateAutomation {
  enabled: boolean;
  trigger: "contract_signed" | "briefing_completed" | "client_created" | "manual";
  createProject: boolean;
  createTasks: boolean;
  assignUsers: boolean;
  notifyInternalGroup: boolean;
  requireManualReview: boolean;
}

export interface AgencyTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  status: TemplateStatus;
  columns: TemplateColumn[];
  tasks: TemplateTask[];
  automation: TemplateAutomation;
  linkedContractTitle?: string; // contract template linked to (from mock contracts)
  lastEditedAt: string;
}
