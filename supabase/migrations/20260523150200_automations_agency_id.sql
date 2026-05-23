-- Adiciona a coluna agency_id para suportar a arquitetura multi-tenant
ALTER TABLE public.automation_flows ADD COLUMN IF NOT EXISTS agency_id UUID;
ALTER TABLE public.automation_steps ADD COLUMN IF NOT EXISTS agency_id UUID;
ALTER TABLE public.automation_variables ADD COLUMN IF NOT EXISTS agency_id UUID;

-- Criar índices para otimizar as consultas por agência
CREATE INDEX IF NOT EXISTS idx_automation_flows_agency_id ON public.automation_flows(agency_id);
CREATE INDEX IF NOT EXISTS idx_automation_steps_agency_id ON public.automation_steps(agency_id);
CREATE INDEX IF NOT EXISTS idx_automation_variables_agency_id ON public.automation_variables(agency_id);

-- Atualiza as políticas RLS para garantir o isolamento

-- Para automation_flows
DROP POLICY IF EXISTS "Enable read access for authenticated users on flows" ON public.automation_flows;
DROP POLICY IF EXISTS "Enable write access for authenticated users on flows" ON public.automation_flows;
CREATE POLICY "flows_agency_isolation_select" ON public.automation_flows FOR SELECT TO authenticated USING (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "flows_agency_isolation_insert" ON public.automation_flows FOR INSERT TO authenticated WITH CHECK (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "flows_agency_isolation_update" ON public.automation_flows FOR UPDATE TO authenticated USING (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "flows_agency_isolation_delete" ON public.automation_flows FOR DELETE TO authenticated USING (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));

-- Para automation_steps
DROP POLICY IF EXISTS "Enable read access for authenticated users on steps" ON public.automation_steps;
DROP POLICY IF EXISTS "Enable write access for authenticated users on steps" ON public.automation_steps;
CREATE POLICY "steps_agency_isolation_select" ON public.automation_steps FOR SELECT TO authenticated USING (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "steps_agency_isolation_insert" ON public.automation_steps FOR INSERT TO authenticated WITH CHECK (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "steps_agency_isolation_update" ON public.automation_steps FOR UPDATE TO authenticated USING (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "steps_agency_isolation_delete" ON public.automation_steps FOR DELETE TO authenticated USING (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));
