-- Fase 1a: Hierarquia de Espaços — Espaço pode conter Pastas

ALTER TABLE public.project_spaces
  ADD COLUMN IF NOT EXISTS parent_space_id UUID REFERENCES public.project_spaces(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS space_type TEXT DEFAULT 'space'
    CHECK (space_type IN ('space', 'folder'));

CREATE INDEX IF NOT EXISTS idx_project_spaces_parent ON public.project_spaces(parent_space_id);

-- Regra:
--   Espaço: parent_space_id IS NULL, space_type = 'space'
--   Pasta:  parent_space_id = <uuid>, space_type = 'folder'
-- Dados existentes ficam como 'space' (parent_space_id null, space_type 'space').
