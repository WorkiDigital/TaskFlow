-- Upgrade status constraints on client_deals to support robust onboarding states

ALTER TABLE public.client_deals DROP CONSTRAINT IF EXISTS client_deals_status_check;

ALTER TABLE public.client_deals
  ADD CONSTRAINT client_deals_status_check
  CHECK (status IN (
    'created',
    'waiting_client_data',
    'under_review',
    'ready_to_generate_contract',
    'contract_generated',
    'contract_sent',
    'contract_signed',
    'ready_for_onboarding',
    'cancelled',
    'finished',
    'draft',
    'active'
  ));
