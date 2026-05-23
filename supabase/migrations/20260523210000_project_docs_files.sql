-- Migration: project_docs and project_files tables

CREATE TABLE IF NOT EXISTS public.project_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Documento sem título',
  content TEXT DEFAULT '',
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  size TEXT,
  file_type TEXT,
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.project_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Agency members can manage project_docs' AND tablename = 'project_docs') THEN
    CREATE POLICY "Agency members can manage project_docs"
      ON public.project_docs
      USING (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()))
      WITH CHECK (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Agency members can manage project_files' AND tablename = 'project_files') THEN
    CREATE POLICY "Agency members can manage project_files"
      ON public.project_files
      USING (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()))
      WITH CHECK (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_project_docs_project_id ON public.project_docs(project_id);
CREATE INDEX IF NOT EXISTS idx_project_docs_agency_id ON public.project_docs(agency_id);
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON public.project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_agency_id ON public.project_files(agency_id);
