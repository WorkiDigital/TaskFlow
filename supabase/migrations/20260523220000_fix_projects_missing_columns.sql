-- Fix: add columns that may be missing if projects table was created before this migration
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS space_id uuid REFERENCES public.project_spaces(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_id uuid,
  ADD COLUMN IF NOT EXISTS client_id uuid,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';

-- Ensure source check constraint exists (safe to add if column just created)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'projects_source_check' AND conrelid = 'public.projects'::regclass
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_source_check
      CHECK (source IN ('manual', 'template', 'contract_signed', 'onboarding', 'automation'));
  END IF;
END$$;

-- Fix project_spaces: ensure agency_id exists (in case table was created without it)
ALTER TABLE public.project_spaces
  ADD COLUMN IF NOT EXISTS agency_id uuid,
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS description text;

-- Fix project_columns: ensure agency_id exists
ALTER TABLE public.project_columns
  ADD COLUMN IF NOT EXISTS agency_id uuid,
  ADD COLUMN IF NOT EXISTS is_final_column boolean DEFAULT false;

-- Fix project_tasks: ensure all columns exist
ALTER TABLE public.project_tasks
  ADD COLUMN IF NOT EXISTS agency_id uuid,
  ADD COLUMN IF NOT EXISTS column_id uuid REFERENCES public.project_columns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assignee_id uuid,
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS position integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS template_task_id uuid;

-- Fix project_task_checklists: ensure all columns exist
ALTER TABLE public.project_task_checklists
  ADD COLUMN IF NOT EXISTS agency_id uuid,
  ADD COLUMN IF NOT EXISTS is_done boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS position integer DEFAULT 0;
