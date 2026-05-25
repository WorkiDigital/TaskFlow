-- Fix: assign workspace_id to spaces/projects/columns/tasks that still have workspace_id = null
-- This happens when data was created before the workspace migration ran

DO $$
DECLARE
  ag record;
  ws_id uuid;
BEGIN
  FOR ag IN SELECT DISTINCT agency_id FROM public.project_spaces WHERE workspace_id IS NULL AND agency_id IS NOT NULL
  LOOP
    -- Find the first active workspace for this agency
    SELECT id INTO ws_id FROM public.workspaces
    WHERE agency_id = ag.agency_id AND status = 'active'
    ORDER BY created_at ASC
    LIMIT 1;

    IF ws_id IS NOT NULL THEN
      UPDATE public.project_spaces  SET workspace_id = ws_id WHERE agency_id = ag.agency_id AND workspace_id IS NULL;
      UPDATE public.projects         SET workspace_id = ws_id WHERE agency_id = ag.agency_id AND workspace_id IS NULL;
      UPDATE public.project_columns  SET workspace_id = ws_id WHERE agency_id = ag.agency_id AND workspace_id IS NULL;
      UPDATE public.project_tasks    SET workspace_id = ws_id WHERE agency_id = ag.agency_id AND workspace_id IS NULL;

      IF to_regclass('public.project_task_checklists') IS NOT NULL THEN
        UPDATE public.project_task_checklists SET workspace_id = ws_id
        WHERE workspace_id IS NULL AND task_id IN (
          SELECT id FROM public.project_tasks WHERE agency_id = ag.agency_id
        );
      END IF;

      IF to_regclass('public.project_docs') IS NOT NULL THEN
        UPDATE public.project_docs SET workspace_id = ws_id WHERE agency_id = ag.agency_id AND workspace_id IS NULL;
      END IF;

      IF to_regclass('public.project_files') IS NOT NULL THEN
        UPDATE public.project_files SET workspace_id = ws_id WHERE agency_id = ag.agency_id AND workspace_id IS NULL;
      END IF;

      IF to_regclass('public.project_activities') IS NOT NULL THEN
        UPDATE public.project_activities SET workspace_id = ws_id WHERE agency_id = ag.agency_id AND workspace_id IS NULL;
      END IF;
    END IF;
  END LOOP;
END $$;

-- Safety fallback: update RLS policies to also allow rows where workspace_id is still null
-- (agency members can see their own data even if workspace migration didn't fully run)
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'project_spaces', 'projects', 'project_columns', 'project_tasks'
  ])
  LOOP
    IF to_regclass(format('public.%I', tbl)) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_workspace_select', tbl);
      EXECUTE format(
        $policy$
        CREATE POLICY %s ON public.%I FOR SELECT TO authenticated
        USING (
          public.is_workspace_member(workspace_id)
          OR (workspace_id IS NULL AND agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()))
        )
        $policy$,
        quote_ident(tbl || '_workspace_select'), tbl
      );

      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_workspace_insert', tbl);
      EXECUTE format(
        $policy$
        CREATE POLICY %s ON public.%I FOR INSERT TO authenticated
        WITH CHECK (
          (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id))
          OR (workspace_id IS NULL AND agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()))
        )
        $policy$,
        quote_ident(tbl || '_workspace_insert'), tbl
      );

      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_workspace_update', tbl);
      EXECUTE format(
        $policy$
        CREATE POLICY %s ON public.%I FOR UPDATE TO authenticated
        USING (
          public.is_workspace_member(workspace_id)
          OR (workspace_id IS NULL AND agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()))
        )
        WITH CHECK (
          (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id))
          OR (workspace_id IS NULL AND agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()))
        )
        $policy$,
        quote_ident(tbl || '_workspace_update'), tbl
      );

      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_workspace_delete', tbl);
      EXECUTE format(
        $policy$
        CREATE POLICY %s ON public.%I FOR DELETE TO authenticated
        USING (
          public.is_workspace_member(workspace_id)
          OR (workspace_id IS NULL AND agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()))
        )
        $policy$,
        quote_ident(tbl || '_workspace_delete'), tbl
      );
    END IF;
  END LOOP;
END $$;
