-- Add trigger column to automation_flows
ALTER TABLE public.automation_flows
  ADD COLUMN IF NOT EXISTS trigger TEXT;

CREATE INDEX IF NOT EXISTS idx_automation_flows_trigger ON public.automation_flows(trigger);

-- automation_runs: tracks execution state for each flow run
CREATE TABLE IF NOT EXISTS public.automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  flow_id UUID REFERENCES public.automation_flows(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'awaiting_form', 'awaiting_signature', 'completed', 'failed', 'cancelled')),
  current_step_index INTEGER NOT NULL DEFAULT 0,
  context JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "automation_runs_select" ON public.automation_runs
  FOR SELECT TO authenticated
  USING (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "automation_runs_insert" ON public.automation_runs
  FOR INSERT TO authenticated
  WITH CHECK (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "automation_runs_update" ON public.automation_runs
  FOR UPDATE TO authenticated
  USING (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_automation_runs_agency ON public.automation_runs(agency_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_client ON public.automation_runs(client_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_status ON public.automation_runs(status);

-- automation_step_logs: per-step execution log within a run
CREATE TABLE IF NOT EXISTS public.automation_step_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.automation_runs(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  step_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'skipped', 'failed')),
  message TEXT,
  output JSONB DEFAULT '{}'::jsonb,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.automation_step_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "automation_step_logs_select" ON public.automation_step_logs
  FOR SELECT TO authenticated
  USING (
    run_id IN (
      SELECT id FROM public.automation_runs
      WHERE agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "automation_step_logs_insert" ON public.automation_step_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    run_id IN (
      SELECT id FROM public.automation_runs
      WHERE agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid())
    )
  );

CREATE INDEX IF NOT EXISTS idx_automation_step_logs_run ON public.automation_step_logs(run_id);
