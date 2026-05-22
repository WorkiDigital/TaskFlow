import type {
  Activity,
  Client,
  Contract,
  Deadline,
  Onboarding,
  ProjectTask,
} from "./types";

export const dashboardMetrics = {
  activeClients: 24,
  onboardingInProgress: 7,
  pendingContracts: 5,
  activeProjects: 12,
};

export const mockClients: Client[] = [
  {
    id: "c1",
    name: "Marina Costa",
    email: "marina@brightlab.co",
    company: "BrightLab",
    status: "active",
    mrr: 8400,
    createdAt: "2025-03-12",
  },
  {
    id: "c2",
    name: "Rafael Tavares",
    email: "rafa@northwave.io",
    company: "Northwave",
    status: "onboarding",
    mrr: 5200,
    createdAt: "2025-09-02",
  },
  {
    id: "c3",
    name: "Juliana Pires",
    email: "ju@arcoestudio.com",
    company: "Arco Estúdio",
    status: "active",
    mrr: 12500,
    createdAt: "2024-11-21",
  },
  {
    id: "c4",
    name: "Diego Almeida",
    email: "diego@fluxomedia.com",
    company: "Fluxo Media",
    status: "paused",
    mrr: 0,
    createdAt: "2024-06-15",
  },
  {
    id: "c5",
    name: "Carla Mendes",
    email: "carla@vivacorp.com",
    company: "Viva Corp",
    status: "active",
    mrr: 9800,
    createdAt: "2025-01-08",
  },
  {
    id: "c6",
    name: "Pedro Henrique",
    email: "pedro@trilhalab.com",
    company: "Trilha Lab",
    status: "onboarding",
    mrr: 4200,
    createdAt: "2025-10-10",
  },
];

export const mockOnboardings: Onboarding[] = [
  {
    id: "o1",
    clientName: "Northwave",
    startedAt: "2025-09-02",
    progress: 60,
    currentStep: "Contrato",
    steps: [
      { id: "s1", label: "Briefing", status: "done" },
      { id: "s2", label: "Documentos", status: "done" },
      { id: "s3", label: "Contrato", status: "in_progress" },
      { id: "s4", label: "Kickoff", status: "pending" },
    ],
  },
  {
    id: "o2",
    clientName: "Trilha Lab",
    startedAt: "2025-10-10",
    progress: 25,
    currentStep: "Documentos",
    steps: [
      { id: "s1", label: "Briefing", status: "done" },
      { id: "s2", label: "Documentos", status: "in_progress" },
      { id: "s3", label: "Contrato", status: "pending" },
      { id: "s4", label: "Kickoff", status: "pending" },
    ],
  },
  {
    id: "o3",
    clientName: "Solaris Studio",
    startedAt: "2025-11-01",
    progress: 80,
    currentStep: "Kickoff",
    steps: [
      { id: "s1", label: "Briefing", status: "done" },
      { id: "s2", label: "Documentos", status: "done" },
      { id: "s3", label: "Contrato", status: "done" },
      { id: "s4", label: "Kickoff", status: "in_progress" },
    ],
  },
];

export const mockContracts: Contract[] = [
  {
    id: "ct1",
    title: "Gestão de tráfego — Trimestre",
    clientName: "BrightLab",
    value: 18000,
    status: "signed",
    createdAt: "2025-08-01",
    expiresAt: "2025-11-01",
  },
  {
    id: "ct2",
    title: "Branding completo",
    clientName: "Northwave",
    value: 24000,
    status: "pending",
    createdAt: "2025-09-15",
  },
  {
    id: "ct3",
    title: "Retainer mensal",
    clientName: "Viva Corp",
    value: 9800,
    status: "draft",
    createdAt: "2025-11-12",
  },
  {
    id: "ct4",
    title: "Campanha lançamento",
    clientName: "Arco Estúdio",
    value: 36000,
    status: "signed",
    createdAt: "2025-05-20",
    expiresAt: "2026-05-20",
  },
  {
    id: "ct5",
    title: "Consultoria SEO",
    clientName: "Fluxo Media",
    value: 6000,
    status: "expired",
    createdAt: "2024-06-15",
    expiresAt: "2025-06-15",
  },
];

export const mockProjects: ProjectTask[] = [
  { id: "p1", title: "Landing page lançamento", clientName: "BrightLab", priority: "high", assignee: "MC", status: "in_progress", dueDate: "2025-12-01" },
  { id: "p2", title: "Identidade visual v2", clientName: "Northwave", priority: "medium", assignee: "RT", status: "backlog" },
  { id: "p3", title: "Campanha Black Friday", clientName: "Arco Estúdio", priority: "high", assignee: "JP", status: "review", dueDate: "2025-11-25" },
  { id: "p4", title: "Auditoria SEO", clientName: "Viva Corp", priority: "low", assignee: "CM", status: "done" },
  { id: "p5", title: "Editorial Instagram", clientName: "Trilha Lab", priority: "medium", assignee: "PH", status: "in_progress" },
  { id: "p6", title: "Vídeo institucional", clientName: "BrightLab", priority: "medium", assignee: "MC", status: "backlog" },
  { id: "p7", title: "Setup CRM", clientName: "Northwave", priority: "low", assignee: "RT", status: "review" },
  { id: "p8", title: "Relatório trimestral", clientName: "Arco Estúdio", priority: "low", assignee: "JP", status: "done" },
];

export const mockActivities: Activity[] = [
  { id: "a1", type: "contract", message: "Contrato 'Branding completo' enviado para Northwave", timestamp: "há 2h" },
  { id: "a2", type: "client", message: "Novo cliente cadastrado: Trilha Lab", timestamp: "há 5h" },
  { id: "a3", type: "onboarding", message: "Solaris Studio avançou para Kickoff", timestamp: "ontem" },
  { id: "a4", type: "project", message: "Tarefa 'Campanha Black Friday' movida para Revisão", timestamp: "ontem" },
  { id: "a5", type: "contract", message: "BrightLab assinou contrato trimestral", timestamp: "há 2 dias" },
];

export const mockDeadlines: Deadline[] = [
  { id: "d1", title: "Entrega landing page", clientName: "BrightLab", dueDate: "01 Dez", type: "delivery" },
  { id: "d2", title: "Reunião kickoff", clientName: "Solaris Studio", dueDate: "28 Nov", type: "meeting" },
  { id: "d3", title: "Renovação contrato", clientName: "BrightLab", dueDate: "01 Dez", type: "contract" },
  { id: "d4", title: "Aprovação campanha", clientName: "Arco Estúdio", dueDate: "25 Nov", type: "delivery" },
];

export const teamMembers = [
  { id: "t1", name: "Marina Costa", role: "Head de Contas", initials: "MC" },
  { id: "t2", name: "Rafael Tavares", role: "Designer", initials: "RT" },
  { id: "t3", name: "Juliana Pires", role: "Project Manager", initials: "JP" },
  { id: "t4", name: "Pedro Henrique", role: "Social Media", initials: "PH" },
];
