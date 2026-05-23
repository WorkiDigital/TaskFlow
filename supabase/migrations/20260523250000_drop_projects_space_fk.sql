-- Drop FK constraint that blocks project creation when space_id validation fails.
-- The project_spaces join was removed from getProjects() so this FK is not needed.
ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_space_id_fkey;
