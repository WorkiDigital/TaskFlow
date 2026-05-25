-- Migração 2: Criação de Workspace Padrão e migração dos dados

-- 1. Inserir agências que por ventura não existam na tabela agencies (garantia de integridade)
INSERT INTO public.agencies (id, name)
SELECT DISTINCT agency_id, 'Agência ' || substr(agency_id::text, 1, 8)
FROM public.users
WHERE agency_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- 2. Criar agency_members para todos os usuários baseados no seu users.agency_id atual
INSERT INTO public.agency_members (agency_id, user_id, role, status)
SELECT agency_id, id, 'admin', 'active'
FROM public.users
WHERE agency_id IS NOT NULL
ON CONFLICT (agency_id, user_id) DO NOTHING;

-- 3. Criar o workspace "Operação Principal" para cada agência existente
DO $$
DECLARE
  ag record;
  new_ws_id uuid;
BEGIN
  FOR ag IN SELECT id FROM public.agencies
  LOOP
    -- Verifica se já tem
    IF NOT EXISTS (SELECT 1 FROM public.workspaces WHERE agency_id = ag.id AND name = 'Operação Principal') THEN
      new_ws_id := gen_random_uuid();
      
      INSERT INTO public.workspaces (id, agency_id, name, type, status)
      VALUES (new_ws_id, ag.id, 'Operação Principal', 'Operação interna', 'active');
      
      -- 4. Adicionar todos os agency_members deste agency ao workspace como admins
      INSERT INTO public.workspace_members (agency_id, workspace_id, user_id, role, status)
      SELECT ag.id, new_ws_id, user_id, 'admin', 'active'
      FROM public.agency_members
      WHERE agency_id = ag.id
      ON CONFLICT (workspace_id, user_id) DO NOTHING;

      -- 5. Atualizar todas as tabelas operacionais para este workspace
      -- Se a tabela não existir na base, tratamos isso via dinâmico ou sabemos que ela já existe.
      -- Todas essas tabelas foram criadas nas migrations anteriores, então podemos fazer o UPDATE normal.
      
      UPDATE public.project_spaces SET workspace_id = new_ws_id WHERE agency_id = ag.id AND workspace_id IS NULL;
      UPDATE public.projects SET workspace_id = new_ws_id WHERE agency_id = ag.id AND workspace_id IS NULL;
      UPDATE public.project_columns SET workspace_id = new_ws_id WHERE agency_id = ag.id AND workspace_id IS NULL;
      UPDATE public.project_tasks SET workspace_id = new_ws_id WHERE agency_id = ag.id AND workspace_id IS NULL;
      UPDATE public.project_task_checklists SET workspace_id = new_ws_id WHERE agency_id = ag.id AND workspace_id IS NULL;
      UPDATE public.project_activities SET workspace_id = new_ws_id WHERE agency_id = ag.id AND workspace_id IS NULL;
      UPDATE public.project_time_entries SET workspace_id = new_ws_id WHERE agency_id = ag.id AND workspace_id IS NULL;
      
      IF to_regclass('public.project_docs') IS NOT NULL THEN
        UPDATE public.project_docs SET workspace_id = new_ws_id WHERE agency_id = ag.id AND workspace_id IS NULL;
      END IF;
      
      IF to_regclass('public.project_files') IS NOT NULL THEN
        UPDATE public.project_files SET workspace_id = new_ws_id WHERE agency_id = ag.id AND workspace_id IS NULL;
      END IF;

      -- Templates / Automations
      IF to_regclass('public.agency_templates') IS NOT NULL THEN
        UPDATE public.agency_templates SET workspace_id = new_ws_id WHERE agency_id = ag.id AND workspace_id IS NULL;
      END IF;
      
      IF to_regclass('public.template_columns') IS NOT NULL THEN
        UPDATE public.template_columns SET workspace_id = new_ws_id WHERE workspace_id IS NULL AND template_id IN (SELECT id FROM public.agency_templates WHERE agency_id = ag.id);
      END IF;
      
      IF to_regclass('public.template_tasks') IS NOT NULL THEN
        UPDATE public.template_tasks SET workspace_id = new_ws_id WHERE workspace_id IS NULL AND template_id IN (SELECT id FROM public.agency_templates WHERE agency_id = ag.id);
      END IF;
      
      IF to_regclass('public.template_task_checklists') IS NOT NULL THEN
        UPDATE public.template_task_checklists SET workspace_id = new_ws_id WHERE workspace_id IS NULL AND template_task_id IN (SELECT id FROM public.template_tasks WHERE workspace_id = new_ws_id);
      END IF;
      
      IF to_regclass('public.automation_flows') IS NOT NULL THEN
        UPDATE public.automation_flows SET workspace_id = new_ws_id WHERE agency_id = ag.id AND workspace_id IS NULL;
      END IF;
      
      IF to_regclass('public.automation_steps') IS NOT NULL THEN
        UPDATE public.automation_steps SET workspace_id = new_ws_id WHERE agency_id = ag.id AND workspace_id IS NULL;
      END IF;

    END IF;
  END LOOP;
END $$;
