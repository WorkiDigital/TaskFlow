-- Add agency_id to contracts table and enforce RLS

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id) ON DELETE CASCADE;

-- Backfill agency_id from the client's agency
UPDATE public.contracts c
SET agency_id = cl.agency_id
FROM public.clients cl
WHERE c.client_id = cl.id
  AND c.agency_id IS NULL
  AND cl.agency_id IS NOT NULL;

-- Expand status CHECK to match frontend ContractStatus type
ALTER TABLE public.contracts
  DROP CONSTRAINT IF EXISTS contracts_status_check,
  ADD CONSTRAINT contracts_status_check
    CHECK (status IN ('draft', 'pending', 'sent', 'signed', 'expired', 'cancelled', 'error'));

-- Index for fast agency-scoped queries
CREATE INDEX IF NOT EXISTS idx_contracts_agency_id ON public.contracts(agency_id);

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Agencies can only see and manage their own contracts
CREATE POLICY "contracts_agency_access" ON public.contracts
  USING (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()))
  WITH CHECK (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));
