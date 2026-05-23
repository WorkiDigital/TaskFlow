import { supabase } from './supabase';
import { getCurrentUserAgency } from '@/lib/auth';

export interface CreateProjectInput {
  name: string;
  description?: string;
  client_id?: string;
  space_id?: string;
  status?: string;
  source?: string;
  template_id?: string;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {}

export async function getProjectSpaces() {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('project_spaces')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

export async function getProjects() {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_columns (*),
      project_tasks (
        *,
        project_task_checklists (*)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getProjectById(projectId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_spaces (name),
      project_columns (*),
      project_tasks (
        *,
        project_task_checklists (*)
      )
    `)
    .eq('id', projectId)
    .single();

  if (error) throw error;
  return data;
}

export async function createProject(input: CreateProjectInput) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data: userData } = await supabase
    .from('users')
    .select('agency_id')
    .eq('id', user.user.id)
    .single();

  if (!userData?.agency_id) throw new Error('User has no agency_id');

  const { data, error } = await supabase
    .from('projects')
    .insert([
      {
        agency_id: userData.agency_id,
        client_id: input.client_id,
        space_id: input.space_id,
        name: input.name,
        description: input.description,
        status: input.status || 'planning',
        source: input.source || 'manual',
        template_id: input.template_id,
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProject(projectId: string, input: UpdateProjectInput) {
  const { data, error } = await supabase
    .from('projects')
    .update(input)
    .eq('id', projectId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Additional functions
export interface CreateProjectColumnInput {
  project_id: string;
  title: string;
  position: number;
  color?: string;
  is_final_column?: boolean;
}

export async function createProjectColumn(input: CreateProjectColumnInput) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data: userData } = await supabase.from('users').select('agency_id').eq('id', user.user.id).single();

  const { data, error } = await supabase
    .from('project_columns')
    .insert([{
      agency_id: userData!.agency_id,
      ...input
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export interface CreateProjectTaskInput {
  project_id: string;
  column_id?: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assignee_id?: string;
  due_date?: string;
  position?: number;
  source?: string;
  template_task_id?: string;
}

export async function createProjectTask(input: CreateProjectTaskInput) {
  const { data: user } = await supabase.auth.getUser();
  const { data: userData } = await supabase.from('users').select('agency_id').eq('id', user.user!.id).single();

  const { data, error } = await supabase
    .from('project_tasks')
    .insert([{
      agency_id: userData!.agency_id,
      ...input,
      status: input.status ?? (input.column_id ? 'active' : 'backlog'),
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProjectTask(taskId: string, input: Partial<CreateProjectTaskInput>) {
  const { data, error } = await supabase
    .from('project_tasks')
    .update(input)
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function moveProjectTask(taskId: string, targetColumnId: string, position: number) {
  return updateProjectTask(taskId, { column_id: targetColumnId, position });
}

export interface CreateProjectActivityInput {
  project_id: string;
  task_id?: string;
  type: string;
  message: string;
  metadata?: any;
}

export async function createProjectActivity(input: CreateProjectActivityInput) {
  const { data: user } = await supabase.auth.getUser();
  const { data: userData } = await supabase.from('users').select('agency_id').eq('id', user.user!.id).single();

  const { data, error } = await supabase
    .from('project_activities')
    .insert([{
      agency_id: userData!.agency_id,
      ...input
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export interface CreateProjectFromTemplateInput {
  template_id: string;
  client_id?: string;
  name: string;
}

export async function createProjectFromTemplate(input: CreateProjectFromTemplateInput) {
  console.log('[ProjectsService] createProjectFromTemplate NOT IMPLEMENTED ON FRONTEND. Should be run on Edge Function.');
  // Return dummy to avoid breaking UI if called directly.
  return null;
}

export async function createProjectSpace(name: string, color?: string) {
  const { agencyId } = await getCurrentUserAgency();
  const { data, error } = await supabase
    .from('project_spaces')
    .insert([{ agency_id: agencyId, name, color: color ?? 'bg-blue-500' }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProjectSpace(id: string) {
  const { error } = await supabase.from('project_spaces').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}

export async function updateProjectSpace(id: string, name: string) {
  const { data, error } = await supabase
    .from('project_spaces')
    .update({ name })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
