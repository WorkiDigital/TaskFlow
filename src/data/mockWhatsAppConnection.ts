export type WhatsAppConnectionStatus =
  | 'disconnected'
  | 'waiting_qr'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'expired'
  | 'reconnecting'

export interface WhatsAppInstance {
  id: string
  agencyId: string
  instanceName: string
  displayName: string
  phoneNumber?: string
  status: WhatsAppConnectionStatus
  lastSyncAt?: string
  apiBaseUrl: string
  maskedApiKey: string
}

export interface WhatsAppGroup {
  id: string
  name: string
  jid: string
  type: 'internal' | 'client' | 'test'
  membersCount: number
  lastSyncAt: string
  isDefaultInternal?: boolean
}

export interface WhatsAppCapability {
  id: string
  label: string
  status: 'available' | 'pending' | 'blocked' | 'not_configured'
  dependsOnConnection: boolean
}

// Initial Mock Data
export const mockInstance: WhatsAppInstance = {
  id: "inst-123",
  agencyId: "agency-1",
  instanceName: "TaskFlow-Evolution-1",
  displayName: "WhatsApp Principal",
  phoneNumber: "",
  status: "disconnected",
  apiBaseUrl: "https://painelevo.workidigital.tech",
  maskedApiKey: "••••••••••••••fa6"
};

export const mockGroups: WhatsAppGroup[] = [
  {
    id: "grp-1",
    name: "🚀 Equipe Interna - TaskFlow",
    jid: "120363000000000001@g.us",
    type: "internal",
    membersCount: 8,
    lastSyncAt: new Date().toISOString(),
    isDefaultInternal: false
  },
  {
    id: "grp-2",
    name: "🚨 Alertas de Sistema",
    jid: "120363000000000002@g.us",
    type: "internal",
    membersCount: 3,
    lastSyncAt: new Date().toISOString()
  },
  {
    id: "grp-3",
    name: "💼 Cliente - XYZ Solutions",
    jid: "120363000000000003@g.us",
    type: "client",
    membersCount: 4,
    lastSyncAt: new Date().toISOString()
  },
  {
    id: "grp-4",
    name: "🧪 Grupo de Teste",
    jid: "120363000000000004@g.us",
    type: "test",
    membersCount: 2,
    lastSyncAt: new Date().toISOString()
  }
];

export const mockCapabilities: WhatsAppCapability[] = [
  { id: 'create_group', label: 'Criar grupos', status: 'blocked', dependsOnConnection: true },
  { id: 'fetch_groups', label: 'Buscar grupos existentes', status: 'blocked', dependsOnConnection: true },
  { id: 'update_desc', label: 'Atualizar descrição do grupo', status: 'blocked', dependsOnConnection: true },
  { id: 'add_members', label: 'Adicionar participantes', status: 'blocked', dependsOnConnection: true },
  { id: 'remove_members', label: 'Remover participantes', status: 'blocked', dependsOnConnection: true },
  { id: 'send_text', label: 'Enviar mensagens de texto', status: 'blocked', dependsOnConnection: true },
  { id: 'send_links', label: 'Enviar mensagens com links', status: 'blocked', dependsOnConnection: true },
  { id: 'mentions', label: 'Enviar mensagens com menções', status: 'blocked', dependsOnConnection: true },
  { id: 'internal_notify', label: 'Notificar grupo interno', status: 'blocked', dependsOnConnection: true },
  { id: 'validate_number', label: 'Validar número WhatsApp', status: 'blocked', dependsOnConnection: true },
  { id: 'get_members', label: 'Consultar membros do grupo', status: 'blocked', dependsOnConnection: true },
];
