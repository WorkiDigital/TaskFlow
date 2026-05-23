import type {
  Activity,
  Client,
  Contract,
  Deadline,
  Onboarding,
  ProjectTask,
} from "./types";

export const dashboardMetrics = {
  activeClients: 0,
  onboardingInProgress: 0,
  pendingContracts: 0,
  activeProjects: 0,
};

export const mockClients: Client[] = [];

export const mockOnboardings: Onboarding[] = [];

export const mockContracts: Contract[] = [];

export const mockProjects: ProjectTask[] = [];

export const mockActivities: Activity[] = [];

export const mockDeadlines: Deadline[] = [];

export const teamMembers = [
  { id: "t1", name: "Você (Admin)", role: "Administrador", initials: "AD" }
];
