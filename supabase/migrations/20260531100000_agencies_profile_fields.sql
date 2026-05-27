-- Add profile fields to agencies table
ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS domain TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- RLS: allow agency members to read and update their own agency
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agencies' AND policyname = 'agencies_read_own'
  ) THEN
    CREATE POLICY "agencies_read_own" ON public.agencies
      FOR SELECT USING (
        id = (SELECT agency_id FROM public.users WHERE id = auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agencies' AND policyname = 'agencies_update_own'
  ) THEN
    CREATE POLICY "agencies_update_own" ON public.agencies
      FOR UPDATE USING (
        id = (SELECT agency_id FROM public.users WHERE id = auth.uid())
      );
  END IF;
END $$;
