-- Migration: Team Management V2
-- Extension of users table, creation of invites and role permissions

-- 1. Alter check constraint on users role
-- Dropping check constraint on role if it exists (usually users_role_check)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('owner', 'admin', 'manager', 'team', 'client'));

-- 2. Add columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('active', 'invited', 'inactive', 'suspended')) DEFAULT 'invited';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing users to 'active' and 'admin' (if they were admin) or 'team' (if member)
UPDATE public.users SET status = 'active' WHERE status IS NULL;
UPDATE public.users SET role = 'team' WHERE role = 'member';
UPDATE public.users SET role = 'admin' WHERE role = 'admin' AND role NOT IN ('owner', 'admin');

-- 3. Create team_invites table
CREATE TABLE IF NOT EXISTS public.team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'manager', 'team', 'client')) DEFAULT 'team',
  department TEXT,
  job_title TEXT,
  invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')) DEFAULT 'pending',
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create role_permissions table
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'team', 'client')),
  permission_key TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, role, permission_key)
);

-- 5. Enable RLS
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for team_invites
DROP POLICY IF EXISTS "team_invites_select_policy" ON public.team_invites;
CREATE POLICY "team_invites_select_policy" ON public.team_invites
  FOR SELECT
  USING (
    (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid())) OR
    (status = 'pending')
  );

DROP POLICY IF EXISTS "team_invites_write_policy" ON public.team_invites;
CREATE POLICY "team_invites_write_policy" ON public.team_invites
  FOR ALL
  TO authenticated
  USING (
    agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()) AND
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('owner', 'admin')
  );

-- 7. RLS Policies for role_permissions
DROP POLICY IF EXISTS "role_permissions_select_policy" ON public.role_permissions;
CREATE POLICY "role_permissions_select_policy" ON public.role_permissions
  FOR SELECT
  TO authenticated
  USING (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "role_permissions_write_policy" ON public.role_permissions;
CREATE POLICY "role_permissions_write_policy" ON public.role_permissions
  FOR ALL
  TO authenticated
  USING (
    agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()) AND
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'owner'
  );

-- 8. Populate default role permissions function
CREATE OR REPLACE FUNCTION public.populate_default_role_permissions(v_agency_id UUID)
RETURNS VOID AS $$
DECLARE
  v_perms TEXT[];
  v_perm TEXT;
BEGIN
  v_perms := ARRAY[
    'manage_agency_settings', 'manage_integrations', 'manage_team', 
    'manage_clients', 'manage_contracts', 'send_contracts', 
    'manage_onboarding', 'manage_automations', 'manage_templates', 
    'manage_projects', 'create_tasks', 'assign_tasks', 
    'approve_agent_actions', 'execute_agent_actions', 
    'view_all_projects', 'view_assigned_projects', 'view_dashboard'
  ];

  -- OWNER has all permissions
  FOREACH v_perm IN ARRAY v_perms LOOP
    INSERT INTO public.role_permissions (agency_id, role, permission_key, enabled)
    VALUES (v_agency_id, 'owner', v_perm, TRUE)
    ON CONFLICT (agency_id, role, permission_key) DO NOTHING;
  END LOOP;

  -- ADMIN has all except manage_agency_settings and manage_integrations
  FOREACH v_perm IN ARRAY v_perms LOOP
    IF v_perm NOT IN ('manage_agency_settings', 'manage_integrations') THEN
      INSERT INTO public.role_permissions (agency_id, role, permission_key, enabled)
      VALUES (v_agency_id, 'admin', v_perm, TRUE)
      ON CONFLICT (agency_id, role, permission_key) DO NOTHING;
    ELSE
      INSERT INTO public.role_permissions (agency_id, role, permission_key, enabled)
      VALUES (v_agency_id, 'admin', v_perm, FALSE)
      ON CONFLICT (agency_id, role, permission_key) DO NOTHING;
    END IF;
  END LOOP;

  -- MANAGER can view projects, manage tasks, clients, templates, approve basic agent actions
  FOREACH v_perm IN ARRAY v_perms LOOP
    IF v_perm IN ('manage_clients', 'manage_projects', 'create_tasks', 'assign_tasks', 'view_all_projects', 'view_dashboard', 'approve_agent_actions') THEN
      INSERT INTO public.role_permissions (agency_id, role, permission_key, enabled)
      VALUES (v_agency_id, 'manager', v_perm, TRUE)
      ON CONFLICT (agency_id, role, permission_key) DO NOTHING;
    ELSE
      INSERT INTO public.role_permissions (agency_id, role, permission_key, enabled)
      VALUES (v_agency_id, 'manager', v_perm, FALSE)
      ON CONFLICT (agency_id, role, permission_key) DO NOTHING;
    END IF;
  END LOOP;

  -- TEAM can view assigned projects, create/assign tasks, and view dashboard
  FOREACH v_perm IN ARRAY v_perms LOOP
    IF v_perm IN ('create_tasks', 'assign_tasks', 'view_assigned_projects', 'view_dashboard') THEN
      INSERT INTO public.role_permissions (agency_id, role, permission_key, enabled)
      VALUES (v_agency_id, 'team', v_perm, TRUE)
      ON CONFLICT (agency_id, role, permission_key) DO NOTHING;
    ELSE
      INSERT INTO public.role_permissions (agency_id, role, permission_key, enabled)
      VALUES (v_agency_id, 'team', v_perm, FALSE)
      ON CONFLICT (agency_id, role, permission_key) DO NOTHING;
    END IF;
  END LOOP;

  -- CLIENT has none enabled by default
  FOREACH v_perm IN ARRAY v_perms LOOP
    INSERT INTO public.role_permissions (agency_id, role, permission_key, enabled)
    VALUES (v_agency_id, 'client', v_perm, FALSE)
    ON CONFLICT (agency_id, role, permission_key) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to populate default permissions when a new agency is created
CREATE OR REPLACE FUNCTION public.handle_new_agency_permissions()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.populate_default_role_permissions(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_agency_created ON public.agencies;
CREATE TRIGGER on_agency_created
  AFTER INSERT ON public.agencies
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_agency_permissions();

-- Run default permissions setup for all existing agencies
DO $$
DECLARE
  v_ag_rec RECORD;
BEGIN
  FOR v_ag_rec IN SELECT id FROM public.agencies LOOP
    PERFORM public.populate_default_role_permissions(v_ag_rec.id);
  END LOOP;
END $$;

-- 9. Update the user creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_agency_id UUID;
  v_role TEXT;
  v_agency_role_id UUID;
  v_full_name TEXT;
  v_invite_token TEXT;
  v_department TEXT;
  v_job_title TEXT;
  v_status TEXT := 'active';
  v_invite_rec RECORD;
BEGIN
  -- Check if there is an invite token in raw_user_meta_data
  v_invite_token := new.raw_user_meta_data->>'invite_token';
  
  IF v_invite_token IS NOT NULL THEN
    -- Try to find and consume the invite
    SELECT id, agency_id, role, department, job_title 
    INTO v_invite_rec 
    FROM public.team_invites 
    WHERE token = v_invite_token AND status = 'pending' AND (expires_at IS NULL OR expires_at > NOW());
    
    IF v_invite_rec.id IS NOT NULL THEN
      v_agency_id := v_invite_rec.agency_id;
      v_role := v_invite_rec.role;
      v_department := v_invite_rec.department;
      v_job_title := v_invite_rec.job_title;
      v_status := 'active';
      
      -- Mark invite as accepted
      UPDATE public.team_invites 
      SET status = 'accepted', accepted_at = NOW() 
      WHERE id = v_invite_rec.id;
    ELSE
      -- Fallback if invite token was invalid or expired
      v_agency_id := (new.raw_user_meta_data->>'agency_id')::UUID;
      v_role := COALESCE(new.raw_user_meta_data->>'role', 'team');
      v_department := new.raw_user_meta_data->>'department';
      v_job_title := new.raw_user_meta_data->>'job_title';
    END IF;
  ELSE
    -- Regular signup
    v_agency_id := (new.raw_user_meta_data->>'agency_id')::UUID;
    v_role := COALESCE(new.raw_user_meta_data->>'role', 'admin'); -- Default admin for direct signups
    v_department := new.raw_user_meta_data->>'department';
    v_job_title := new.raw_user_meta_data->>'job_title';
  END IF;

  v_agency_role_id := (new.raw_user_meta_data->>'agency_role_id')::UUID;
  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));

  -- Se não tiver agency_id, associa a uma agência existente ou cria
  IF v_agency_id IS NULL THEN
    SELECT id INTO v_agency_id FROM public.agencies LIMIT 1;
    IF v_agency_id IS NULL THEN
      v_agency_id := gen_random_uuid();
      INSERT INTO public.agencies (id, name)
      VALUES (v_agency_id, 'Minha Agência Padrão');
    END IF;
  END IF;

  -- Inserir usuário na public.users
  INSERT INTO public.users (id, role, full_name, email, agency_id, agency_role_id, department, job_title, status)
  VALUES (
    new.id,
    v_role,
    v_full_name,
    new.email,
    v_agency_id,
    v_agency_role_id,
    v_department,
    v_job_title,
    v_status
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(users.full_name, EXCLUDED.full_name),
    agency_id = COALESCE(users.agency_id, EXCLUDED.agency_id),
    role = COALESCE(users.role, EXCLUDED.role),
    agency_role_id = COALESCE(users.agency_role_id, EXCLUDED.agency_role_id),
    department = COALESCE(users.department, EXCLUDED.department),
    job_title = COALESCE(users.job_title, EXCLUDED.job_title),
    status = COALESCE(users.status, EXCLUDED.status),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
