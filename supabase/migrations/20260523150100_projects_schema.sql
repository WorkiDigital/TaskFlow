-- Tabela project_spaces
create table if not exists project_spaces (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null,
  name text not null,
  description text,
  color text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table project_spaces add column if not exists agency_id uuid not null;

-- Tabela projects
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid null,
  space_id uuid references project_spaces(id) on delete set null,
  name text not null,
  description text,
  status text check (status in ('planning', 'active', 'paused', 'completed')) default 'planning',
  source text check (source in ('manual', 'template', 'contract_signed', 'onboarding', 'automation')) default 'manual',
  template_id uuid null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table projects add column if not exists agency_id uuid not null;

-- Tabela project_columns
create table if not exists project_columns (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null,
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  position integer default 0,
  color text,
  is_final_column boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table project_columns add column if not exists agency_id uuid not null;

-- Tabela project_tasks
create table if not exists project_tasks (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null,
  project_id uuid references projects(id) on delete cascade,
  column_id uuid references project_columns(id) on delete set null,
  title text not null,
  description text,
  status text,
  priority text check (priority in ('low', 'medium', 'high', 'urgent')) default 'medium',
  assignee_id uuid null,
  due_date date,
  position integer default 0,
  source text check (source in ('manual', 'template', 'automation', 'recurring')) default 'manual',
  template_task_id uuid null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table project_tasks add column if not exists agency_id uuid not null;

-- Tabela project_task_checklists
create table if not exists project_task_checklists (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null,
  task_id uuid references project_tasks(id) on delete cascade,
  title text not null,
  is_done boolean default false,
  position integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table project_task_checklists add column if not exists agency_id uuid not null;

-- Tabela project_activities
create table if not exists project_activities (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null,
  project_id uuid references projects(id) on delete cascade,
  task_id uuid references project_tasks(id) on delete set null,
  type text not null,
  message text not null,
  metadata jsonb default '{}',
  created_at timestamp with time zone default now()
);
alter table project_activities add column if not exists agency_id uuid not null;

-- RLS (Row Level Security)
alter table project_spaces enable row level security;
alter table projects enable row level security;
alter table project_columns enable row level security;
alter table project_tasks enable row level security;
alter table project_task_checklists enable row level security;
alter table project_activities enable row level security;

-- Policies for project_spaces
create policy "Users can view their agency project_spaces"
  on project_spaces for select
  using (agency_id = (select agency_id from users where id = auth.uid()));

create policy "Users can insert their agency project_spaces"
  on project_spaces for insert
  with check (agency_id = (select agency_id from users where id = auth.uid()));

create policy "Users can update their agency project_spaces"
  on project_spaces for update
  using (agency_id = (select agency_id from users where id = auth.uid()));

create policy "Users can delete their agency project_spaces"
  on project_spaces for delete
  using (agency_id = (select agency_id from users where id = auth.uid()));

-- Policies for projects
create policy "Users can view their agency projects"
  on projects for select
  using (agency_id = (select agency_id from users where id = auth.uid()));

create policy "Users can insert their agency projects"
  on projects for insert
  with check (agency_id = (select agency_id from users where id = auth.uid()));

create policy "Users can update their agency projects"
  on projects for update
  using (agency_id = (select agency_id from users where id = auth.uid()));

create policy "Users can delete their agency projects"
  on projects for delete
  using (agency_id = (select agency_id from users where id = auth.uid()));

-- Policies for project_columns
create policy "Users can view their agency project_columns"
  on project_columns for select
  using (agency_id = (select agency_id from users where id = auth.uid()));

create policy "Users can insert their agency project_columns"
  on project_columns for insert
  with check (agency_id = (select agency_id from users where id = auth.uid()));

create policy "Users can update their agency project_columns"
  on project_columns for update
  using (agency_id = (select agency_id from users where id = auth.uid()));

create policy "Users can delete their agency project_columns"
  on project_columns for delete
  using (agency_id = (select agency_id from users where id = auth.uid()));

-- Policies for project_tasks
create policy "Users can view their agency project_tasks"
  on project_tasks for select
  using (agency_id = (select agency_id from users where id = auth.uid()));

create policy "Users can insert their agency project_tasks"
  on project_tasks for insert
  with check (agency_id = (select agency_id from users where id = auth.uid()));

create policy "Users can update their agency project_tasks"
  on project_tasks for update
  using (agency_id = (select agency_id from users where id = auth.uid()));

create policy "Users can delete their agency project_tasks"
  on project_tasks for delete
  using (agency_id = (select agency_id from users where id = auth.uid()));

-- Policies for project_task_checklists
create policy "Users can view their agency project_task_checklists"
  on project_task_checklists for select
  using (agency_id = (select agency_id from users where id = auth.uid()));

create policy "Users can insert their agency project_task_checklists"
  on project_task_checklists for insert
  with check (agency_id = (select agency_id from users where id = auth.uid()));

create policy "Users can update their agency project_task_checklists"
  on project_task_checklists for update
  using (agency_id = (select agency_id from users where id = auth.uid()));

create policy "Users can delete their agency project_task_checklists"
  on project_task_checklists for delete
  using (agency_id = (select agency_id from users where id = auth.uid()));

-- Policies for project_activities
create policy "Users can view their agency project_activities"
  on project_activities for select
  using (agency_id = (select agency_id from users where id = auth.uid()));

create policy "Users can insert their agency project_activities"
  on project_activities for insert
  with check (agency_id = (select agency_id from users where id = auth.uid()));

create policy "Users can update their agency project_activities"
  on project_activities for update
  using (agency_id = (select agency_id from users where id = auth.uid()));

create policy "Users can delete their agency project_activities"
  on project_activities for delete
  using (agency_id = (select agency_id from users where id = auth.uid()));
