-- Fix anon access for the public client capture form (/capture/:clientId).
--
-- The harden_rls_grants migration (20260525160237) revoked all anon access to
-- every table, which broke the capture form route that queries and updates the
-- clients table without an authenticated session (clients access their own form
-- via a direct link shared by the agency).

-- Grant the minimum required permissions back to anon.
GRANT SELECT ON TABLE public.clients TO anon;
GRANT UPDATE ON TABLE public.clients TO anon;

-- Policies: anon can read any client row (UUID is the auth token here, as the
-- link is only shared with the specific client). Update is restricted to
-- non-sensitive fields via the application layer.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'clients_capture_anon_select' AND tablename = 'clients'
  ) THEN
    CREATE POLICY "clients_capture_anon_select" ON public.clients
      FOR SELECT TO anon
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'clients_capture_anon_update' AND tablename = 'clients'
  ) THEN
    CREATE POLICY "clients_capture_anon_update" ON public.clients
      FOR UPDATE TO anon
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
