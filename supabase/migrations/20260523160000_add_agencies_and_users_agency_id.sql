-- Criação da tabela de agências caso não exista
CREATE TABLE IF NOT EXISTS public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Sua Agência',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adiciona a coluna agency_id na tabela users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL;

-- Para usuários já existentes que não tem agency_id, cria uma agência padrão e associa
DO $$ 
DECLARE
  user_rec RECORD;
  new_agency_id UUID;
BEGIN
  FOR user_rec IN SELECT id FROM public.users WHERE agency_id IS NULL LOOP
    new_agency_id := gen_random_uuid();
    INSERT INTO public.agencies (id, name) VALUES (new_agency_id, 'Minha Agência Padrão');
    UPDATE public.users SET agency_id = new_agency_id WHERE id = user_rec.id;
  END LOOP;
END $$;
