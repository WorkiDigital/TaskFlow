-- Tabela agency_templates
create table if not exists agency_templates (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null,
  name text not null,
  description text,
  category text,
  status text check (status in ('active', 'draft', 'paused', 'archived')) default 'draft',
  linked_contract_template_id uuid null,
  date_base text check (date_base in ('contract_signed_at', 'project_start_date', 'briefing_completed_at', 'manual_date')) default 'contract_signed_at',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Tabela template_columns
create table if not exists template_columns (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null,
  template_id uuid references agency_templates(id) on delete cascade,
  title text not null,
  position integer default 0,
  color text,
  is_final_column boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Tabela template_tasks
create table if not exists template_tasks (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null,
  template_id uuid references agency_templates(id) on delete cascade,
  template_column_id uuid references template_columns(id) on delete set null,
  title text not null,
  description text,
  priority text check (priority in ('low', 'medium', 'high', 'urgent')) default 'medium',
  assignee_rule jsonb,
  relative_due_date jsonb,
  dependencies jsonb default '[]',
  tags jsonb default '[]',
  visibility text check (visibility in ('internal', 'client_visible')) default 'internal',
  position integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Tabela template_task_checklists
create table if not exists template_task_checklists (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null,
  template_task_id uuid references template_tasks(id) on delete cascade,
  title text not null,
  position integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Tabela template_assignment_rules
create table if not exists template_assignment_rules (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null,
  template_id uuid references agency_templates(id) on delete cascade,
  role_key text,
  role_label text,
  fallback_strategy text check (fallback_strategy in ('project_manager', 'unassigned', 'manual_review')) default 'manual_review',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- RLS (Row Level Security)
alter table agency_templates enable row level security;
alter table template_columns enable row level security;
alter table template_tasks enable row level security;
alter table template_task_checklists enable row level security;
alter table template_assignment_rules enable row level security;

-- Policies for agency_templates
create policy "Users can view their agency templates"
  on agency_templates for select
  using (agency_id = (select agency_id from users where id = auth.uid()));

create policy "Users can insert their agency templates"
  on agency_templates for insert
  with check (agency_id = (select agency_id from users where id = auth.uid()));

create policy "Users can update their agency templates"
  on agency_templates for update
  using (agency_id = (select agency_id from users where id = auth.uid()));

create policy "Users can delete their agency templates"
  on agency_templates for delete
  using (agency_id = (select agency_id from users where id = auth.uid()));

-- Policies for template_columns
create policy "Users can view their agency template_columns"
  on template_columns for select
  using (agency_id = (select agency_id from users where id = auth.uid()));

create policy "Users can insert their agency template_columns"
  on template_columns for insert
  with check (agency_id = (select agency_id from users where id = auth.uid()));

create policy "Users can update their agency template_columns"
  on template_columns for update
  using (agency_id = (select agency_id from users where id = auth.uid()));

create policy "Users can delete their agency template_columns"
  on template_columns for delete
  using (agency_id = (select agency_id from users where id = auth.uid()));

-- Policies for template_tasks
create policy "Users can view their agency template_tasks"
  on template_tasks for select
  using (agency_id = (select agency_id from users where id = auth.uid()));

create policy "Users can insert their agency template_tasks"
  on template_tasks for insert
  with check (agency_id = (select agency_id from users where id = auth.uid()));

create policy "Users can update their agency template_tasks"
  on template_tasks for update
  using (agency_id = (select agency_id from users where id = auth.uid()));

create policy "Users can delete their agency template_tasks"
  on template_tasks for delete
  using (agency_id = (select agency_id from users where id = auth.uid()));

-- Policies for template_task_checklists
create policy "Users can view their agency template_task_checklists"
  on template_task_checklists for select
  using (agency_id = (select agency_id from users where id = auth.uid()));

create policy "Users can insert their agency template_task_checklists"
  on template_task_checklists for insert
  with check (agency_id = (select agency_id from users where id = auth.uid()));

create policy "Users can update their agency template_task_checklists"
  on template_task_checklists for update
  using (agency_id = (select agency_id from users where id = auth.uid()));

create policy "Users can delete their agency template_task_checklists"
  on template_task_checklists for delete
  using (agency_id = (select agency_id from users where id = auth.uid()));

-- Policies for template_assignment_rules
create policy "Users can view their agency template_assignment_rules"
  on template_assignment_rules for select
  using (agency_id = (select agency_id from users where id = auth.uid()));

create policy "Users can insert their agency template_assignment_rules"
  on template_assignment_rules for insert
  with check (agency_id = (select agency_id from users where id = auth.uid()));

create policy "Users can update their agency template_assignment_rules"
  on template_assignment_rules for update
  using (agency_id = (select agency_id from users where id = auth.uid()));

create policy "Users can delete their agency template_assignment_rules"
  on template_assignment_rules for delete
  using (agency_id = (select agency_id from users where id = auth.uid()));
