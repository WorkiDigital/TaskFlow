-- Fase 1a: Comentários de tarefa

CREATE TABLE IF NOT EXISTS public.project_task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.project_tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task ON public.project_task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_agency ON public.project_task_comments(agency_id);

ALTER TABLE public.project_task_comments ENABLE ROW LEVEL SECURITY;

-- Leitura: membros do workspace (ou agency fallback para dados sem workspace_id)
CREATE POLICY "task_comments_select" ON public.project_task_comments
  FOR SELECT TO authenticated
  USING (
    public.is_workspace_member(workspace_id)
    OR (workspace_id IS NULL AND agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()))
  );

-- Insert: usuário autenticado pode comentar (valida que é da agência via agency_id)
CREATE POLICY "task_comments_insert" ON public.project_task_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid())
  );

-- Update/Delete: apenas o autor
CREATE POLICY "task_comments_update" ON public.project_task_comments
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "task_comments_delete" ON public.project_task_comments
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
