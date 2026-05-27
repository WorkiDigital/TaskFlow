-- Add agency_id to onboarding_workspace for multi-tenant isolation.
-- Replaces the singleton constraint with a unique index per agency.

ALTER TABLE public.onboarding_workspace
  ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE;

DROP INDEX IF EXISTS onboarding_workspace_agency_unique;
CREATE UNIQUE INDEX onboarding_workspace_agency_unique
  ON public.onboarding_workspace (agency_id);

ALTER TABLE public.onboarding_workspace ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'onboarding_workspace' AND policyname = 'onboarding_workspace_read_own'
  ) THEN
    CREATE POLICY "onboarding_workspace_read_own"
      ON public.onboarding_workspace FOR SELECT
      USING (
        agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'onboarding_workspace' AND policyname = 'onboarding_workspace_write_own'
  ) THEN
    CREATE POLICY "onboarding_workspace_write_own"
      ON public.onboarding_workspace FOR ALL
      USING (
        agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid())
      );
  END IF;
END $$;
