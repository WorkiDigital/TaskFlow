-- Habilita RLS na tabela clients e cria políticas por agency_id

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'agency_clients_select' AND tablename = 'clients') THEN
    CREATE POLICY "agency_clients_select" ON public.clients
      FOR SELECT USING (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'agency_clients_insert' AND tablename = 'clients') THEN
    CREATE POLICY "agency_clients_insert" ON public.clients
      FOR INSERT WITH CHECK (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'agency_clients_update' AND tablename = 'clients') THEN
    CREATE POLICY "agency_clients_update" ON public.clients
      FOR UPDATE USING (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'agency_clients_delete' AND tablename = 'clients') THEN
    CREATE POLICY "agency_clients_delete" ON public.clients
      FOR DELETE USING (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));
  END IF;
END$$;
