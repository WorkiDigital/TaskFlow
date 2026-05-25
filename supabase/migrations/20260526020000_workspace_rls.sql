-- Migração 3: Atualizar RLS para múltiplos workspaces

-- 1. Funções de segurança (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_agency_member(check_agency_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agency_members
    WHERE agency_id = check_agency_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_member(check_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = check_workspace_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
$$;

-- 2. RLS para as novas tabelas (agency_members, workspaces, workspace_members)
ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agency_members_select" ON public.agency_members;
CREATE POLICY "agency_members_select" ON public.agency_members FOR SELECT TO authenticated
USING (public.is_agency_member(agency_id) OR user_id = auth.uid());

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "workspaces_select" ON public.workspaces;
CREATE POLICY "workspaces_select" ON public.workspaces FOR SELECT TO authenticated
USING (public.is_workspace_member(id) OR public.is_agency_member(agency_id));

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "workspace_members_select" ON public.workspace_members;
CREATE POLICY "workspace_members_select" ON public.workspace_members FOR SELECT TO authenticated
USING (public.is_workspace_member(workspace_id) OR public.is_agency_member(agency_id));

-- 3. Atualizar tabelas operacionais para validar `workspace_id`
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
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_agency_select', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_agency_insert', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_agency_update', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_agency_delete', tbl);

      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id))',
        tbl || '_workspace_select', tbl
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_workspace_member(workspace_id) AND agency_id = (SELECT agency_id FROM public.workspaces WHERE id = workspace_id))',
        tbl || '_workspace_insert', tbl
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id))',
        tbl || '_workspace_update', tbl
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.is_workspace_member(workspace_id))',
        tbl || '_workspace_delete', tbl
      );
    END IF;
  END LOOP;
END $$;

-- 4. Atualizar tabelas globais (agencies)
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'clients',
      'contract_templates',
      'contracts',
      'agency_roles',
      'team_invites',
      'role_permissions',
      'agent_insights',
      'agent_actions',
      'agent_execution_logs',
      'contract_template_variables',
      'services',
      'service_deliverables',
      'client_deals'
    ])
  LOOP
    IF to_regclass(format('public.%I', tbl)) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_agency_select', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_agency_insert', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_agency_update', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_agency_delete', tbl);

      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_agency_member(agency_id))',
        tbl || '_agency_select', tbl
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_agency_member(agency_id))',
        tbl || '_agency_insert', tbl
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.is_agency_member(agency_id)) WITH CHECK (public.is_agency_member(agency_id))',
        tbl || '_agency_update', tbl
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.is_agency_member(agency_id))',
        tbl || '_agency_delete', tbl
      );
    END IF;
  END LOOP;
END $$;

-- 5. Tabelas hibridas (templates e automations)
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
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_agency_select', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_agency_insert', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_agency_update', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_agency_delete', tbl);

      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING ((scope = ''agency'' AND public.is_agency_member(agency_id)) OR (scope = ''workspace'' AND public.is_workspace_member(workspace_id)))',
        tbl || '_hybrid_select', tbl
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK ((scope = ''agency'' AND public.is_agency_member(agency_id)) OR (scope = ''workspace'' AND public.is_workspace_member(workspace_id)))',
        tbl || '_hybrid_insert', tbl
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING ((scope = ''agency'' AND public.is_agency_member(agency_id)) OR (scope = ''workspace'' AND public.is_workspace_member(workspace_id)))',
        tbl || '_hybrid_update', tbl
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING ((scope = ''agency'' AND public.is_agency_member(agency_id)) OR (scope = ''workspace'' AND public.is_workspace_member(workspace_id)))',
        tbl || '_hybrid_delete', tbl
      );
    END IF;
  END LOOP;
END $$;
