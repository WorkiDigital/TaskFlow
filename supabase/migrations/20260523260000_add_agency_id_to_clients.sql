-- Migração: Adiciona a coluna agency_id na tabela clients e associa à agência padrão

-- 1. Adiciona a coluna agency_id se não existir
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL;

-- 2. Atualiza clientes existentes que não tem agency_id para associar a uma agência padrão
DO $$ 
DECLARE
  v_default_agency_id UUID;
BEGIN
  -- Obtém a primeira agência existente no banco
  SELECT id INTO v_default_agency_id FROM public.agencies LIMIT 1;
  
  -- Se por algum motivo nenhuma agência existir, criamos uma padrão
  IF v_default_agency_id IS NULL THEN
    v_default_agency_id := gen_random_uuid();
    INSERT INTO public.agencies (id, name) VALUES (v_default_agency_id, 'Agência Padrão');
  END IF;

  -- Associa a agência padrão para todos os clientes que ainda estão com agency_id nulo
  UPDATE public.clients SET agency_id = v_default_agency_id WHERE agency_id IS NULL;
END $$;
