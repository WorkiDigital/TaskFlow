-- Fase 1, 2, 7 e 8: Novas Tabelas e Alterações para Fluxo Robusto de Pré-Onboarding

-- 1. Alterar services existente
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS default_onboarding_start_mode TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS default_onboarding_plan_id UUID;

-- 2. Alterar client_deals existente
ALTER TABLE public.client_deals ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.client_deals ADD COLUMN IF NOT EXISTS data_collection_mode TEXT DEFAULT 'portal';
ALTER TABLE public.client_deals ADD COLUMN IF NOT EXISTS onboarding_start_mode TEXT DEFAULT 'manual';

-- 2.b Alterar contracts existente
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS deal_id UUID REFERENCES public.client_deals(id) ON DELETE SET NULL;

-- 3. client_profile_submissions
CREATE TABLE IF NOT EXISTS public.client_profile_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.client_deals(id) ON DELETE CASCADE,
    submitted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    source TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'submitted',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. client_documents
CREATE TABLE IF NOT EXISTS public.client_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.client_deals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    status TEXT DEFAULT 'active',
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. service_onboarding_plans
CREATE TABLE IF NOT EXISTS public.service_onboarding_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    send_to_whatsapp_group BOOLEAN DEFAULT true,
    create_tasks BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- fk_services_onboarding_plan
ALTER TABLE public.services ADD CONSTRAINT fk_services_onboarding_plan 
FOREIGN KEY (default_onboarding_plan_id) REFERENCES public.service_onboarding_plans(id) ON DELETE SET NULL;

-- 6. service_onboarding_plan_steps
CREATE TABLE IF NOT EXISTS public.service_onboarding_plan_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.service_onboarding_plans(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    message_template TEXT,
    create_task BOOLEAN DEFAULT true,
    task_title TEXT,
    responsible_role TEXT,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. client_deal_events
CREATE TABLE IF NOT EXISTS public.client_deal_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.client_deals(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.client_profile_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_onboarding_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_onboarding_plan_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_deal_events ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can access submissions of their agency" ON public.client_profile_submissions FOR ALL USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())) WITH CHECK (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can access documents of their agency" ON public.client_documents FOR ALL USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())) WITH CHECK (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can access plans of their agency" ON public.service_onboarding_plans FOR ALL USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())) WITH CHECK (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can access plan steps of their agency" ON public.service_onboarding_plan_steps FOR ALL USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())) WITH CHECK (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can access deal events of their agency" ON public.client_deal_events FOR ALL USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())) WITH CHECK (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));
