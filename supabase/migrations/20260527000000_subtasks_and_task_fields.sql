-- Fase 1a: Subtarefas e campos de tempo/conclusão em project_tasks

ALTER TABLE public.project_tasks
  ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES public.project_tasks(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS estimated_seconds INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_project_tasks_parent ON public.project_tasks(parent_task_id);

-- Subtarefas herdam workspace_id e agency_id do pai via app layer.
-- RLS já cobre via workspace_id (políticas existentes em project_tasks).
