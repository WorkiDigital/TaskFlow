CREATE TABLE IF NOT EXISTS public.onboarding_workspace (
  id TEXT PRIMARY KEY DEFAULT 'default',
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT onboarding_workspace_singleton CHECK (id = 'default')
);

CREATE TABLE IF NOT EXISTS public.onboarding_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  context JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.onboarding_step_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.onboarding_runs(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  step_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'skipped')),
  message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.onboarding_workspace ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_step_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for anon on onboarding workspace"
  ON public.onboarding_workspace FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated on onboarding workspace"
  ON public.onboarding_workspace FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable read for anon on onboarding runs"
  ON public.onboarding_runs FOR SELECT TO anon USING (true);

CREATE POLICY "Enable read for authenticated on onboarding runs"
  ON public.onboarding_runs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read for anon on onboarding step logs"
  ON public.onboarding_step_logs FOR SELECT TO anon USING (true);

CREATE POLICY "Enable read for authenticated on onboarding step logs"
  ON public.onboarding_step_logs FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS onboarding_runs_client_id_idx ON public.onboarding_runs(client_id);
CREATE INDEX IF NOT EXISTS onboarding_step_logs_run_id_idx ON public.onboarding_step_logs(run_id);
