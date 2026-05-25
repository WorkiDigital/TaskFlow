import type {
  OnboardingFlowStep,
  FormTemplate,
  Variable,
  OnboardingMessage,
  OnboardingWorkspaceState,
} from "./onboardingTypes";

// ─── Etapas do fluxo ─────────────────────────────────────────────────────────

export const defaultFlowSteps: OnboardingFlowStep[] = [
  {
    id: "send_contractual_form",
    name: "Enviar formulário de dados contratuais",
    description: "Envia o link do formulário contratual para o cliente preencher.",
    enabled: true,
    status: "configured",
    icon: "📋",
    order: 1,
  },
  {
    id: "await_contractual_form",
    name: "Aguardar preenchimento do formulário contratual",
    description: "Pausa o fluxo até o cliente enviar os dados contratuais.",
    enabled: true,
    status: "configured",
    icon: "⏳",
    order: 2,
    dependsOn: ["send_contractual_form"],
  },
  {
    id: "generate_contract",
    name: "Gerar contrato",
    description: "Gera automaticamente o contrato com base nos dados preenchidos.",
    enabled: true,
    status: "partial",
    icon: "📄",
    order: 3,
    dependsOn: ["await_contractual_form"],
  },
  {
    id: "send_contract_signature",
    name: "Enviar contrato para assinatura",
    description: "Envia o contrato gerado para assinatura eletrônica via Autentique.",
    enabled: true,
    status: "pending",
    icon: "✍️",
    order: 4,
    dependsOn: ["generate_contract"],
  },
  {
    id: "create_whatsapp_group",
    name: "Criar grupo WhatsApp do cliente",
    description: "Cria automaticamente o grupo de WhatsApp do projeto via Evolution API.",
    enabled: true,
    status: "partial",
    icon: "💬",
    order: 5,
  },
  {
    id: "add_participants",
    name: "Adicionar participantes ao grupo",
    description: "Adiciona os gestores e o cliente ao grupo recém-criado.",
    enabled: true,
    status: "pending",
    icon: "👥",
    order: 6,
    dependsOn: ["create_whatsapp_group"],
  },
  {
    id: "update_group_description",
    name: "Atualizar descrição do grupo",
    description: "Insere a descrição do projeto com variáveis dinâmicas no grupo.",
    enabled: false,
    status: "pending",
    icon: "✏️",
    order: 7,
    dependsOn: ["create_whatsapp_group"],
  },
  {
    id: "send_welcome_message",
    name: "Enviar mensagem de boas-vindas",
    description: "Envia a mensagem de boas-vindas personalizada no grupo do cliente.",
    enabled: true,
    status: "configured",
    icon: "🎉",
    order: 8,
    dependsOn: ["create_whatsapp_group"],
  },
  {
    id: "notify_internal_group",
    name: "Notificar grupo interno da agência",
    description: "Avisa o time interno que um novo cliente foi onboardado.",
    enabled: true,
    status: "configured",
    icon: "🔔",
    order: 9,
  },
  {
    id: "send_briefing_form",
    name: "Enviar formulário de briefing",
    description: "Envia o link do formulário de briefing para o cliente preencher.",
    enabled: true,
    status: "configured",
    icon: "📝",
    order: 10,
    dependsOn: ["create_whatsapp_group"],
  },
  {
    id: "await_briefing_form",
    name: "Aguardar preenchimento do briefing",
    description: "Pausa o fluxo até o cliente retornar o briefing completo.",
    enabled: true,
    status: "configured",
    icon: "⏳",
    order: 11,
    dependsOn: ["send_briefing_form"],
  },
  {
    id: "finalize_onboarding",
    name: "Finalizar onboarding",
    description: "Marca o onboarding como concluído e ativa o projeto no sistema.",
    enabled: true,
    status: "configured",
    icon: "✅",
    order: 12,
  },
];

// ─── Formulários padrão ───────────────────────────────────────────────────────

export const defaultFormTemplates: FormTemplate[] = [
  {
    id: "form_contractual_default",
    name: "Formulário Contratual Padrão",
    type: "contractual",
    isDefault: true,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
    fields: [
      {
        id: "f1",
        type: "text",
        label: "Nome completo",
        placeholder: "Ex: João da Silva",
        required: true,
        helpText: "",
        variableKey: "nome_cliente",
      },
      {
        id: "f2",
        type: "email",
        label: "E-mail",
        placeholder: "joao@empresa.com.br",
        required: true,
        helpText: "E-mail principal para contato.",
        variableKey: "email_cliente",
      },
      {
        id: "f3",
        type: "phone",
        label: "Telefone / WhatsApp",
        placeholder: "(11) 99999-9999",
        required: true,
        helpText: "",
        variableKey: "telefone_cliente",
      },
      {
        id: "f4",
        type: "cpf_cnpj",
        label: "CPF ou CNPJ",
        placeholder: "000.000.000-00",
        required: true,
        helpText: "Informe o CPF ou CNPJ para o contrato.",
        variableKey: "cpf_cnpj_cliente",
      },
      {
        id: "f5",
        type: "text",
        label: "Razão social",
        placeholder: "Ex: Empresa LTDA",
        required: false,
        helpText: "Preencha caso seja pessoa jurídica.",
        variableKey: "razao_social_cliente",
      },
      {
        id: "f6",
        type: "textarea",
        label: "Endereço completo",
        placeholder: "Rua, número, bairro, cidade - UF",
        required: true,
        helpText: "",
        variableKey: "endereco_cliente",
      },
      {
        id: "f7",
        type: "text",
        label: "Nome do projeto",
        placeholder: "Ex: Redesign do site",
        required: true,
        helpText: "",
        variableKey: "nome_projeto",
      },
      {
        id: "f8",
        type: "currency",
        label: "Valor do projeto",
        placeholder: "R$ 0,00",
        required: true,
        helpText: "",
        variableKey: "valor_projeto",
      },
      {
        id: "f9",
        type: "date",
        label: "Prazo de entrega",
        placeholder: "",
        required: true,
        helpText: "Data prevista para conclusão do projeto.",
        variableKey: "prazo_projeto",
      },
      {
        id: "f10",
        type: "textarea",
        label: "Observações contratuais",
        placeholder: "Informações adicionais relevantes para o contrato...",
        required: false,
        helpText: "",
        variableKey: "",
      },
    ],
  },
  {
    id: "form_briefing_default",
    name: "Formulário de Briefing Padrão",
    type: "briefing",
    isDefault: true,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
    fields: [
      {
        id: "b1",
        type: "textarea",
        label: "Objetivo do projeto",
        placeholder: "Descreva o que você espera alcançar com este projeto...",
        required: true,
        helpText: "",
        variableKey: "objetivo_projeto",
      },
      {
        id: "b2",
        type: "text",
        label: "Produto ou serviço",
        placeholder: "O que a empresa vende ou oferece?",
        required: true,
        helpText: "",
        variableKey: "produto_servico",
      },
      {
        id: "b3",
        type: "textarea",
        label: "Público-alvo",
        placeholder: "Descreva quem são seus clientes ideais...",
        required: true,
        helpText: "",
        variableKey: "publico_alvo",
      },
      {
        id: "b4",
        type: "select",
        label: "Tom de comunicação",
        placeholder: "Selecione...",
        required: true,
        helpText: "",
        variableKey: "tom_comunicacao",
        options: ["Profissional", "Descontraído", "Jovem", "Luxuoso", "Técnico", "Empático"],
      },
      {
        id: "b5",
        type: "textarea",
        label: "Referências visuais",
        placeholder: "Links ou descrições de sites/marcas que admira...",
        required: false,
        helpText: "",
        variableKey: "referencias_visuais",
      },
      {
        id: "b6",
        type: "textarea",
        label: "Concorrentes",
        placeholder: "Quem são os principais concorrentes?",
        required: false,
        helpText: "",
        variableKey: "concorrentes",
      },
      {
        id: "b7",
        type: "url",
        label: "Links importantes",
        placeholder: "https://",
        required: false,
        helpText: "Site atual, redes sociais, etc.",
        variableKey: "links_importantes",
      },
      {
        id: "b8",
        type: "textarea",
        label: "Acessos necessários",
        placeholder: "Ex: Google Analytics, Ads, hospedagem...",
        required: false,
        helpText: "",
        variableKey: "acessos_necessarios",
      },
      {
        id: "b9",
        type: "textarea",
        label: "Observações estratégicas",
        placeholder: "Informações adicionais relevantes para o projeto...",
        required: false,
        helpText: "",
        variableKey: "",
      },
      {
        id: "b10",
        type: "upload",
        label: "Upload de arquivos",
        placeholder: "Arraste arquivos ou clique para selecionar",
        required: false,
        helpText: "Logos, imagens de referência, documentos.",
        variableKey: "",
      },
    ],
  },
];

// ─── Variáveis do sistema ─────────────────────────────────────────────────────

export const defaultVariables: Variable[] = [
  {
    id: "v1",
    key: "nome_cliente",
    label: "Nome do Cliente",
    mockValue: "João da Silva",
    usedIn: ["Boas-vindas", "Contrato", "Descrição do grupo"],
    isSystem: true,
  },
  {
    id: "v2",
    key: "email_cliente",
    label: "E-mail do Cliente",
    mockValue: "joao@empresa.com",
    usedIn: ["Contrato"],
    isSystem: true,
  },
  {
    id: "v3",
    key: "telefone_cliente",
    label: "Telefone do Cliente",
    mockValue: "(11) 99999-9999",
    usedIn: ["Grupo WhatsApp"],
    isSystem: true,
  },
  {
    id: "v4",
    key: "cpf_cnpj_cliente",
    label: "CPF/CNPJ do Cliente",
    mockValue: "123.456.789-00",
    usedIn: ["Contrato"],
    isSystem: true,
  },
  {
    id: "v5",
    key: "razao_social_cliente",
    label: "Razão Social",
    mockValue: "Empresa Silva LTDA",
    usedIn: ["Contrato"],
    isSystem: true,
  },
  {
    id: "v6",
    key: "endereco_cliente",
    label: "Endereço do Cliente",
    mockValue: "Rua das Flores, 123 - São Paulo/SP",
    usedIn: ["Contrato"],
    isSystem: true,
  },
  {
    id: "v7",
    key: "nome_projeto",
    label: "Nome do Projeto",
    mockValue: "Redesign do Site",
    usedIn: ["Boas-vindas", "Descrição do grupo", "Briefing enviado"],
    isSystem: true,
  },
  {
    id: "v8",
    key: "valor_projeto",
    label: "Valor do Projeto",
    mockValue: "R$ 5.000,00",
    usedIn: ["Contrato"],
    isSystem: true,
  },
  {
    id: "v9",
    key: "prazo_projeto",
    label: "Prazo do Projeto",
    mockValue: "60 dias",
    usedIn: ["Contrato", "Boas-vindas"],
    isSystem: true,
  },
  {
    id: "v10",
    key: "objetivo_projeto",
    label: "Objetivo do Projeto",
    mockValue: "Aumentar conversões em 30%",
    usedIn: ["Briefing enviado"],
    isSystem: false,
  },
  {
    id: "v11",
    key: "publico_alvo",
    label: "Público-alvo",
    mockValue: "Empreendedores de 25-40 anos",
    usedIn: ["Briefing enviado"],
    isSystem: false,
  },
  {
    id: "v12",
    key: "tom_comunicacao",
    label: "Tom de Comunicação",
    mockValue: "Profissional",
    usedIn: ["Briefing enviado"],
    isSystem: false,
  },
  {
    id: "v13",
    key: "produto_servico",
    label: "Produto ou Serviço",
    mockValue: "Software SaaS",
    usedIn: ["Briefing enviado"],
    isSystem: false,
  },
  {
    id: "v14",
    key: "referencias_visuais",
    label: "Referências Visuais",
    mockValue: "Linear.app, Vercel.com",
    usedIn: ["Briefing enviado"],
    isSystem: false,
  },
  {
    id: "v15",
    key: "concorrentes",
    label: "Concorrentes",
    mockValue: "Empresa A, Empresa B",
    usedIn: ["Briefing enviado"],
    isSystem: false,
  },
  {
    id: "v16",
    key: "links_importantes",
    label: "Links Importantes",
    mockValue: "https://meusite.com.br",
    usedIn: ["Briefing enviado"],
    isSystem: false,
  },
  {
    id: "v17",
    key: "acessos_necessarios",
    label: "Acessos Necessários",
    mockValue: "Google Ads, Analytics",
    usedIn: ["Briefing enviado"],
    isSystem: false,
  },
  {
    id: "v18",
    key: "data_inicio",
    label: "Data de Início",
    mockValue: "01/02/2025",
    usedIn: ["Contrato", "Boas-vindas"],
    isSystem: true,
  },
  {
    id: "v19",
    key: "nome_agencia",
    label: "Nome da Agência",
    mockValue: "Agência Prime",
    usedIn: ["Contrato", "Boas-vindas", "Grupo WhatsApp"],
    isSystem: true,
  },
];

// ─── Mensagens padrão ─────────────────────────────────────────────────────────

export const defaultMessages: OnboardingMessage[] = [
  {
    id: "msg_send_contractual",
    name: "Envio do Formulário Contratual",
    description: "Enviada ao cliente com o link para preencher os dados contratuais.",
    icon: "📋",
    body: `Olá, *{{nome_cliente}}*! 👋

Seja bem-vindo(a) à *{{nome_agencia}}*! Estamos muito animados para trabalhar juntos no projeto _{{nome_projeto}}_.

Para darmos início, preciso que você preencha o formulário com seus dados contratuais. Isso levará apenas alguns minutos:

📋 *Link do formulário:*
👉 [Clique aqui para preencher]

Qualquer dúvida, é só me chamar por aqui! 😊`,
  },
  {
    id: "msg_welcome",
    name: "Boas-vindas no Grupo do Cliente",
    description: "Primeira mensagem enviada no grupo de WhatsApp do cliente.",
    icon: "🎉",
    body: `🎉 *Bem-vindo(a) ao grupo do projeto {{nome_projeto}}, {{nome_cliente}}!*

Este grupo será nosso canal de comunicação direto ao longo de toda a jornada.

📅 *Início:* {{data_inicio}}
⏱ *Prazo:* {{prazo_projeto}}
🏢 *Responsável:* {{nome_agencia}}

Vamos construir algo incrível juntos! 🚀`,
  },
  {
    id: "msg_contract_sent",
    name: "Contrato Enviado",
    description: "Notificação de que o contrato foi enviado para assinatura.",
    icon: "📄",
    body: `Olá, *{{nome_cliente}}*! 👋

Seu contrato referente ao projeto _{{nome_projeto}}_ está pronto para assinatura.

✍️ Acesse o link abaixo para assinar digitalmente:
👉 [Assinar contrato]

O processo é 100% digital e leva menos de 1 minuto. ⚡

Qualquer dúvida, estou à disposição!`,
  },
  {
    id: "msg_contract_signed",
    name: "Contrato Assinado",
    description: "Confirmação de que o contrato foi assinado com sucesso.",
    icon: "✅",
    body: `✅ *Ótima notícia, {{nome_cliente}}!*

Seu contrato foi assinado com sucesso! Guardei uma cópia e vou enviar por e-mail.

Agora vamos para a próxima etapa: o preenchimento do *briefing* do projeto para que possamos entender tudo que você precisa.

Fique atento(a) à próxima mensagem! 🚀`,
  },
  {
    id: "msg_send_briefing",
    name: "Envio do Formulário de Briefing",
    description: "Enviada ao cliente com o link para preencher o briefing do projeto.",
    icon: "📝",
    body: `Olá, *{{nome_cliente}}*! 📝

Chegou a hora de você nos contar tudo sobre o projeto _{{nome_projeto}}_!

Criei um formulário de briefing para capturar suas expectativas, referências e objetivos:

📝 *Link do briefing:*
👉 [Clique aqui para preencher]

Quanto mais detalhes você compartilhar, melhor será o resultado final! 💎`,
  },
  {
    id: "msg_internal_notify",
    name: "Notificação Interna da Agência",
    description:
      "Mensagem enviada ao grupo interno da agência quando um novo cliente é onboardado.",
    icon: "🔔",
    body: `🔔 *Novo cliente onboardado!*

*Cliente:* {{nome_cliente}}
*Projeto:* {{nome_projeto}}
*Valor:* {{valor_projeto}}
*Prazo:* {{prazo_projeto}}

O onboarding foi iniciado com sucesso. Acompanhe o andamento no painel! 📊`,
  },
  {
    id: "msg_finalize",
    name: "Finalização do Onboarding",
    description: "Mensagem final enviada ao cliente marcando o fim do onboarding.",
    icon: "🏁",
    body: `🏁 *Onboarding concluído, {{nome_cliente}}!*

Tudo configurado e pronto para decolar! ✈️

✅ Dados contratuais coletados
✅ Contrato assinado
✅ Grupo criado e configurado
✅ Briefing preenchido

Agora a equipe da *{{nome_agencia}}* já pode começar a trabalhar. Entraremos em contato em breve com as próximas etapas!

Seja bem-vindo(a) à família! 🎉`,
  },
];

// ─── Estado inicial consolidado ───────────────────────────────────────────────

export const initialOnboardingState: OnboardingWorkspaceState = {
  flowSteps: defaultFlowSteps,
  formTemplates: defaultFormTemplates,
  variables: defaultVariables,
  messages: defaultMessages,
};
