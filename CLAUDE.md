# TaskFlow — Instruções para Claude Code

## Visão Geral

SaaS multi-tenant para agências digitais. Stack: React + TanStack Router + Supabase (Postgres + Edge Functions Deno) + Tailwind + shadcn/ui.

- **Supabase project ref:** `bqybgvqnpecsoarhsfmv`
- **Branch principal:** `main`
- **Deploy de edge functions:** `npx supabase functions deploy <nome> --project-ref bqybgvqnpecsoarhsfmv`
- **Migrations:** `npx supabase db push --linked` (responder `Y` no prompt)

---

## Regra de Ouro — Multi-Tenancy

**Toda query ao banco DEVE filtrar por `agency_id`.** Nunca fazer SELECT sem esse filtro.

Para obter o `agency_id` do usuário autenticado:
```typescript
import { getCurrentUserAgency } from "@/lib/auth";
const { agencyId } = await getCurrentUserAgency();
```

Nas edge functions (Deno), o `agencyId` vem do JWT ou do body da requisição e deve ser validado.

---

## Hierarquia de Projetos (modelo ClickUp)

```
Workspace
  └─ Espaço  (project_spaces, space_type='space', parent_space_id IS NULL)
       └─ Pasta  (project_spaces, space_type='folder', parent_space_id=espaço.id)
            └─ Lista  (projects, space_id=pasta.id)
                 └─ Tarefa  (project_tasks, parent_task_id IS NULL)
                      └─ Subtarefa  (project_tasks, parent_task_id=tarefa.id)
```

`activeViewMode` em `_app.projects.tsx`:
- `"workspace"` → WorkspaceOverview
- `"space-group"` → SpaceGroupOverview (espaço raiz)
- `"space"` → SpaceOverview (pasta/folder)
- `"project"` → Kanban / ListView

---

## Convenções de Banco de Dados

| Detalhe | Valor |
|---|---|
| Checklist booleano | `is_done` (não `is_checked`) |
| `agency_id` | NOT NULL em quase todas as tabelas |
| `project_spaces` | Não tem coluna `icon` |
| `workspace_id` helper | `getLocalActiveWorkspaceId()` de `workspaceService` |
| `onboarding_workspace` | Filtrar por `agency_id` (não por `id = 'default'`) |
| `client_deals` | Tem `workspace_id`, `onboarding_start_mode`, `data_collection_mode` |

### Cores de Espaço
`space.color` é classe Tailwind (ex: `"bg-pink-500"`), NÃO hex. `TAILWIND_COLOR_MAP` em `ProjectSidebar.tsx` converte para hex.

---

## Edge Functions (`supabase/functions/`)

Todas importam helpers de `_shared/`:
- `_shared/helpers.ts` — `getSupabaseAdmin`, `requestEvolution` (com timeout 15s via AbortController), `normalizePhone`, `renderTemplate`, `getInstanceApiKey`, `extractGroupJid`, `corsHeaders`
- `_shared/executeStep.ts` — lógica compartilhada de execução de steps usada por `onboarding-execute` e `automation-execute`

### onboarding-execute
- Recebe `{ action, clientId, appOrigin }` ou `{ action: "resume", runId }`
- Tem **lock de concorrência**: verifica se já existe run `running`/`awaiting_form` para o mesmo cliente antes de criar novo
- Valida `agency_id` antes de acessar qualquer tabela

### autentique-webhook
- Valida header `x-webhook-secret` contra env var `AUTENTIQUE_WEBHOOK_SECRET` (se configurada)

### automation-execute
- Steps filtrados por `agency_id` além de `flow_id`

---

## Arquivos Críticos

| Arquivo | Responsabilidade |
|---|---|
| `src/routes/_app.projects.tsx` | Orquestrador projetos: estados, mappers, handlers |
| `src/routes/_app.settings.tsx` | Configurações: agência (save real), equipe, WhatsApp, IA |
| `src/services/projectsService.ts` | Todas as funções DB de projetos (inclui `createProjectFromTemplate`) |
| `src/services/contractsService.ts` | Contratos, deals, templates, serviços |
| `src/services/onboardingService.ts` | `getWorkspace`/`saveWorkspace` por agency_id; `startRun`/`resumeRun` |
| `src/services/agentService.ts` | Configuração do agente de IA (provider/model/key) |
| `src/components/projects/TaskDetailsDrawer.tsx` | Detalhe tarefa + checklist/comentários/subtarefas persistidos |
| `src/components/projects/ListView.tsx` | Lista com expansão inline de subtarefas |
| `supabase/functions/_shared/executeStep.ts` | Handlers de steps compartilhados |

---

## Migrations Aplicadas (prod)

| Migration | Conteúdo |
|---|---|
| `20260527000000` | `parent_task_id`, `estimated_seconds`, `completed_at` em project_tasks |
| `20260527010000` | `parent_space_id`, `space_type` em project_spaces |
| `20260527020000` | Tabela `project_task_comments` com RLS |
| `20260528000000` | Pre-onboarding robusto: `client_deals` com `workspace_id`/`onboarding_start_mode`, `client_profile_submissions`, `client_uploaded_files` |
| `20260529000000` | Atualiza CHECK constraint de status em `client_deals` |
| `20260530000000` | Tabela `automation_runs` |
| `20260531000000` | RLS em `contracts` + `agency_id` |
| `20260531100000` | Colunas `bio`, `domain`, `logo_url`, `updated_at` em `agencies` + RLS |
| `20260601000000` | Coluna `agency_id` em `onboarding_workspace` + unique index por agência + RLS |

---

## Padrão de Soft-Delete

Membros da equipe **nunca** são deletados com `DELETE`. Usar:
```typescript
.update({ status: "suspended", updated_at: new Date().toISOString() }).eq("id", userId)
```

---

## Políticas RLS em SQL

`CREATE POLICY IF NOT EXISTS` **não é sintaxe válida** no Postgres. Usar o padrão:
```sql
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'X' AND policyname = 'Y'
  ) THEN
    CREATE POLICY "Y" ON public.X FOR SELECT USING (...);
  END IF;
END $$;
```

---

## Função `isDbId(id)`
Retorna `true` se o ID não começa com `"t-"` ou `"chk-new-"`. Usada no `TaskDetailsDrawer` para decidir se deve chamar o DB.
