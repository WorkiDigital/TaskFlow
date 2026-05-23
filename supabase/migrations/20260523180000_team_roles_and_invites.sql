-- Migration para Tabela de Cargos (Agency Roles) e melhorias na Trigger de Usuários

-- 1. Criação da tabela de agency_roles
CREATE TABLE IF NOT EXISTS public.agency_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, name)
);

-- Habilitar RLS para agency_roles
ALTER TABLE public.agency_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON public.agency_roles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Adicionar agency_role_id na tabela users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS agency_role_id UUID REFERENCES public.agency_roles(id) ON DELETE SET NULL;

-- 3. Atualizar a trigger handle_new_user para considerar metadata customizado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_agency_id UUID;
  v_role TEXT;
  v_agency_role_id UUID;
  v_full_name TEXT;
BEGIN
  -- Definir valores padrão caso não venham no metadata
  v_agency_id := (new.raw_user_meta_data->>'agency_id')::UUID;
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'admin');
  v_agency_role_id := (new.raw_user_meta_data->>'agency_role_id')::UUID;
  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));

  -- Se não vier agency_id no metadata, tenta achar ou criar a agência padrão
  IF v_agency_id IS NULL THEN
    SELECT id INTO v_agency_id FROM public.agencies LIMIT 1;
    IF v_agency_id IS NULL THEN
      v_agency_id := gen_random_uuid();
      INSERT INTO public.agencies (id, name)
      VALUES (v_agency_id, 'Minha Agência Padrão');
    END IF;
  END IF;

  -- Inserir usuário na public.users
  INSERT INTO public.users (id, role, full_name, email, agency_id, agency_role_id)
  VALUES (
    new.id,
    v_role,
    v_full_name,
    new.email,
    v_agency_id,
    v_agency_role_id
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(users.full_name, EXCLUDED.full_name),
    agency_id = COALESCE(users.agency_id, EXCLUDED.agency_id),
    role = COALESCE(users.role, EXCLUDED.role),
    agency_role_id = COALESCE(users.agency_role_id, EXCLUDED.agency_role_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
