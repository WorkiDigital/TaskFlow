-- ============================================================
-- Smart Contracts Foundation
-- ============================================================

-- 1. Adjust contract_templates
ALTER TABLE public.contract_templates
  ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS service_type text,
  ADD COLUMN IF NOT EXISTS variables jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS required_variables jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contract_templates_status_check'
  ) THEN
    ALTER TABLE public.contract_templates
      ADD CONSTRAINT contract_templates_status_check
      CHECK (status IN ('draft', 'published', 'archived'));
  END IF;
END$$;

-- 2. contract_template_variables
CREATE TABLE IF NOT EXISTS public.contract_template_variables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.contract_templates(id) ON DELETE CASCADE,
  variable_key text NOT NULL,
  label text NOT NULL,
  source_type text NOT NULL DEFAULT 'manual_input',
  source_id text,
  required boolean DEFAULT true,
  field_type text DEFAULT 'text',
  fallback_value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ctv_source_type_check') THEN
    ALTER TABLE public.contract_template_variables
      ADD CONSTRAINT ctv_source_type_check
      CHECK (source_type IN ('client_field','form_field','commercial_field','service_field','fixed_value','manual_input'));
  END IF;
END$$;

-- 3. services
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text,
  pricing_type text DEFAULT 'recurring',
  default_price numeric,
  default_duration_months integer,
  default_contract_template_id uuid REFERENCES public.contract_templates(id) ON DELETE SET NULL,
  default_project_template_id uuid,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'services_pricing_type_check') THEN
    ALTER TABLE public.services
      ADD CONSTRAINT services_pricing_type_check
      CHECK (pricing_type IN ('recurring','one_time','setup','consulting','custom'));
  END IF;
END$$;

-- 4. service_deliverables
CREATE TABLE IF NOT EXISTS public.service_deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. client_deals
CREATE TABLE IF NOT EXISTS public.client_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  contract_template_id uuid REFERENCES public.contract_templates(id) ON DELETE SET NULL,
  value numeric,
  payment_terms text,
  duration_months integer,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'draft',
  custom_deliverables jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'client_deals_status_check') THEN
    ALTER TABLE public.client_deals
      ADD CONSTRAINT client_deals_status_check
      CHECK (status IN ('draft','active','contract_sent','signed','cancelled','finished'));
  END IF;
END$$;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.contract_template_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_deals ENABLE ROW LEVEL SECURITY;

-- contract_template_variables
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'agency_contract_template_variables' AND tablename = 'contract_template_variables') THEN
    CREATE POLICY "agency_contract_template_variables" ON public.contract_template_variables
      USING (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()))
      WITH CHECK (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));
  END IF;
END$$;

-- services
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'agency_services' AND tablename = 'services') THEN
    CREATE POLICY "agency_services" ON public.services
      USING (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()))
      WITH CHECK (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));
  END IF;
END$$;

-- service_deliverables
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'agency_service_deliverables' AND tablename = 'service_deliverables') THEN
    CREATE POLICY "agency_service_deliverables" ON public.service_deliverables
      USING (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()))
      WITH CHECK (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));
  END IF;
END$$;

-- client_deals
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'agency_client_deals' AND tablename = 'client_deals') THEN
    CREATE POLICY "agency_client_deals" ON public.client_deals
      USING (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()))
      WITH CHECK (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));
  END IF;
END$$;

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_ctv_template_id ON public.contract_template_variables(template_id);
CREATE INDEX IF NOT EXISTS idx_ctv_agency_id ON public.contract_template_variables(agency_id);
CREATE INDEX IF NOT EXISTS idx_services_agency_id ON public.services(agency_id);
CREATE INDEX IF NOT EXISTS idx_service_deliverables_service_id ON public.service_deliverables(service_id);
CREATE INDEX IF NOT EXISTS idx_client_deals_client_id ON public.client_deals(client_id);
CREATE INDEX IF NOT EXISTS idx_client_deals_agency_id ON public.client_deals(agency_id);
CREATE INDEX IF NOT EXISTS idx_contract_templates_agency_id ON public.contract_templates(agency_id);
