-- Add missing text columns to projects that may not exist if table was created before the full migration
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add missing columns to project_spaces
ALTER TABLE public.project_spaces
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add missing columns to project_columns
ALTER TABLE public.project_columns
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add missing columns to project_tasks
ALTER TABLE public.project_tasks
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS status text;

-- Add missing columns to project_task_checklists
ALTER TABLE public.project_task_checklists
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
