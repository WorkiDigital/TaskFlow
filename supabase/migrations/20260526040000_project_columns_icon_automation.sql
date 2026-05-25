-- Add icon and automation_config to project_columns
ALTER TABLE public.project_columns
  ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '📋',
  ADD COLUMN IF NOT EXISTS automation_config JSONB DEFAULT '{
    "notify_assignee": false,
    "notify_whatsapp_client": false,
    "mark_project_done": false
  }'::jsonb;
