-- Align onboarding_runs with the frontend/agent contract.
--
-- Dashboard and agent code query agency_id and created_at, while the execution
-- flow pauses with status = 'awaiting_form'. The original table did not expose
-- those fields/statuses, causing runtime failures against the real database.

ALTER TABLE public.onboarding_runs
  ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE public.onboarding_runs r
SET agency_id = c.agency_id
FROM public.clients c
WHERE r.client_id = c.id
  AND r.agency_id IS NULL;

UPDATE public.onboarding_runs
SET created_at = COALESCE(created_at, started_at, NOW()),
    updated_at = COALESCE(updated_at, completed_at, started_at, NOW());

DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT con.conname
  INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'onboarding_runs'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) LIKE '%status%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.onboarding_runs DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE public.onboarding_runs
  ADD CONSTRAINT onboarding_runs_status_check
  CHECK (status IN ('running', 'awaiting_form', 'completed', 'failed', 'partial'));

CREATE INDEX IF NOT EXISTS onboarding_runs_agency_id_idx
  ON public.onboarding_runs(agency_id);

CREATE INDEX IF NOT EXISTS onboarding_runs_agency_created_at_idx
  ON public.onboarding_runs(agency_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_onboarding_runs_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_onboarding_runs_updated_at ON public.onboarding_runs;
CREATE TRIGGER set_onboarding_runs_updated_at
  BEFORE UPDATE ON public.onboarding_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_onboarding_runs_updated_at();

DROP POLICY IF EXISTS "onboarding_runs_agency_select" ON public.onboarding_runs;
DROP POLICY IF EXISTS "onboarding_runs_agency_insert" ON public.onboarding_runs;
DROP POLICY IF EXISTS "onboarding_runs_agency_update" ON public.onboarding_runs;
DROP POLICY IF EXISTS "onboarding_runs_agency_delete" ON public.onboarding_runs;

CREATE POLICY "onboarding_runs_agency_select"
  ON public.onboarding_runs FOR SELECT TO authenticated
  USING (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "onboarding_runs_agency_insert"
  ON public.onboarding_runs FOR INSERT TO authenticated
  WITH CHECK (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "onboarding_runs_agency_update"
  ON public.onboarding_runs FOR UPDATE TO authenticated
  USING (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()))
  WITH CHECK (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "onboarding_runs_agency_delete"
  ON public.onboarding_runs FOR DELETE TO authenticated
  USING (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));
