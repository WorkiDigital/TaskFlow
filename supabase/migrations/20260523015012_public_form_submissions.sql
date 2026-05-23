CREATE TABLE IF NOT EXISTS public.form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for anon on form submissions"
  ON public.form_submissions FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Enable read for authenticated on form submissions"
  ON public.form_submissions FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS form_submissions_form_id_idx ON public.form_submissions(form_id);
CREATE INDEX IF NOT EXISTS form_submissions_client_id_idx ON public.form_submissions(client_id);
