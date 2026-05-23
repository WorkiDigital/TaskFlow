-- =====================================================================================
-- SUPABASE SCHEMA UPDATE - Gestão de Projetos Avançada (Estilo ClickUp)
-- =====================================================================================

-- 1. Espaços (Spaces) para agrupar projetos
CREATE TABLE IF NOT EXISTS spaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT DEFAULT 'bg-blue-500',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Atualização na tabela de Projetos (Projects)
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS space_id UUID REFERENCES spaces(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS members TEXT[] DEFAULT '{}'; -- Array of user names/initials for MVP

-- 3. Atualização na tabela de Colunas (Project Columns)
ALTER TABLE project_columns
  ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'bg-slate-500';

-- 4. Atualização na tabela de Tarefas (Tasks)
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS assignee TEXT,
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- 5. Comentários das Tarefas (Task Comments)
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Log de Atividades das Tarefas (Task Activity)
CREATE TABLE IF NOT EXISTS task_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Checklist das Tarefas (Task Checklists)
CREATE TABLE IF NOT EXISTS task_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  done BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- =====================================================================================
-- RLS (Row Level Security) - Habilitando acesso anônimo para o MVP rodar liso no localhost
-- =====================================================================================

ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for anon" ON spaces FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anon" ON task_comments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anon" ON task_activity FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anon" ON task_checklists FOR ALL TO anon USING (true) WITH CHECK (true);

-- =====================================================================================
-- SEED DATA (Opcional: Inserir os Espaços Padrões)
-- =====================================================================================
INSERT INTO spaces (name, color) VALUES 
('Marketing', 'bg-pink-500'),
('Tráfego Pago', 'bg-blue-500'),
('Design', 'bg-purple-500'),
('Lançamentos', 'bg-orange-500')
ON CONFLICT DO NOTHING;
