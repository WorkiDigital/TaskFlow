-- Migração 4: Adicionar políticas RLS de INSERT, UPDATE e DELETE para workspaces e workspace_members

-- Para workspaces
CREATE POLICY "workspaces_insert" ON public.workspaces FOR INSERT TO authenticated
WITH CHECK (public.is_agency_member(agency_id));

CREATE POLICY "workspaces_update" ON public.workspaces FOR UPDATE TO authenticated
USING (public.is_agency_member(agency_id))
WITH CHECK (public.is_agency_member(agency_id));

CREATE POLICY "workspaces_delete" ON public.workspaces FOR DELETE TO authenticated
USING (public.is_agency_member(agency_id));

-- Para workspace_members
CREATE POLICY "workspace_members_insert" ON public.workspace_members FOR INSERT TO authenticated
WITH CHECK (public.is_agency_member(agency_id));

CREATE POLICY "workspace_members_update" ON public.workspace_members FOR UPDATE TO authenticated
USING (public.is_agency_member(agency_id))
WITH CHECK (public.is_agency_member(agency_id));

CREATE POLICY "workspace_members_delete" ON public.workspace_members FOR DELETE TO authenticated
USING (public.is_agency_member(agency_id));
