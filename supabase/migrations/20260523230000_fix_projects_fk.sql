-- Ensure FK constraint exists so PostgREST can resolve the projects → project_spaces join
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'projects_space_id_fkey' AND conrelid = 'public.projects'::regclass
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_space_id_fkey
      FOREIGN KEY (space_id) REFERENCES public.project_spaces(id) ON DELETE SET NULL;
  END IF;
END$$;

-- Ensure FK from project_tasks.column_id → project_columns(id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'project_tasks_column_id_fkey' AND conrelid = 'public.project_tasks'::regclass
  ) THEN
    ALTER TABLE public.project_tasks
      ADD CONSTRAINT project_tasks_column_id_fkey
      FOREIGN KEY (column_id) REFERENCES public.project_columns(id) ON DELETE SET NULL;
  END IF;
END$$;

-- Ensure FK from project_tasks.project_id → projects(id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'project_tasks_project_id_fkey' AND conrelid = 'public.project_tasks'::regclass
  ) THEN
    ALTER TABLE public.project_tasks
      ADD CONSTRAINT project_tasks_project_id_fkey
      FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
  END IF;
END$$;

-- Ensure FK from project_task_checklists.task_id → project_tasks(id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'project_task_checklists_task_id_fkey' AND conrelid = 'public.project_task_checklists'::regclass
  ) THEN
    ALTER TABLE public.project_task_checklists
      ADD CONSTRAINT project_task_checklists_task_id_fkey
      FOREIGN KEY (task_id) REFERENCES public.project_tasks(id) ON DELETE CASCADE;
  END IF;
END$$;

-- Ensure FK from project_columns.project_id → projects(id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'project_columns_project_id_fkey' AND conrelid = 'public.project_columns'::regclass
  ) THEN
    ALTER TABLE public.project_columns
      ADD CONSTRAINT project_columns_project_id_fkey
      FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
  END IF;
END$$;
