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
  { id: "c1", name: "Mariana Costa", email: "mariana@luminare.com", company: "Luminare Studio", status: "active", mrr: 4800, createdAt: "2025-11-02" },
  { id: "c2", name: "Rafael Almeida", email: "rafa@northpeak.io", company: "NorthPeak", status: "onboarding", mrr: 3200, createdAt: "2026-04-18" },
  { id: "c3", name: "Júlia Ferreira", email: "julia@verdee.co", company: "Verdee", status: "active", mrr: 6500, createdAt: "2025-08-11" },
  { id: "c4", name: "Diego Martins", email: "diego@orbital.ag", company: "Orbital Agência", status: "paused", mrr: 0, createdAt: "2025-03-22" },
  { id: "c5", name: "Camila Souza", email: "camila@hauss.com", company: "Hauss Imóveis", status: "active", mrr: 5400, createdAt: "2026-01-09" },
  { id: "c6", name: "Bruno Lima", email: "bruno@kindred.co", company: "Kindred", status: "onboarding", mrr: 2800, createdAt: "2026-05-01" },
  { id: "c7", name: "Patrícia Reis", email: "pati@solare.com", company: "Solare", status: "churned", mrr: 0, createdAt: "2024-12-05" },
  { id: "c8", name: "Lucas Pereira", email: "lucas@motiv.app", company: "Motiv", status: "active", mrr: 3900, createdAt: "2026-02-14" },
];

export const mockOnboardings: Onboarding[] = [
  {
    id: "o1", clientName: "NorthPeak", startedAt: "2026-04-18", progress: 65, currentStep: "Documentos",
    steps: [
      { id: "s1", label: "Briefing", status: "done" },
      { id: "s2", label: "Documentos", status: "in_progress" },
      { id: "s3", label: "Contrato", status: "pending" },
      { id: "s4", label: "Kickoff", status: "pending" },
    ],
  },
  {
    id: "o2", clientName: "Kindred", startedAt: "2026-05-01", progress: 30, currentStep: "Briefing",
    steps: [
      { id: "s1", label: "Briefing", status: "in_progress" },
      { id: "s2", label: "Documentos", status: "pending" },
      { id: "s3", label: "Contrato", status: "pending" },
      { id: "s4", label: "Kickoff", status: "pending" },
    ],
  },
  {
    id: "o3", clientName: "Hauss Imóveis", startedAt: "2026-04-29", progress: 90, currentStep: "Kickoff",
    steps: [
      { id: "s1", label: "Briefing", status: "done" },
      { id: "s2", label: "Documentos", status: "done" },
      { id: "s3", label: "Contrato", status: "done" },
      { id: "s4", label: "Kickoff", status: "in_progress" },
    ],
  },
];

export const mockContracts: Contract[] = [
  { id: "ct1", title: "Gestão de tráfego mensal", clientName: "Luminare Studio", value: 4800, status: "signed", createdAt: "2025-11-02", expiresAt: "2026-11-02" },
  { id: "ct2", title: "Projeto de identidade visual", clientName: "NorthPeak", value: 12500, status: "pending", createdAt: "2026-05-10" },
  { id: "ct3", title: "Social media trimestral", clientName: "Verdee", value: 6500, status: "signed", createdAt: "2026-02-01", expiresAt: "2026-05-01" },
  { id: "ct4", title: "Landing page institucional", clientName: "Motiv", value: 7800, status: "draft", createdAt: "2026-05-18" },
  { id: "ct5", title: "Consultoria SEO", clientName: "Kindred", value: 3200, status: "pending", createdAt: "2026-05-15" },
  { id: "ct6", title: "Campanha sazonal", clientName: "Solare", value: 5400, status: "expired", createdAt: "2024-11-20", expiresAt: "2025-11-20" },
];

export const mockProjects: ProjectTask[] = [
  { id: "p1", title: "Mapear personas", clientName: "NorthPeak", priority: "high", assignee: "Ana", status: "in_progress", dueDate: "2026-05-28" },
  { id: "p2", title: "Wireframes do site", clientName: "Motiv", priority: "medium", assignee: "Caio", status: "review", dueDate: "2026-05-26" },
  { id: "p3", title: "Setup do pixel", clientName: "Luminare Studio", priority: "low", assignee: "Bia", status: "done" },
  { id: "p4", title: "Roteiro de vídeos", clientName: "Verdee", priority: "medium", assignee: "Ana", status: "backlog" },
  { id: "p5", title: "Auditoria SEO inicial", clientName: "Kindred", priority: "high", assignee: "Caio", status: "in_progress", dueDate: "2026-05-30" },
  { id: "p6", title: "Briefing visual", clientName: "Hauss Imóveis", priority: "medium", assignee: "Bia", status: "backlog" },
  { id: "p7", title: "Calendário editorial", clientName: "Verdee", priority: "low", assignee: "Ana", status: "review" },
  { id: "p8", title: "Aprovação de criativos", clientName: "Luminare Studio", priority: "high", assignee: "Caio", status: "in_progress", dueDate: "2026-05-24" },
];

export const mockActivities: Activity[] = [
  { id: "a1", type: "contract", message: "Contrato 'Projeto de identidade visual' enviado para NorthPeak.", timestamp: "há 12 min" },
  { id: "a2", type: "onboarding", message: "Kindred concluiu a etapa de Briefing.", timestamp: "há 1 h" },
  { id: "a3", type: "client", message: "Novo cliente cadastrado: Hauss Imóveis.", timestamp: "há 3 h" },
  { id: "a4", type: "project", message: "Tarefa 'Wireframes do site' movida para Revisão.", timestamp: "há 5 h" },
  { id: "a5", type: "contract", message: "Contrato com Verdee renovado por mais 90 dias.", timestamp: "ontem" },
];

export const mockDeadlines: Deadline[] = [
  { id: "d1", title: "Entrega de criativos", clientName: "Luminare Studio", dueDate: "2026-05-24", type: "delivery" },
  { id: "d2", title: "Kickoff oficial", clientName: "Hauss Imóveis", dueDate: "2026-05-25", type: "meeting" },
  { id: "d3", title: "Assinatura de contrato", clientName: "NorthPeak", dueDate: "2026-05-27", type: "contract" },
  { id: "d4", title: "Auditoria SEO", clientName: "Kindred", dueDate: "2026-05-30", type: "delivery" },
];

export const teamMembers = [
  { id: "t1", name: "Você (Admin)", role: "Administrador", initials: "AD" },
  { id: "t2", name: "Ana Beatriz", role: "Gestora de Projetos", initials: "AB" },
  { id: "t3", name: "Caio Mendes", role: "Designer", initials: "CM" },
  { id: "t4", name: "Bia Rocha", role: "Social Media", initials: "BR" },
];
