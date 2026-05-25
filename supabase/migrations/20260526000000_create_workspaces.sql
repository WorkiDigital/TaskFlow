-- Migração 1: Estrutura base para Múltiplos Workspaces

-- 1. Agency Members
CREATE TABLE IF NOT EXISTS public.agency_members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member', 'viewer')),
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'disabled', 'removed')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(agency_id, user_id)
);

-- 2. Workspaces
CREATE TABLE IF NOT EXISTS public.workspaces (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    type text DEFAULT 'Operação interna',
    status text NOT NULL DEFAULT 'active',
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Workspace Members
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member', 'viewer')),
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'disabled', 'removed')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(workspace_id, user_id)
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_agency_members_user_id ON public.agency_members(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_members_agency_id ON public.agency_members(agency_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_agency_id ON public.workspaces(agency_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);

-- 4. Adicionar workspace_id nas tabelas operacionais
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'project_spaces',
      'projects',
      'project_columns',
      'project_tasks',
      'project_task_checklists',
      'project_activities',
      'project_time_entries',
      'project_docs',
      'project_files'
    ])
  LOOP
    IF to_regclass(format('public.%I', tbl)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE', tbl);
      EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_workspace_id ON public.%I(workspace_id)', tbl, tbl);
    END IF;
  END LOOP;
END $$;

-- 5. Adicionar scope e workspace_id em templates e automações
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'agency_templates',
      'template_columns',
      'template_tasks',
      'template_task_checklists',
      'automation_flows',
      'automation_steps'
    ])
  LOOP
    IF to_regclass(format('public.%I', tbl)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS scope text DEFAULT ''agency'' CHECK (scope IN (''agency'', ''workspace''))', tbl);
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE', tbl);
      EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_workspace_id ON public.%I(workspace_id)', tbl, tbl);
    END IF;
  END LOOP;
END $$;
