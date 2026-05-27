export type ProjectStatus = "planning" | "active" | "paused" | "completed";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
// Fase 3: Expanded Statuses
export type TaskStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "review"
  | "waiting"
  | "approved"
  | "done";

export interface Space {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
  parentSpaceId?: string | null;
  spaceType?: "space" | "folder";
}

export interface Project {
  id: string;
  spaceId: string;
  name: string;
  clientName: string;
  status: ProjectStatus;
  progress: number;
  startDate: string;
  dueDate: string;
  members: string[];
  templateOrigin?: string;
}

export interface KanbanColumn {
  id: string;
  status: TaskStatus;
  title: string;
  position: number;
  color: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  done: boolean;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

export interface ActivityLog {
  id: string;
  description: string;
  timestamp: string;
}

export interface CustomFields {
  channel?: string;
  deliverableType?: string;
  estimatedValue?: string;
  sprint?: string;
  complexity?: string;
  clientApproval?: string;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  columnId: string;
  parentTaskId?: string | null;
  status: TaskStatus;
  title: string;
  description: string;
  assignee: string;
  dueDate: string;
  priority: TaskPriority;
  checklist: ChecklistItem[];
  comments: Comment[];
  activity: ActivityLog[];
  customFields?: CustomFields;
  tags: string[];
}

export const mockSpaces: Space[] = [
  { id: "sp-1", name: "Marketing", color: "bg-pink-500" },
  { id: "sp-2", name: "Tráfego Pago", color: "bg-blue-500" },
  { id: "sp-3", name: "Design", color: "bg-purple-500" },
  { id: "sp-4", name: "Lançamentos", color: "bg-orange-500" },
];

export const mockProjectColumns: KanbanColumn[] = [
  { id: "col-1", status: "backlog", title: "Backlog", position: 1, color: "bg-gray-500" },
  { id: "col-2", status: "todo", title: "Para fazer", position: 2, color: "bg-slate-400" },
  { id: "col-3", status: "in_progress", title: "Em andamento", position: 3, color: "bg-blue-500" },
  { id: "col-4", status: "review", title: "Em revisão", position: 4, color: "bg-yellow-500" },
  {
    id: "col-5",
    status: "waiting",
    title: "Aguardando cliente",
    position: 5,
    color: "bg-orange-500",
  },
  { id: "col-6", status: "approved", title: "Aprovado", position: 6, color: "bg-emerald-500" },
  { id: "col-7", status: "done", title: "Finalizado", position: 7, color: "bg-green-500" },
];

export const mockProjectsList: Project[] = [
  {
    id: "p-1",
    spaceId: "sp-4",
    name: "Lançamento Infoproduto 30 Dias",
    clientName: "Northwave",
    status: "active",
    progress: 45,
    startDate: "2026-05-01",
    dueDate: "2026-05-30",
    members: ["MC", "RT"],
    templateOrigin: "Lançamento de Infoproduto 30 Dias",
  },
  {
    id: "p-2",
    spaceId: "sp-2",
    name: "Gestão de Tráfego – Clínica Premium",
    clientName: "Viva Corp",
    status: "active",
    progress: 10,
    startDate: "2026-05-15",
    dueDate: "2026-11-15",
    members: ["JP"],
  },
  {
    id: "p-3",
    spaceId: "sp-3",
    name: "Rebranding – E-commerce de Moda",
    clientName: "Arco Estúdio",
    status: "planning",
    progress: 0,
    startDate: "2026-06-01",
    dueDate: "2026-07-15",
    members: ["MC", "PH", "RT"],
  },
];

export const mockProjectTasks: ProjectTask[] = [
  {
    id: "t-1",
    projectId: "p-1",
    columnId: "col-3",
    status: "in_progress",
    title: "Definir avatar da campanha",
    description: "Pesquisa de mercado e definição das dores e desejos do público alvo.",
    assignee: "MC",
    dueDate: "2026-05-25",
    priority: "high",
    checklist: [
      { id: "chk-1", title: "Entrevistar 5 clientes base", done: true },
      { id: "chk-2", title: "Mapear objeções de compra", done: false },
    ],
    comments: [
      {
        id: "c-1",
        author: "RT",
        content: "As entrevistas começam amanhã.",
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
    activity: [
      {
        id: "a-1",
        description: "MC moveu para Em andamento",
        timestamp: new Date(Date.now() - 186400000).toISOString(),
      },
    ],
    tags: ["Pesquisa", "Estratégia"],
    customFields: { sprint: "Sprint 01", complexity: "Média" },
  },
  {
    id: "t-2",
    projectId: "p-1",
    columnId: "col-2",
    status: "todo",
    title: "Criar página de captura",
    description: "Desenvolvimento da landing page de registro para o evento ao vivo.",
    assignee: "RT",
    dueDate: "2026-05-28",
    priority: "urgent",
    checklist: [
      { id: "chk-3", title: "Copy da página", done: false },
      { id: "chk-4", title: "Design no Figma", done: false },
      { id: "chk-5", title: "Implementação", done: false },
    ],
    comments: [],
    activity: [],
    tags: ["Design", "Web"],
    customFields: { channel: "Web", deliverableType: "Página" },
  },
  {
    id: "t-3",
    projectId: "p-1",
    columnId: "col-4",
    status: "review",
    title: "Configurar automações de e-mail",
    description: "Sequência de boas-vindas e lembretes para o evento.",
    assignee: "PH",
    dueDate: "2026-05-24",
    priority: "medium",
    checklist: [
      { id: "chk-6", title: "E-mail 1 escrito", done: true },
      { id: "chk-7", title: "E-mail 2 escrito", done: true },
      { id: "chk-8", title: "Automação no ActiveCampaign", done: false },
    ],
    comments: [],
    activity: [],
    tags: ["E-mail", "Automação"],
  },
  {
    id: "t-4",
    projectId: "p-2",
    columnId: "col-3",
    status: "in_progress",
    title: "Configuração do Meta Ads",
    description: "Criação da conta, pixel e públicos personalizados.",
    assignee: "JP",
    dueDate: "2026-05-20",
    priority: "high",
    checklist: [
      { id: "chk-9", title: "Pixel instalado", done: true },
      { id: "chk-10", title: "Público lookalike", done: false },
    ],
    comments: [],
    activity: [],
    tags: ["Ads", "Setup"],
    customFields: { channel: "Instagram Ads", sprint: "Setup" },
  },
];

export interface ProjectDoc {
  id: string;
  projectId: string;
  title: string;
  content: string;
  updatedAt: string;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
}

export interface ProjectActivity {
  id: string;
  projectId: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
}

export const mockProjectDocs: ProjectDoc[] = [
  {
    id: "doc-1",
    projectId: "p-1",
    title: "Estratégia Geral do Lançamento",
    content:
      "# Planejamento do Lançamento Semanal\n\nEste documento detalha o funil de vendas completo, incluindo captação de leads via Meta Ads, e-mails de lembrete e página de obrigado com grupo de WhatsApp de super-aquecimento.\n\n## Objetivos\n- Meta de leads: 5.000 inscritos.\n- Custo por lead ideal: R$ 2,50.",
    updatedAt: "2026-05-22T15:30:00.000Z",
  },
  {
    id: "doc-2",
    projectId: "p-1",
    title: "Roteiro dos Vídeos de CPL",
    content:
      "## Roteiro CPL 1 - A Oportunidade\n\n- **Gancho Inicial (0-15s):** Revelar o maior segredo do mercado de agências.\n- **Conteúdo (15s-5m):** Mostrar como faturar 5 dígitos no piloto automático.\n- **Chamada de Ação (CTA):** Comentar na publicação ou preencher formulário.",
    updatedAt: "2026-05-21T18:15:00.000Z",
  },
];

export const mockProjectFiles: ProjectFile[] = [
  {
    id: "file-1",
    projectId: "p-1",
    name: "figma_layout_landing_page.fig",
    size: "15.4 MB",
    type: "figma",
    uploadedAt: "2026-05-22T14:10:00.000Z",
  },
  {
    id: "file-2",
    projectId: "p-1",
    name: "briefing_copys_trafego.pdf",
    size: "1.8 MB",
    type: "pdf",
    uploadedAt: "2026-05-20T10:05:00.000Z",
  },
];

export const mockProjectActivities: ProjectActivity[] = [
  {
    id: "act-1",
    projectId: "p-1",
    user: "MC",
    action: "concluiu a tarefa",
    target: "Design da LP de Captura",
    timestamp: "2026-05-22T17:00:00.000Z",
  },
  {
    id: "act-2",
    projectId: "p-1",
    user: "RT",
    action: "criou a tarefa",
    target: "Configurar automações de e-mail",
    timestamp: "2026-05-21T11:20:00.000Z",
  },
];
