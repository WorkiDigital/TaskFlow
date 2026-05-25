-- Harden public schema RLS and grants.
--
-- This removes permissive MVP policies such as "Enable all for anon" and
-- "USING (true)" from sensitive tables, then recreates authenticated policies
-- scoped by the current user's agency_id.

-- Keep the Data API available, but remove direct anonymous table access.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Authenticated users still need table privileges; RLS below decides row scope.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Minimal public access used by public onboarding forms.
GRANT SELECT ON TABLE public.onboarding_workspace TO anon;
GRANT INSERT ON TABLE public.form_submissions TO anon;

DO $$
DECLARE
  tbl text;
  has_agency_id boolean;
BEGIN
  -- Drop known permissive legacy policies when their tables still exist.
  FOR tbl IN
    SELECT unnest(ARRAY[
      'agency_settings',
      'users',
      'clients',
      'contract_templates',
      'contracts',
      'projects',
      'project_columns',
      'tasks',
      'spaces',
      'task_comments',
      'task_activity',
      'task_checklists',
      'onboarding_workspace',
      'onboarding_runs',
      'onboarding_step_logs',
      'form_submissions',
      'automation_flows',
      'automation_steps',
      'automation_variables',
      'agency_roles'
    ])
  LOOP
    IF to_regclass(format('public.%I', tbl)) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS "Enable all for anon" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Enable insert for anon users" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Enable read access for authenticated users on flows" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Enable write access for authenticated users on flows" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Enable read access for authenticated users on steps" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Enable write access for authenticated users on steps" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Enable read access for authenticated users on variables" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Enable write access for authenticated users on variables" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Enable all for anon on onboarding workspace" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Enable all for authenticated on onboarding workspace" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Enable read for anon on onboarding runs" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Enable read for authenticated on onboarding runs" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Enable read for anon on onboarding step logs" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Enable read for authenticated on onboarding step logs" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Enable insert for anon on form submissions" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Enable read for authenticated on form submissions" ON public.%I', tbl);
    END IF;
  END LOOP;

  -- Apply standard agency isolation to all tables that carry agency_id.
  FOR tbl IN
    SELECT unnest(ARRAY[
      'clients',
      'contract_templates',
      'contracts',
      'projects',
      'project_columns',
      'project_spaces',
      'project_tasks',
      'project_task_checklists',
      'project_activities',
      'project_docs',
      'project_files',
      'project_time_entries',
      'automation_flows',
      'automation_steps',
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
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = tbl
        AND column_name = 'agency_id'
    )
    INTO has_agency_id;

    IF to_regclass(format('public.%I', tbl)) IS NOT NULL AND has_agency_id THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_agency_select', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_agency_insert', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_agency_update', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_agency_delete', tbl);

      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()))',
        tbl || '_agency_select',
        tbl
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()))',
        tbl || '_agency_insert',
        tbl
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid())) WITH CHECK (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()))',
        tbl || '_agency_update',
        tbl
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()))',
        tbl || '_agency_delete',
        tbl
      );
    END IF;
  END LOOP;
END $$;

-- Users are scoped by their own row and agency membership. Team-management
-- authorization is tightened further in the Edge Function phase.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_select_self_or_agency" ON public.users;
DROP POLICY IF EXISTS "users_update_same_agency" ON public.users;
CREATE POLICY "users_select_self_or_agency"
  ON public.users FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY "users_update_same_agency"
  ON public.users FOR UPDATE TO authenticated
  USING (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()))
  WITH CHECK (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));

-- Onboarding workspace is publicly readable only because public form pages need
-- to discover form templates by ID. Writes are authenticated only.
ALTER TABLE public.onboarding_workspace ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "onboarding_workspace_public_select" ON public.onboarding_workspace;
DROP POLICY IF EXISTS "onboarding_workspace_authenticated_write" ON public.onboarding_workspace;
CREATE POLICY "onboarding_workspace_public_select"
  ON public.onboarding_workspace FOR SELECT TO anon, authenticated
  USING (id = 'default');
CREATE POLICY "onboarding_workspace_authenticated_write"
  ON public.onboarding_workspace FOR ALL TO authenticated
  USING (id = 'default')
  WITH CHECK (id = 'default');

-- Onboarding runs/logs are agency-scoped through their related client until
-- the schema gets a first-class agency_id in the next phase.
ALTER TABLE public.onboarding_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "onboarding_runs_agency_select" ON public.onboarding_runs;
CREATE POLICY "onboarding_runs_agency_select"
  ON public.onboarding_runs FOR SELECT TO authenticated
  USING (
    client_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.clients c
      WHERE c.id = onboarding_runs.client_id
        AND c.agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid())
    )
  );

ALTER TABLE public.onboarding_step_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "onboarding_step_logs_agency_select" ON public.onboarding_step_logs;
CREATE POLICY "onboarding_step_logs_agency_select"
  ON public.onboarding_step_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.onboarding_runs r
      LEFT JOIN public.clients c ON c.id = r.client_id
      WHERE r.id = onboarding_step_logs.run_id
        AND (r.client_id IS NULL OR c.agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()))
    )
  );

ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "form_submissions_public_insert" ON public.form_submissions;
DROP POLICY IF EXISTS "form_submissions_agency_select" ON public.form_submissions;
CREATE POLICY "form_submissions_public_insert"
  ON public.form_submissions FOR INSERT TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "form_submissions_agency_select"
  ON public.form_submissions FOR SELECT TO authenticated
  USING (
    client_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.clients c
      WHERE c.id = form_submissions.client_id
        AND c.agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid())
    )
  );

-- Legacy project/task tables without agency_id are locked down through joins.
DO $$
BEGIN
  IF to_regclass('public.tasks') IS NOT NULL THEN
    ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "tasks_agency_select" ON public.tasks;
    DROP POLICY IF EXISTS "tasks_agency_write" ON public.tasks;
    CREATE POLICY "tasks_agency_select"
      ON public.tasks FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.project_columns pc
          JOIN public.projects p ON p.id = pc.project_id
          WHERE pc.id = tasks.column_id
            AND p.agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid())
        )
      );
    CREATE POLICY "tasks_agency_write"
      ON public.tasks FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.project_columns pc
          JOIN public.projects p ON p.id = pc.project_id
          WHERE pc.id = tasks.column_id
            AND p.agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid())
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.project_columns pc
          JOIN public.projects p ON p.id = pc.project_id
          WHERE pc.id = tasks.column_id
            AND p.agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid())
        )
      );
  END IF;
END $$;

-- Agency settings are accessed through the agency-settings Edge Function only.
ALTER TABLE public.agency_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agency_settings_no_direct_access" ON public.agency_settings;
CREATE POLICY "agency_settings_no_direct_access"
  ON public.agency_settings FOR SELECT TO authenticated
  USING (false);
