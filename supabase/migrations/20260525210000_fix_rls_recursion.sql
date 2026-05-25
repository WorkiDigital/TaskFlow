-- Fix infinite recursion in RLS policies by using a SECURITY DEFINER function.

-- 1. Create a function that bypasses RLS to safely retrieve the current user's agency_id
CREATE OR REPLACE FUNCTION public.get_auth_agency_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT agency_id FROM public.users WHERE id = auth.uid();
$$;

-- 2. Update all agency-scoped policies to use the new function
DO $$
DECLARE
  tbl text;
  has_agency_id boolean;
BEGIN
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
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_agency_select', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_agency_insert', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_agency_update', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_agency_delete', tbl);

      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (agency_id = public.get_auth_agency_id())',
        tbl || '_agency_select',
        tbl
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (agency_id = public.get_auth_agency_id())',
        tbl || '_agency_insert',
        tbl
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (agency_id = public.get_auth_agency_id()) WITH CHECK (agency_id = public.get_auth_agency_id())',
        tbl || '_agency_update',
        tbl
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (agency_id = public.get_auth_agency_id())',
        tbl || '_agency_delete',
        tbl
      );
    END IF;
  END LOOP;
END $$;

-- 3. Fix the users table recursion
DROP POLICY IF EXISTS "users_select_self_or_agency" ON public.users;
DROP POLICY IF EXISTS "users_update_same_agency" ON public.users;

CREATE POLICY "users_select_self_or_agency"
  ON public.users FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR agency_id = public.get_auth_agency_id()
  );

CREATE POLICY "users_update_same_agency"
  ON public.users FOR UPDATE TO authenticated
  USING (agency_id = public.get_auth_agency_id())
  WITH CHECK (agency_id = public.get_auth_agency_id());

-- 4. Fix onboarding_runs and onboarding_step_logs policies
DROP POLICY IF EXISTS "onboarding_runs_agency_select" ON public.onboarding_runs;
CREATE POLICY "onboarding_runs_agency_select"
  ON public.onboarding_runs FOR SELECT TO authenticated
  USING (
    client_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.clients c
      WHERE c.id = onboarding_runs.client_id
        AND c.agency_id = public.get_auth_agency_id()
    )
  );

DROP POLICY IF EXISTS "onboarding_step_logs_agency_select" ON public.onboarding_step_logs;
CREATE POLICY "onboarding_step_logs_agency_select"
  ON public.onboarding_step_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.onboarding_runs r
      LEFT JOIN public.clients c ON c.id = r.client_id
      WHERE r.id = onboarding_step_logs.run_id
        AND (r.client_id IS NULL OR c.agency_id = public.get_auth_agency_id())
    )
  );

-- 5. Fix form_submissions policy
DROP POLICY IF EXISTS "form_submissions_agency_select" ON public.form_submissions;
CREATE POLICY "form_submissions_agency_select"
  ON public.form_submissions FOR SELECT TO authenticated
  USING (
    client_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.clients c
      WHERE c.id = form_submissions.client_id
        AND c.agency_id = public.get_auth_agency_id()
    )
  );

-- 6. Fix legacy tasks table if it exists
DO $$
BEGIN
  IF to_regclass('public.tasks') IS NOT NULL THEN
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
            AND p.agency_id = public.get_auth_agency_id()
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
            AND p.agency_id = public.get_auth_agency_id()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.project_columns pc
          JOIN public.projects p ON p.id = pc.project_id
          WHERE pc.id = tasks.column_id
            AND p.agency_id = public.get_auth_agency_id()
        )
      );
  END IF;
END $$;
