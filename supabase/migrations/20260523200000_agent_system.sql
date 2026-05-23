-- Migration: Agent System
-- Creates agent_insights, agent_actions, agent_execution_logs
-- Adds ai_provider config to agency_settings

-- 1. Add AI provider config to agency_settings
ALTER TABLE public.agency_settings
  ADD COLUMN IF NOT EXISTS ai_provider TEXT DEFAULT 'claude'
    CHECK (ai_provider IN ('claude', 'gpt', 'gemini')),
  ADD COLUMN IF NOT EXISTS ai_provider_keys JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_model TEXT DEFAULT NULL;
-- ai_model stores the selected model per provider, e.g. "claude-sonnet-4-6", "gpt-4o-mini", "gemini-1.5-flash"
-- NULL means use the default model for that provider

-- 2. Create agent_insights table
CREATE TABLE IF NOT EXISTS public.agent_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  context TEXT NOT NULL CHECK (context IN (
    'dashboard', 'projects', 'templates', 'automations', 'contracts', 'onboarding'
  )),
  context_entity_id UUID NULL,
  category TEXT NOT NULL CHECK (category IN ('gap', 'issue', 'opportunity', 'warning')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dismissed', 'acted_on')),
  generated_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  dismissed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create agent_actions table
CREATE TABLE IF NOT EXISTS public.agent_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  insight_id UUID REFERENCES public.agent_insights(id) ON DELETE SET NULL,
  context TEXT NOT NULL CHECK (context IN (
    'dashboard', 'projects', 'templates', 'automations', 'contracts', 'onboarding'
  )),
  action_type TEXT NOT NULL CHECK (action_type IN (
    'create_task',
    'create_task_checklist',
    'assign_task_owner',
    'update_due_date',
    'add_automation_step',
    'link_template_to_contract',
    'create_project_column',
    'update_task_priority'
  )),
  title TEXT NOT NULL,
  description TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  preview_items JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'dismissed', 'executed', 'failed'
  )),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  dismissed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  dismissed_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create agent_execution_logs table
CREATE TABLE IF NOT EXISTS public.agent_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  action_id UUID REFERENCES public.agent_actions(id) ON DELETE CASCADE,
  insight_id UUID REFERENCES public.agent_insights(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'analyze_started', 'analyze_completed', 'analyze_failed',
    'action_suggested', 'action_approved', 'action_dismissed',
    'execute_started', 'execute_completed', 'execute_failed'
  )),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable RLS
ALTER TABLE public.agent_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_execution_logs ENABLE ROW LEVEL SECURITY;

-- 6. RLS for agent_insights
DROP POLICY IF EXISTS "agent_insights_select" ON public.agent_insights;
CREATE POLICY "agent_insights_select" ON public.agent_insights
  FOR SELECT TO authenticated
  USING (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "agent_insights_write" ON public.agent_insights;
CREATE POLICY "agent_insights_write" ON public.agent_insights
  FOR ALL TO authenticated
  USING (
    agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()) AND
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('owner', 'admin', 'manager')
  );

-- 7. RLS for agent_actions
DROP POLICY IF EXISTS "agent_actions_select" ON public.agent_actions;
CREATE POLICY "agent_actions_select" ON public.agent_actions
  FOR SELECT TO authenticated
  USING (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "agent_actions_write" ON public.agent_actions;
CREATE POLICY "agent_actions_write" ON public.agent_actions
  FOR ALL TO authenticated
  USING (
    agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()) AND
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('owner', 'admin', 'manager')
  );

-- 8. RLS for agent_execution_logs
DROP POLICY IF EXISTS "agent_execution_logs_select" ON public.agent_execution_logs;
CREATE POLICY "agent_execution_logs_select" ON public.agent_execution_logs
  FOR SELECT TO authenticated
  USING (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "agent_execution_logs_insert" ON public.agent_execution_logs;
CREATE POLICY "agent_execution_logs_insert" ON public.agent_execution_logs
  FOR INSERT TO authenticated
  WITH CHECK (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));

-- 9. Indexes
CREATE INDEX IF NOT EXISTS agent_insights_agency_context_idx
  ON public.agent_insights(agency_id, context, status);

CREATE INDEX IF NOT EXISTS agent_insights_created_at_idx
  ON public.agent_insights(agency_id, created_at DESC);

CREATE INDEX IF NOT EXISTS agent_actions_insight_id_idx
  ON public.agent_actions(insight_id);

CREATE INDEX IF NOT EXISTS agent_actions_agency_status_idx
  ON public.agent_actions(agency_id, status);

CREATE INDEX IF NOT EXISTS agent_actions_agency_context_idx
  ON public.agent_actions(agency_id, context);

CREATE INDEX IF NOT EXISTS agent_execution_logs_action_id_idx
  ON public.agent_execution_logs(action_id);

CREATE INDEX IF NOT EXISTS agent_execution_logs_agency_created_idx
  ON public.agent_execution_logs(agency_id, created_at DESC);
