import { AgencyTemplate, TemplateCategory } from './templateTypes';

export interface CategoryOption {
  value: TemplateCategory;
  label: string;
  icon: string; // name of icon
  color: string;
}

export const templateCategories: CategoryOption[] = [
  { value: 'paid_traffic', label: 'Tráfego Pago', icon: 'trending-up', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  { value: 'social_media', label: 'Social Media', icon: 'instagram', color: 'text-pink-500 bg-pink-500/10 border-pink-500/20' },
  { value: 'launch', label: 'Lançamento', icon: 'rocket', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
  { value: 'branding', label: 'Rebranding', icon: 'palette', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
  { value: 'web_design', label: 'Desenvolvimento Web', icon: 'globe', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  { value: 'creatives', label: 'Criativos', icon: 'video', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
  { value: 'onboarding', label: 'Onboarding', icon: 'user-check', color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20' },
  { value: 'consulting', label: 'Consultoria', icon: 'users', color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' },
  { value: 'custom', label: 'Personalizado', icon: 'sliders', color: 'text-slate-500 bg-slate-500/10 border-slate-500/20' }
];

export const roleOptions = [
  { value: 'Atendimento', label: 'Atendimento' },
  { value: 'Gestor de tráfego', label: 'Gestor de Tráfego' },
  { value: 'Designer', label: 'Designer' },
  { value: 'Copywriter', label: 'Copywriter' },
  { value: 'Social Media', label: 'Social Media' },
  { value: 'Editor de vídeo', label: 'Editor de Vídeo' },
  { value: 'Desenvolvedor', label: 'Desenvolvedor' },
  { value: 'Gestor de projeto', label: 'Gestor de Projeto' },
  { value: 'Financeiro', label: 'Financeiro' }
];

export const mockAgencyTemplates: AgencyTemplate[] = [
  {
    id: 'tmpl-1',
    name: 'Gestão de Tráfego Mensal',
    description: 'Fluxo operacional padrão para setup, planejamento e otimização contínua de campanhas de tráfego pago (Meta Ads e Google Ads).',
    category: 'paid_traffic',
    status: 'active',
    linkedContractTitle: 'Gestão de tráfego mensal',
    lastEditedAt: '2026-05-20T10:00:00.000Z',
    automation: {
      enabled: true,
      trigger: 'contract_signed',
      createProject: true,
      createTasks: true,
      assignUsers: true,
      notifyInternalGroup: true,
      requireManualReview: false
    },
    columns: [
      { id: 'col-t1', title: 'A fazer', position: 1, color: 'bg-slate-400' },
      { id: 'col-t2', title: 'Planejamento', position: 2, color: 'bg-sky-500' },
      { id: 'col-t3', title: 'Criação', position: 3, color: 'bg-indigo-500' },
      { id: 'col-t4', title: 'Revisão / Aprovação', position: 4, color: 'bg-amber-500' },
      { id: 'col-t5', title: 'No Ar', position: 5, color: 'bg-emerald-500' },
      { id: 'col-t6', title: 'Finalizado', position: 6, color: 'bg-green-500', isFinalColumn: true }
    ],
    tasks: [
      {
        id: 'tmpl-t1-1',
        title: 'Briefing de Campanha',
        description: 'Reunião de alinhamento ou envio de formulário para mapear objetivos, verba disponível e principais canais.',
        columnId: 'col-t2',
        priority: 'high',
        assigneeRule: { type: 'role', value: 'Atendimento', fallback: 'manager' },
        relativeDueDate: { amount: 1, unit: 'days', direction: 'after', base: 'contract_signed_at' },
        checklist: [
          { id: 'chk-t1-1-1', title: 'Preencher verba por canal' },
          { id: 'chk-t1-1-2', title: 'Coletar acessos ao Gerenciador de Anúncios' },
          { id: 'chk-t1-1-3', title: 'Mapear concorrentes e referências' }
        ],
        dependencies: [],
        tags: ['Alinhamento', 'Briefing'],
        isClientVisible: true
      },
      {
        id: 'tmpl-t1-2',
        title: 'Setup do Pixel & Conversões',
        description: 'Instalar e testar tags do Google Analytics, Meta Pixel e API de Conversão no site do cliente.',
        columnId: 'col-t2',
        priority: 'urgent',
        assigneeRule: { type: 'role', value: 'Gestor de tráfego', fallback: 'manager' },
        relativeDueDate: { amount: 2, unit: 'days', direction: 'after', base: 'contract_signed_at' },
        checklist: [
          { id: 'chk-t1-2-1', title: 'Instalar pixel da Meta no cabeçalho' },
          { id: 'chk-t1-2-2', title: 'Verificar conversões na API de Conversão' },
          { id: 'chk-t1-2-3', title: 'Configurar Tag Manager se aplicável' }
        ],
        dependencies: ['tmpl-t1-1'],
        tags: ['Setup', 'Técnico'],
        isClientVisible: false
      },
      {
        id: 'tmpl-t1-3',
        title: 'Planejamento de Públicos e Funil',
        description: 'Estruturação dos públicos de remarketing, semelhantes (lookalike) e interesses, além da jornada de funil.',
        columnId: 'col-t2',
        priority: 'medium',
        assigneeRule: { type: 'role', value: 'Gestor de tráfego', fallback: 'manager' },
        relativeDueDate: { amount: 3, unit: 'days', direction: 'after', base: 'contract_signed_at' },
        checklist: [
          { id: 'chk-t1-3-1', title: 'Criar públicos de visitantes (30/60/90 dias)' },
          { id: 'chk-t1-3-2', title: 'Criar público de compradores/leads passados' },
          { id: 'chk-t1-3-3', title: 'Mapear termos de busca negativos no Google' }
        ],
        dependencies: ['tmpl-t1-1'],
        tags: ['Estratégia'],
        isClientVisible: false
      },
      {
        id: 'tmpl-t1-4',
        title: 'Roteiros e Copys para Anúncios',
        description: 'Desenvolvimento das headlines, textos principais e roteiros para vídeos rápidos focados em conversão.',
        columnId: 'col-t3',
        priority: 'high',
        assigneeRule: { type: 'role', value: 'Copywriter', fallback: 'manager' },
        relativeDueDate: { amount: 4, unit: 'days', direction: 'after', base: 'contract_signed_at' },
        checklist: [
          { id: 'chk-t1-4-1', title: 'Escrever 3 variações de anúncios de topo' },
          { id: 'chk-t1-4-2', title: 'Escrever 2 variações de anúncio de remarketing' },
          { id: 'chk-t1-4-3', title: 'Criar roteiro para reels / stories' }
        ],
        dependencies: ['tmpl-t1-1'],
        tags: ['Copywriting'],
        isClientVisible: true
      },
      {
        id: 'tmpl-t1-5',
        title: 'Criação de Peças de Design',
        description: 'Criação das imagens estáticas, carrosséis e capas para os vídeos baseados no planejamento de anúncios.',
        columnId: 'col-t3',
        priority: 'medium',
        assigneeRule: { type: 'role', value: 'Designer', fallback: 'manager' },
        relativeDueDate: { amount: 6, unit: 'days', direction: 'after', base: 'contract_signed_at' },
        checklist: [
          { id: 'chk-t1-5-1', title: 'Criar 3 artes no formato Feed (1:1)' },
          { id: 'chk-t1-5-2', title: 'Criar 3 artes no formato Stories/Reels (9:16)' }
        ],
        dependencies: ['tmpl-t1-4'],
        tags: ['Design', 'Criativos'],
        isClientVisible: false
      },
      {
        id: 'tmpl-t1-6',
        title: 'Aprovação Interna das Peças',
        description: 'Revisão dos criativos e copys pela gestão do projeto para garantir conformidade com o briefing.',
        columnId: 'col-t4',
        priority: 'low',
        assigneeRule: { type: 'role', value: 'Gestor de projeto', fallback: 'manager' },
        relativeDueDate: { amount: 7, unit: 'days', direction: 'after', base: 'contract_signed_at' },
        checklist: [
          { id: 'chk-t1-6-1', title: 'Revisar ortografia das copys' },
          { id: 'chk-t1-6-2', title: 'Validar aplicação correta da identidade visual do cliente' }
        ],
        dependencies: ['tmpl-t1-5'],
        tags: ['Revisão'],
        isClientVisible: false
      },
      {
        id: 'tmpl-t1-7',
        title: 'Aprovação das Peças pelo Cliente',
        description: 'Enviar as peças e copys para aprovação do cliente antes de subir as campanhas.',
        columnId: 'col-t4',
        priority: 'high',
        assigneeRule: { type: 'role', value: 'Atendimento', fallback: 'manager' },
        relativeDueDate: { amount: 8, unit: 'days', direction: 'after', base: 'contract_signed_at' },
        checklist: [
          { id: 'chk-t1-7-1', title: 'Enviar link do board de aprovação' },
          { id: 'chk-t1-7-2', title: 'Cobrar feedback se não respondido em 24h' }
        ],
        dependencies: ['tmpl-t1-6'],
        tags: ['Cliente', 'Aprovação'],
        isClientVisible: true
      },
      {
        id: 'tmpl-t1-8',
        title: 'Subir Campanhas no Gerenciador',
        description: 'Subir criativos, copys, linkar públicos e definir verbas no Gerenciador de Anúncios (Facebook / Google).',
        columnId: 'col-t1',
        priority: 'high',
        assigneeRule: { type: 'role', value: 'Gestor de tráfego', fallback: 'manager' },
        relativeDueDate: { amount: 9, unit: 'days', direction: 'after', base: 'contract_signed_at' },
        checklist: [
          { id: 'chk-t1-8-1', title: 'Configurar públicos personalizados e exclusões' },
          { id: 'chk-t1-8-2', title: 'Subir criativos e inserir copys aprovadas' },
          { id: 'chk-t1-8-3', title: 'Inserir parâmetros de UTM para rastreamento' }
        ],
        dependencies: ['tmpl-t1-7', 'tmpl-t1-2'],
        tags: ['Execução', 'Anúncios'],
        isClientVisible: false
      },
      {
        id: 'tmpl-t1-9',
        title: 'Revisão da Configuração de Campanhas',
        description: 'Double-check geral nas campanhas subidas antes de colocar para rodar.',
        columnId: 'col-t4',
        priority: 'medium',
        assigneeRule: { type: 'role', value: 'Gestor de projeto', fallback: 'manager' },
        relativeDueDate: { amount: 10, unit: 'days', direction: 'after', base: 'contract_signed_at' },
        checklist: [
          { id: 'chk-t1-9-1', title: 'Verificar se os links e UTMs estão corretos' },
          { id: 'chk-t1-9-2', title: 'Confirmar orçamento diário e data de término' }
        ],
        dependencies: ['tmpl-t1-8'],
        tags: ['Qualidade'],
        isClientVisible: false
      },
      {
        id: 'tmpl-t1-10',
        title: 'Primeiro Relatório Parcial',
        description: 'Extração dos dados de primeiros 5 dias de veiculação das campanhas.',
        columnId: 'col-t5',
        priority: 'medium',
        assigneeRule: { type: 'role', value: 'Gestor de tráfego', fallback: 'manager' },
        relativeDueDate: { amount: 15, unit: 'days', direction: 'after', base: 'contract_signed_at' },
        checklist: [
          { id: 'chk-t1-10-1', title: 'Mapear custo por clique (CPC) e custo por mil impressões (CPM)' },
          { id: 'chk-t1-10-2', title: 'Indicar campanhas e criativos com melhor desempenho' }
        ],
        dependencies: ['tmpl-t1-9'],
        tags: ['Relatórios'],
        isClientVisible: true
      },
      {
        id: 'tmpl-t1-11',
        title: 'Reunião de Resultados Mensal',
        description: 'Agendamento e realização de videoconferência para apresentar as métricas e sugerir melhorias.',
        columnId: 'col-t5',
        priority: 'high',
        assigneeRule: { type: 'role', value: 'Atendimento', fallback: 'manager' },
        relativeDueDate: { amount: 28, unit: 'days', direction: 'after', base: 'contract_signed_at' },
        checklist: [
          { id: 'chk-t1-11-1', title: 'Montar apresentação de slides de resultados' },
          { id: 'chk-t1-11-2', title: 'Enviar convite do Google Meet' }
        ],
        dependencies: ['tmpl-t1-10'],
        tags: ['Alinhamento', 'Reunião'],
        isClientVisible: true
      },
      {
        id: 'tmpl-t1-12',
        title: 'Otimização de Lances e Públicos',
        description: 'Fazer ajustes finos de lance, desativar criativos saturados e testar novos públicos.',
        columnId: 'col-t6',
        priority: 'medium',
        assigneeRule: { type: 'role', value: 'Gestor de tráfego', fallback: 'manager' },
        relativeDueDate: { amount: 20, unit: 'days', direction: 'after', base: 'contract_signed_at' },
        checklist: [
          { id: 'chk-t1-12-1', title: 'Desativar criativos com frequência > 3 e CTR baixo' },
          { id: 'chk-t1-12-2', title: 'Redirecionar verba para público vencedor' }
        ],
        dependencies: ['tmpl-t1-9'],
        tags: ['Otimização'],
        isClientVisible: false
      }
    ]
  },
  {
    id: 'tmpl-2',
    name: 'Lançamento de Infoproduto 30 Dias',
    description: 'Processo completo para lançamentos de infoprodutos (Fórmula de Lançamento / Lançamento Interno). Do kickoff à abertura do carrinho.',
    category: 'launch',
    status: 'active',
    linkedContractTitle: 'Projeto de identidade visual', // map to one existing mock contract for integration demonstration
    lastEditedAt: '2026-05-21T14:30:00.000Z',
    automation: {
      enabled: true,
      trigger: 'contract_signed',
      createProject: true,
      createTasks: true,
      assignUsers: true,
      notifyInternalGroup: true,
      requireManualReview: true
    },
    columns: [
      { id: 'col-l1', title: 'Backlog', position: 1, color: 'bg-slate-400' },
      { id: 'col-l2', title: 'Copywriting', position: 2, color: 'bg-pink-500' },
      { id: 'col-l3', title: 'Design & Web', position: 3, color: 'bg-purple-500' },
      { id: 'col-l4', title: 'Setup Técnico', position: 4, color: 'bg-orange-500' },
      { id: 'col-l5', title: 'Captação & Tráfego', position: 5, color: 'bg-blue-500' },
      { id: 'col-l6', title: 'Vendas & Finalização', position: 6, color: 'bg-green-500', isFinalColumn: true }
    ],
    tasks: [
      {
        id: 'tmpl-t2-1',
        title: 'Kickoff de Lançamento',
        description: 'Reunião estratégica com especialista para alinhar promessa, datas e modelo de funil.',
        columnId: 'col-l1',
        priority: 'high',
        assigneeRule: { type: 'role', value: 'Gestor de projeto', fallback: 'manager' },
        relativeDueDate: { amount: 1, unit: 'days', direction: 'after', base: 'contract_signed_at' },
        checklist: [
          { id: 'chk-t2-1-1', title: 'Validar calendário das datas de captação, aquecimento e abertura' },
          { id: 'chk-t2-1-2', title: 'Preencher mapa mental do lançamento' }
        ],
        dependencies: [],
        tags: ['Estratégia'],
        isClientVisible: true
      },
      {
        id: 'tmpl-t2-2',
        title: 'Definição de Avatar e Oferta',
        description: 'Pesquisar o público, desenhar a persona principal e estruturar a oferta irresistível com bônus.',
        columnId: 'col-l2',
        priority: 'high',
        assigneeRule: { type: 'role', value: 'Copywriter', fallback: 'manager' },
        relativeDueDate: { amount: 2, unit: 'days', direction: 'after', base: 'contract_signed_at' },
        checklist: [
          { id: 'chk-t2-2-1', title: 'Escrever Big Idea do lançamento' },
          { id: 'chk-t2-2-2', title: 'Mapear 5 principais dores e 5 principais sonhos' }
        ],
        dependencies: ['tmpl-t2-1'],
        tags: ['Copywriting'],
        isClientVisible: false
      },
      {
        id: 'tmpl-t2-3',
        title: 'Roteiro dos Vídeos de CPL',
        description: 'Escrever os roteiros completos para os 3 vídeos de conteúdo de pré-lançamento ou roteiro do webinário.',
        columnId: 'col-l2',
        priority: 'high',
        assigneeRule: { type: 'role', value: 'Copywriter', fallback: 'manager' },
        relativeDueDate: { amount: 4, unit: 'days', direction: 'after', base: 'contract_signed_at' },
        checklist: [
          { id: 'chk-t2-3-1', title: 'Roteiro CPL 1: A Oportunidade' },
          { id: 'chk-t2-3-2', title: 'Roteiro CPL 2: A Transformação' },
          { id: 'chk-t2-3-3', title: 'Roteiro CPL 3: O Atalho' }
        ],
        dependencies: ['tmpl-t2-2'],
        tags: ['Copywriting'],
        isClientVisible: true
      },
      {
        id: 'tmpl-t2-4',
        title: 'Layout da Landing Page de Captura',
        description: 'Design de alta conversão para registro no evento, feito no Figma.',
        columnId: 'col-l3',
        priority: 'high',
        assigneeRule: { type: 'role', value: 'Designer', fallback: 'manager' },
        relativeDueDate: { amount: 6, unit: 'days', direction: 'after', base: 'contract_signed_at' },
        checklist: [
          { id: 'chk-t2-4-1', title: 'Layout versão desktop' },
          { id: 'chk-t2-4-2', title: 'Layout versão mobile' }
        ],
        dependencies: ['tmpl-t2-2'],
        tags: ['Design', 'Figma'],
        isClientVisible: true
      },
      {
        id: 'tmpl-t2-5',
        title: 'Gravação dos Vídeos de CPL',
        description: 'Orientar o especialista na gravação e receber os arquivos brutos.',
        columnId: 'col-l1',
        priority: 'medium',
        assigneeRule: { type: 'specific_user', value: 'CM', fallback: 'manager' }, // specific user "Caio Mendes"
        relativeDueDate: { amount: 8, unit: 'days', direction: 'after', base: 'contract_signed_at' },
        checklist: [
          { id: 'chk-t2-5-1', title: 'Enviar guia de gravação e cenário' },
          { id: 'chk-t2-5-2', title: 'Fazer download dos arquivos brutos no Drive' }
        ],
        dependencies: ['tmpl-t2-3'],
        tags: ['Audiovisual'],
        isClientVisible: true
      },
      {
        id: 'tmpl-t2-6',
        title: 'Implementação da Landing Page',
        description: 'Codificar ou criar a LP de captura no WordPress/Elementor ou React.',
        columnId: 'col-l4',
        priority: 'urgent',
        assigneeRule: { type: 'role', value: 'Desenvolvedor', fallback: 'manager' },
        relativeDueDate: { amount: 9, unit: 'days', direction: 'after', base: 'contract_signed_at' },
        checklist: [
          { id: 'chk-t2-6-1', title: 'Configurar domínio e SSL' },
          { id: 'chk-t2-6-2', title: 'Integrar formulário de captura' },
          { id: 'chk-t2-6-3', title: 'Otimizar velocidade da página' }
        ],
        dependencies: ['tmpl-t2-4'],
        tags: ['Desenvolvimento', 'Web'],
        isClientVisible: false
      },
      {
        id: 'tmpl-t2-7',
        title: 'Edição dos Vídeos de CPL',
        description: 'Inserir cortes, legendas dinâmicas, trilha sonora e imagens de apoio para reter atenção.',
        columnId: 'col-l3',
        priority: 'medium',
        assigneeRule: { type: 'role', value: 'Editor de vídeo', fallback: 'manager' },
        relativeDueDate: { amount: 10, unit: 'days', direction: 'after', base: 'contract_signed_at' },
        checklist: [
          { id: 'chk-t2-7-1', title: 'Editar CPL 1 (máx 15 min)' },
          { id: 'chk-t2-7-2', title: 'Editar CPL 2 e 3' }
        ],
        dependencies: ['tmpl-t2-5'],
        tags: ['Edição', 'Vídeo'],
        isClientVisible: false
      },
      {
        id: 'tmpl-t2-8',
        title: 'Configuração do ActiveCampaign',
        description: 'Criar as tags de leads, lista do evento e cadastrar a sequência automatizada de e-mails.',
        columnId: 'col-l4',
        priority: 'high',
        assigneeRule: { type: 'role', value: 'Gestor de projeto', fallback: 'manager' },
        relativeDueDate: { amount: 12, unit: 'days', direction: 'after', base: 'contract_signed_at' },
        checklist: [
          { id: 'chk-t2-8-1', title: 'Importar lista de contatos antigos (se houver)' },
          { id: 'chk-t2-8-2', title: 'Cadastrar 5 e-mails de lembrete' },
          { id: 'chk-t2-8-3', title: 'Testar fluxo enviando e-mail de teste' }
        ],
        dependencies: ['tmpl-t2-6'],
        tags: ['E-mail', 'Setup'],
        isClientVisible: false
      },
      {
        id: 'tmpl-t2-9',
        title: 'Configuração do Pixel e Checkout',
        description: 'Gerar o pixel da Hotmart/Kiwify, instalar na página de vendas e mapear eventos de InitiateCheckout.',
        columnId: 'col-l4',
        priority: 'high',
        assigneeRule: { type: 'role', value: 'Desenvolvedor', fallback: 'manager' },
        relativeDueDate: { amount: 13, unit: 'days', direction: 'after', base: 'contract_signed_at' },
        checklist: [
          { id: 'chk-t2-9-1', title: 'Cadastrar produto na plataforma de infoprodutos' },
          { id: 'chk-t2-9-2', title: 'Configurar webhook de vendas' }
        ],
        dependencies: ['tmpl-t2-6'],
        tags: ['Financeiro', 'Plataforma'],
        isClientVisible: false
      },
      {
        id: 'tmpl-t2-10',
        title: 'Criação de Anúncios de Captação',
        description: 'Elaborar as imagens e vídeos curtos convidando para o evento ao vivo.',
        columnId: 'col-l3',
        priority: 'medium',
        assigneeRule: { type: 'role', value: 'Designer', fallback: 'manager' },
        relativeDueDate: { amount: 14, unit: 'days', direction: 'after', base: 'contract_signed_at' },
        checklist: [
          { id: 'chk-t2-10-1', title: 'Criar 3 criativos estáticos' },
          { id: 'chk-t2-10-2', title: 'Montar roteiro curto para story' }
        ],
        dependencies: ['tmpl-t2-4'],
        tags: ['Criativos', 'Design'],
        isClientVisible: false
      },
      {
        id: 'tmpl-t2-11',
        title: 'Subir Campanhas de Captação',
        description: 'Colocar os criativos de captação no ar visando acumular leads na página de captura.',
        columnId: 'col-l5',
        priority: 'high',
        assigneeRule: { type: 'role', value: 'Gestor de tráfego', fallback: 'manager' },
        relativeDueDate: { amount: 15, unit: 'days', direction: 'after', base: 'contract_signed_at' },
        checklist: [
          { id: 'chk-t2-11-1', title: 'Definir limite de CPL de segurança' },
          { id: 'chk-t2-11-2', title: 'Configurar campanhas com objetivo de Conversão (Lead)' }
        ],
        dependencies: ['tmpl-t2-10', 'tmpl-t2-6'],
        tags: ['Ads', 'Captação'],
        isClientVisible: false
      },
      {
        id: 'tmpl-t2-12',
        title: 'Disparo de E-mails de Lembrete',
        description: 'Monitorar e disparar os e-mails e mensagens de WhatsApp de contagem regressiva para o evento.',
        columnId: 'col-l5',
        priority: 'high',
        assigneeRule: { type: 'role', value: 'Gestor de projeto', fallback: 'manager' },
        relativeDueDate: { amount: 25, unit: 'days', direction: 'after', base: 'contract_signed_at' },
        checklist: [
          { id: 'chk-t2-12-1', title: 'Disparar e-mail D-7' },
          { id: 'chk-t2-12-2', title: 'Disparar e-mail 1h antes do evento' }
        ],
        dependencies: ['tmpl-t2-8'],
        tags: ['Comunicação'],
        isClientVisible: true
      },
      {
        id: 'tmpl-t2-13',
        title: 'Abertura de Carrinho & Suporte',
        description: 'Ativação dos links de checkout, disparo do e-mail de vendas e suporte aos compradores na página de checkout.',
        columnId: 'col-l6',
        priority: 'urgent',
        assigneeRule: { type: 'role', value: 'Atendimento', fallback: 'manager' },
        relativeDueDate: { amount: 28, unit: 'days', direction: 'after', base: 'contract_signed_at' },
        checklist: [
          { id: 'chk-t2-13-1', title: 'Ativar chat de suporte no checkout' },
          { id: 'chk-t2-13-2', title: 'Checar se primeiro pagamento aprovado entrou no gateway' },
          { id: 'chk-t2-13-3', title: 'Enviar mensagens no grupo de alunos' }
        ],
        dependencies: ['tmpl-t2-9', 'tmpl-t2-12'],
        tags: ['Vendas', 'Lançamento'],
        isClientVisible: true
      }
    ]
  },
  {
    id: 'tmpl-3',
    name: 'Social Media Mensal',
    description: 'Gerenciamento completo de redes sociais: pauta, redação, design, aprovação do cliente e agendamento de postagens.',
    category: 'social_media',
    status: 'active',
    linkedContractTitle: 'Social media trimestral',
    lastEditedAt: '2026-05-22T09:15:00.000Z',
    automation: {
      enabled: false,
      trigger: 'manual',
      createProject: true,
      createTasks: true,
      assignUsers: false,
      notifyInternalGroup: false,
      requireManualReview: true
    },
    columns: [
      { id: 'col-s1', title: 'Idéias / Inspirações', position: 1, color: 'bg-slate-500' },
      { id: 'col-s2', title: 'Pauta & Legenda', position: 2, color: 'bg-pink-500' },
      { id: 'col-s3', title: 'Produção Visual', position: 3, color: 'bg-purple-500' },
      { id: 'col-s4', title: 'Aprovação Interna', position: 4, color: 'bg-yellow-500' },
      { id: 'col-s5', title: 'Aprovação Cliente', position: 5, color: 'bg-orange-500' },
      { id: 'col-s6', title: 'Agendado', position: 6, color: 'bg-green-500', isFinalColumn: true }
    ],
    tasks: [
      {
        id: 'tmpl-t3-1',
        title: 'Reunião de Pauta Mensal',
        description: 'Reunião com o cliente para levantar temas que serão abordados no mês e datas comemorativas.',
        columnId: 'col-s2',
        priority: 'high',
        assigneeRule: { type: 'role', value: 'Social Media', fallback: 'manager' },
        relativeDueDate: { amount: 1, unit: 'days', direction: 'after', base: 'contract_signed_at' },
        checklist: [
          { id: 'chk-t3-1-1', title: 'Definir 4 linhas editoriais do mês' },
          { id: 'chk-t3-1-2', title: 'Mapear datas comemorativas do setor' }
        ],
        dependencies: [],
        tags: ['Alinhamento'],
        isClientVisible: true
      },
      {
        id: 'tmpl-t3-2',
        title: 'Criação do Calendário Editorial',
        description: 'Preencher a planilha de planejamento com os títulos das postagens, formatos (carrossel, reels, feed) e datas.',
        columnId: 'col-s2',
        priority: 'medium',
        assigneeRule: { type: 'role', value: 'Social Media', fallback: 'manager' },
        relativeDueDate: { amount: 3, unit: 'days', direction: 'after', base: 'contract_signed_at' },
        checklist: [
          { id: 'chk-t3-2-1', title: 'Montar grade com 12 posts' },
          { id: 'chk-t3-2-2', title: 'Mapear canais (Insta, Linkedin, etc.)' }
        ],
        dependencies: ['tmpl-t3-1'],
        tags: ['Planejamento'],
        isClientVisible: true
      },
      {
        id: 'tmpl-t3-3',
        title: 'Produção de Copys/Legendas',
        description: 'Redação das legendas de todas as publicações, hashtags e chamadas de ação (CTA).',
        columnId: 'col-s2',
        priority: 'medium',
        assigneeRule: { type: 'role', value: 'Social Media', fallback: 'manager' },
        relativeDueDate: { amount: 5, unit: 'days', direction: 'after', base: 'contract_signed_at' },
        checklist: [
          { id: 'chk-t3-3-1', title: 'Escrever legendas dos 12 posts' },
          { id: 'chk-t3-3-2', title: 'Mapear hashtags por post' }
        ],
        dependencies: ['tmpl-t3-2'],
        tags: ['Escrita'],
        isClientVisible: false
      },
      {
        id: 'tmpl-t3-4',
        title: 'Produção de Artes e Criativos',
        description: 'Design gráfico dos carrosséis, posts em imagem única e infográficos no Illustrator ou Canva.',
        columnId: 'col-s3',
        priority: 'high',
        assigneeRule: { type: 'role', value: 'Designer', fallback: 'manager' },
        relativeDueDate: { amount: 8, unit: 'days', direction: 'after', base: 'contract_signed_at' },
        checklist: [
          { id: 'chk-t3-4-1', title: 'Desenvolver identidade do mês' },
          { id: 'chk-t3-4-2', title: 'Montar criativos visuais' }
        ],
        dependencies: ['tmpl-t3-2'],
        tags: ['Design'],
        isClientVisible: false
      },
      {
        id: 'tmpl-t3-5',
        title: 'Edição de Reels/Shorts',
        description: 'Fazer cortes, adicionar efeitos, música em alta e transições nos vídeos curtos enviados pelo cliente.',
        columnId: 'col-s3',
        priority: 'medium',
        assigneeRule: { type: 'role', value: 'Editor de vídeo', fallback: 'manager' },
        relativeDueDate: { amount: 10, unit: 'days', direction: 'after', base: 'contract_signed_at' },
        checklist: [
          { id: 'chk-t3-5-1', title: 'Editar 4 Reels selecionados' },
          { id: 'chk-t3-5-2', title: 'Adicionar legenda automática' }
        ],
        dependencies: ['tmpl-t3-1'],
        tags: ['Edição', 'Vídeo'],
        isClientVisible: false
      },
      {
        id: 'tmpl-t3-6',
        title: 'Aprovação Interna do Cronograma',
        description: 'Revisão ortográfica e de design de todas as peças e copys antes do envio ao cliente.',
        columnId: 'col-s4',
        priority: 'low',
        assigneeRule: { type: 'role', value: 'Gestor de projeto', fallback: 'manager' },
        relativeDueDate: { amount: 11, unit: 'days', direction: 'after', base: 'contract_signed_at' },
        checklist: [
          { id: 'chk-t3-6-1', title: 'Verificar se o design condiz com a pauta' }
        ],
        dependencies: ['tmpl-t3-3', 'tmpl-t3-4', 'tmpl-t3-5'],
        tags: ['Revisão'],
        isClientVisible: false
      },
      {
        id: 'tmpl-t3-7',
        title: 'Envio para Aprovação do Cliente',
        description: 'Enviar o cronograma completo para o cliente aprovar na plataforma.',
        columnId: 'col-s5',
        priority: 'high',
        assigneeRule: { type: 'role', value: 'Atendimento', fallback: 'manager' },
        relativeDueDate: { amount: 12, unit: 'days', direction: 'after', base: 'contract_signed_at' },
        checklist: [
          { id: 'chk-t3-7-1', title: 'Notificar cliente via e-mail e whatsapp' }
        ],
        dependencies: ['tmpl-t3-6'],
        tags: ['Cliente', 'Aprovação'],
        isClientVisible: true
      },
      {
        id: 'tmpl-t3-8',
        title: 'Ajustes Solicitados pelo Cliente',
        description: 'Fazer alterações nas peças ou copys caso o cliente tenha solicitado na etapa de aprovação.',
        columnId: 'col-s3',
        priority: 'medium',
        assigneeRule: { type: 'role', value: 'Designer', fallback: 'manager' },
        relativeDueDate: { amount: 14, unit: 'days', direction: 'after', base: 'contract_signed_at' },
        checklist: [
          { id: 'chk-t3-8-1', title: 'Ajustar imagens solicitadas' },
          { id: 'chk-t3-8-2', title: 'Re-enviar para aprovação' }
        ],
        dependencies: ['tmpl-t3-7'],
        tags: ['Ajuste'],
        isClientVisible: false
      },
      {
        id: 'tmpl-t3-9',
        title: 'Agendamento dos Posts',
        description: 'Programar posts aprovados no painel de agendamento (Mlabs ou Estúdio de Criação).',
        columnId: 'col-s6',
        priority: 'high',
        assigneeRule: { type: 'role', value: 'Social Media', fallback: 'manager' },
        relativeDueDate: { amount: 15, unit: 'days', direction: 'after', base: 'contract_signed_at' },
        checklist: [
          { id: 'chk-t3-9-1', title: 'Configurar horários de pico do Instagram' },
          { id: 'chk-t3-9-2', title: 'Programar posts nas datas corretas' }
        ],
        dependencies: ['tmpl-t3-7'],
        tags: ['Publicação'],
        isClientVisible: true
      }
    ]
  }
];
