# Plano — Frontend MVP "Agência Prime"

Construir apenas o frontend visual e navegável da plataforma SaaS, com estética premium dark + glassmorphism, totalmente responsivo, usando dados mockados. Nenhuma integração real, nenhum backend.

## Observação importante sobre arquitetura

O projeto usa **TanStack Start** com roteamento baseado em arquivos em `src/routes/` — não `src/pages/` (que é convenção de outro framework e quebraria o build). Vou adaptar a instrução assim:

- `src/pages/Dashboard.tsx` → `src/routes/dashboard.tsx`
- `src/pages/Clients.tsx` → `src/routes/clients.tsx`
- `src/pages/Onboarding.tsx` → `src/routes/onboarding.tsx`
- `src/pages/Contracts.tsx` → `src/routes/contracts.tsx`
- `src/pages/Projects.tsx` → `src/routes/projects.tsx`
- `src/pages/Settings.tsx` → `src/routes/settings.tsx`

O layout autenticado vira uma rota pathless `src/routes/_app.tsx` com `<Outlet />`, e as 6 telas viram filhas (`_app.dashboard.tsx`, etc.). A rota `/` redireciona para `/dashboard`. Componentes ficam em `src/components/...` conforme a instrução.

## Design system

Atualizar `src/styles.css`:
- Forçar tema dark como base (`:root` recebe valores dark).
- Tokens em `oklch`: background quase preto com leve viés azul, surface translúcida, primary violeta/azul vibrante, accent ciano, success, warning, danger.
- Tokens extras: `--glass-bg`, `--glass-border`, `--glass-blur`, `--shadow-soft`, `--shadow-glow`, gradiente de fundo `--gradient-app`.
- Raio grande (`--radius: 1rem`).
- Tipografia: importar Inter (display + body) via `<link>` no `__root.tsx`.
- Classes utilitárias: `.glass-card`, `.glass-panel`, animações `fade-in`, `slide-up` via `tw-animate-css` já disponível.

Componentes shadcn já existentes (button, card, badge, input, dialog, sheet, sidebar, tabs, table, avatar, dropdown-menu, sonner) serão reutilizados — sem reescrever.

## Estrutura de arquivos

```text
src/
  routes/
    __root.tsx           (ajustar: fonte Inter, gradiente, toaster)
    index.tsx            (redirect → /dashboard)
    _app.tsx             (layout autenticado: Sidebar + Header + Outlet)
    _app.dashboard.tsx
    _app.clients.tsx
    _app.onboarding.tsx
    _app.contracts.tsx
    _app.projects.tsx
    _app.settings.tsx
  components/
    layout/
      AppLayout.tsx       (wrapper usado por _app.tsx)
      Sidebar.tsx
      Header.tsx
    ui/
      StatusBadge.tsx
      EmptyState.tsx
      MetricCard.tsx
      GlassCard.tsx
    onboarding/
      OnboardingFlow.tsx
      OnboardingStepCard.tsx
    projects/
      KanbanBoard.tsx
      KanbanColumn.tsx
      KanbanCard.tsx
    contracts/
      ContractBuilder.tsx
      ContractList.tsx
    clients/
      ClientsTable.tsx
      ClientFormDialog.tsx
    dashboard/
      RecentActivity.tsx
      UpcomingDeadlines.tsx
      ContractsStatusCard.tsx
      OnboardingProgressCard.tsx
  lib/
    mock-data.ts          (todos os arrays mockados centralizados)
    types.ts              (interfaces TS: Client, Contract, Project, Task, etc.)
```

## Telas (resumo do conteúdo)

**Layout (`_app.tsx` + Sidebar + Header)**
- Sidebar fixa desktop com 6 itens (Dashboard, Clientes, Onboarding, Contratos, Projetos, Configurações), ícones Lucide, item ativo via `useRouterState`, glass + borda sutil.
- Mobile: Sidebar vira `Sheet` (drawer) acionado por botão hamburguer no Header.
- Header: título "Agência Prime", subtítulo contextual por rota, ícone de notificações (badge mock), avatar com dropdown (logout visual).

**Dashboard (`_app.dashboard.tsx`)**
- 4 `MetricCard` (Clientes 24, Onboardings 7, Contratos 5, Projetos 12) com ícone, valor, delta mock.
- Grid de seções: Atividades recentes, Próximos prazos, Status dos contratos (mini-gráfico de barras simples em CSS), Progresso dos onboardings (lista com barras de progresso).

**Clientes (`_app.clients.tsx`)**
- Tabela (desktop) / cards (mobile) com filtro de busca, badge de status, botões de ação.
- Botão "Novo cliente" abre `ClientFormDialog` (validação frontend zod/manual).
- `EmptyState` quando filtro não retorna nada.

**Onboarding (`_app.onboarding.tsx`)**
- Lista de onboardings em andamento + `OnboardingFlow` (stepper: Briefing → Documentos → Contrato → Kickoff) com indicador visual de etapa.
- Formulário de briefing mockado (campos: objetivo, público, prazo, orçamento).

**Contratos (`_app.contracts.tsx`)**
- `ContractList` com status (Rascunho, Pendente assinatura, Assinado, Expirado) usando `StatusBadge`.
- `ContractBuilder`: editor simples (título, cliente, valor, cláusulas em textarea) com preview lateral.

**Projetos (`_app.projects.tsx`)**
- `KanbanBoard` com 4 colunas (Backlog, Em andamento, Revisão, Concluído).
- Scroll horizontal em mobile. Cards exibem título, cliente, prioridade, avatar do responsável.
- Drag-and-drop **fora do escopo**: apenas visual estático (clique abre detalhe via dialog).

**Configurações (`_app.settings.tsx`)**
- Tabs: Agência (nome, logo upload visual), Equipe (lista mock), Integrações (cards desabilitados com badge "Em breve"), Preferências.

## Estados, feedback e validação

- `EmptyState` reutilizável (ícone, título, descrição, CTA opcional).
- Loading: skeletons em cards/tabelas (1s simulado com `setTimeout` em `useEffect` para demonstrar).
- Erro: variant do `EmptyState` com ícone de alerta.
- Toasts via `sonner` para ações simuladas ("Cliente criado", "Contrato salvo").
- Validação simples nos formulários (campos obrigatórios, mensagens inline).
- Logs prefixados por componente conforme instrução.

## Responsividade

Mobile-first em 375px:
- Sidebar → Sheet drawer.
- Métricas: grid 1 col → 2 → 4.
- Tabelas → cards empilhados em `<md`.
- Kanban → overflow-x-auto com snap.
- Formulários full width, botões com `min-h-11`.

## Fora de escopo nesta etapa

- Backend, Supabase, autenticação real, Edge Functions, Evolution/Autentique/Drive/IA.
- Drag-and-drop real no Kanban.
- Upload real de arquivos.
- Persistência (tudo em memória / mock).

## Verificação final

- Navegação entre as 6 telas funcionando.
- Item ativo da sidebar correto em cada rota.
- Layout íntegro em 375px, 768px, 1280px.
- Sem erros TypeScript; interfaces em `lib/types.ts` consistentes.
- Build do TanStack Router gera `routeTree.gen.ts` sem conflitos (`/` redireciona, demais rotas sob `_app`).

Posso implementar assim?