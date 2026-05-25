/**
 * @file evolutionApiPayloads.ts
 * @description Estruturas e tipagens preparadas para futura integração com a Evolution API via Supabase Edge Functions.
 * IMPORTANTE: Nenhuma chamada direta à Evolution API deve ser feita do frontend.
 * Estas estruturas servem como contrato de dados entre o frontend (construtor de automação) e as Edge Functions.
 */

// Tipo de ação a ser executada pela Edge Function
export type EvolutionActionType =
  | "create_group"
  | "update_group_description"
  | "send_text"
  | "send_text_with_mentions"
  | "send_internal_notification";

export interface BaseEvolutionPayload {
  action: EvolutionActionType;
  /** Nome da instância conectada na Evolution API (virá das configurações da agência no DB) */
  instance: string;
}

// Payload para Criar Grupo do Cliente
export interface CreateGroupPayload extends BaseEvolutionPayload {
  action: "create_group";
  subject: string; // Ex: "Projeto {{nome_projeto}}" renderizado
  description: string;
  participants: string[]; // Arrays de DDI+Número, ex: ["5511999999999"]
}

// Payload para Atualizar Descrição de um Grupo Existente
export interface UpdateGroupDescriptionPayload extends BaseEvolutionPayload {
  action: "update_group_description";
  groupJid: string; // O ID do grupo retornado pela API ou salvo no DB
  description: string; // A nova bio com links dinâmicos
}

// Payload para Enviar Mensagem de Texto Simples
export interface SendTextPayload extends BaseEvolutionPayload {
  action: "send_text";
  number: string; // JID do grupo ou número direto
  text: string; // Mensagem já com variáveis renderizadas
}

// Payload para Enviar Mensagem com Menções
export interface SendTextWithMentionsPayload extends BaseEvolutionPayload {
  action: "send_text_with_mentions";
  number: string; // JID do grupo
  text: string; // Mensagem base
  mentions: {
    mentionClient: boolean;
    mentionAgency: boolean;
    mentionAll: boolean;
    textBefore: string;
    textAfter: string;
    // No backend, a Edge Function fará o lookup dos telefones exatos do cliente/agência
    // e montará a estrutura correta de JIDs na requisição da Evolution API
  };
}

// Payload para Notificar Grupo Interno da Agência
export interface SendInternalNotificationPayload extends BaseEvolutionPayload {
  action: "send_internal_notification";
  number: string; // JID do grupo interno da agência configurado
  text: string;
}

/**
 * Exemplo de como um step do frontend será convertido em Payload para a Edge Function:
 *
 * const frontendStep = {
 *   type: 'create_client_whatsapp_group',
 *   config: { groupName: 'Projeto VIP', participants: ['551199999'] }
 * }
 *
 * const futureEdgeFunctionPayload: CreateGroupPayload = {
 *   action: 'create_group',
 *   instance: 'agencia_prime_inst01',
 *   subject: frontendStep.config.groupName,
 *   description: 'Grupo oficial...',
 *   participants: frontendStep.config.participants
 * }
 */
