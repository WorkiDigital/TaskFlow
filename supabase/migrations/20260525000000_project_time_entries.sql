-- supabase/migrations/20260525000000_project_time_entries.sql

CREATE TABLE IF NOT EXISTS public.project_time_entries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    task_id uuid NOT NULL REFERENCES public.project_tasks(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mode text NOT NULL CHECK (mode IN ('manual', 'timer')),
    status text NOT NULL CHECK (status IN ('running', 'paused', 'ended')),
    started_at timestamptz,
    paused_at timestamptz,
    ended_at timestamptz,
    duration_seconds integer DEFAULT 0,
    note text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_entries_agency_id ON public.project_time_entries(agency_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_task_id ON public.project_time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON public.project_time_entries(user_id);

-- Enable RLS
ALTER TABLE public.project_time_entries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view time entries from their agency"
    ON public.project_time_entries FOR SELECT
    USING (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert time entries for their agency"
    ON public.project_time_entries FOR INSERT
    WITH CHECK (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update time entries from their agency"
    ON public.project_time_entries FOR UPDATE
    USING (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can delete time entries from their agency"
    ON public.project_time_entries FOR DELETE
    USING (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));

-- Create function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER set_project_time_entries_updated_at
    BEFORE UPDATE ON public.project_time_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
