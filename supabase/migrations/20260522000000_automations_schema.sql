-- Migração: Criação das tabelas para o Módulo de Automações Modulares

-- 1. Tabela de Fluxos de Automação
CREATE TABLE IF NOT EXISTS public.automation_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    mode TEXT NOT NULL DEFAULT 'custom',
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabela de Etapas do Fluxo (Steps)
CREATE TABLE IF NOT EXISTS public.automation_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id UUID NOT NULL REFERENCES public.automation_flows(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    step_order INTEGER NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    is_automatic BOOLEAN NOT NULL DEFAULT true,
    depends_on TEXT[] DEFAULT '{}',
    config JSONB DEFAULT '{}'::jsonb,
    config_status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabela de Variáveis Dinâmicas
CREATE TABLE IF NOT EXISTS public.automation_variables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    source TEXT NOT NULL,
    mock_value TEXT,
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inserir as variáveis de sistema padrão (is_system = true)
INSERT INTO public.automation_variables (key, name, source, mock_value, is_system)
VALUES 
    ('{{nome_cliente}}', 'Nome do Cliente', 'client', 'João Silva', true),
    ('{{empresa_cliente}}', 'Empresa', 'client', 'Acme Corp', true),
    ('{{email_cliente}}', 'E-mail do Cliente', 'client', 'joao@acme.com', true),
    ('{{telefone_cliente}}', 'Telefone do Cliente', 'client', '5511999999999', true),
    ('{{nome_agencia}}', 'Nome da Agência', 'agency', 'Agência Prime', true),
    ('{{nome_projeto}}', 'Nome do Projeto', 'project', 'Lançamento Web 3.0', true),
    ('{{valor_projeto}}', 'Valor do Projeto', 'project', 'R$ 15.000,00', true),
    ('{{link_formulario_contrato}}', 'Link Form Contrato', 'form', 'https://forms.app/contrato/123', true),
    ('{{link_google_drive}}', 'Link do Drive', 'project', 'https://drive.google.com/folders/xyz', true)
ON CONFLICT (key) DO NOTHING;

-- Configurar RLS (Row Level Security) básico para as tabelas
ALTER TABLE public.automation_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_variables ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (Simplificadas para o MVP: usuários autenticados podem ler e escrever)
CREATE POLICY "Enable read access for authenticated users on flows" ON public.automation_flows FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable write access for authenticated users on flows" ON public.automation_flows FOR ALL TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users on steps" ON public.automation_steps FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable write access for authenticated users on steps" ON public.automation_steps FOR ALL TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users on variables" ON public.automation_variables FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable write access for authenticated users on variables" ON public.automation_variables FOR ALL TO authenticated USING (true);
