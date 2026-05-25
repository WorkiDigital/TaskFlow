-- supabase/migrations/20260525010000_relax_agent_rls.sql

-- Relax RLS for agent_insights to allow all authenticated agency users to update/delete
DROP POLICY IF EXISTS "agent_insights_write" ON public.agent_insights;
CREATE POLICY "agent_insights_write" ON public.agent_insights
  FOR ALL TO authenticated
  USING (
    agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid())
  );

-- Relax RLS for agent_actions to allow all authenticated agency users to update/delete
DROP POLICY IF EXISTS "agent_actions_write" ON public.agent_actions;
CREATE POLICY "agent_actions_write" ON public.agent_actions
  FOR ALL TO authenticated
  USING (
    agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid())
  );
