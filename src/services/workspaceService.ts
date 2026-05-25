import { supabase } from "@/services/supabase";

export interface Workspace {
  id: string;
  agency_id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: string;
  status: string;
  users?: {
    full_name: string;
    email: string;
    avatar_url: string;
  };
}

export async function listUserWorkspaces() {
  // Pelo RLS de workspace_members e workspaces, se consultarmos workspaces
  // ele já traz apenas os que o usuário tem acesso ou os da agência se for admin
  const { data, error } = await supabase
    .from("workspaces")
    .select("*, workspace_members(role, status)")
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as (Workspace & { workspace_members: { role: string; status: string }[] })[];
}

export async function listAgencyWorkspaces(agencyId: string) {
  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("agency_id", agencyId)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as Workspace[];
}

export async function createWorkspace(input: {
  agency_id: string;
  name: string;
  description?: string;
  type: string;
}) {
  // O Supabase não retorna a view completa com memberships automaticamente.
  // Vamos criar o workspace e, em seguida, adicionar o criador como owner.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .insert({
      agency_id: input.agency_id,
      name: input.name,
      description: input.description,
      type: input.type,
      status: "active",
      created_by: user.id,
    })
    .select()
    .single();

  if (wsError) throw wsError;

  // Criar o membership do owner
  const { error: memberError } = await supabase
    .from("workspace_members")
    .insert({
      agency_id: input.agency_id,
      workspace_id: workspace.id,
      user_id: user.id,
      role: "owner",
      status: "active",
    });

  if (memberError) throw memberError;

  return workspace as Workspace;
}

export async function updateWorkspace(
  workspaceId: string,
  input: { name?: string; description?: string; type?: string }
) {
  const { data, error } = await supabase
    .from("workspaces")
    .update(input)
    .eq("id", workspaceId)
    .select()
    .single();

  if (error) throw error;
  return data as Workspace;
}

export async function archiveWorkspace(workspaceId: string) {
  const { error } = await supabase
    .from("workspaces")
    .update({ status: "archived" })
    .eq("id", workspaceId);

  if (error) throw error;
}

export async function getWorkspaceMembers(workspaceId: string) {
  const { data, error } = await supabase
    .from("workspace_members")
    .select(`
      id,
      workspace_id,
      user_id,
      role,
      status,
      users (
        full_name,
        email,
        avatar_url
      )
    `)
    .eq("workspace_id", workspaceId)
    .eq("status", "active");

  if (error) throw error;
  return data as unknown as WorkspaceMember[];
}

export async function inviteWorkspaceMember(input: {
  agency_id: string;
  workspace_id: string;
  user_id: string;
  role: string;
}) {
  const { data, error } = await supabase
    .from("workspace_members")
    .insert({
      agency_id: input.agency_id,
      workspace_id: input.workspace_id,
      user_id: input.user_id,
      role: input.role,
      status: "active", // Aqui podemos ter fluxo de aceite se for o caso, mas por padrão vamos adicionar direto se ele já é da agência
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeWorkspaceMember(workspaceId: string, userId: string) {
  const { error } = await supabase
    .from("workspace_members")
    .update({ status: "removed" })
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function ensureUserCanAccessWorkspace(workspaceId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (error || !data) return false;
  return true;
}

// Local Storage Helpers
const WS_STORAGE_KEY = "taskflow_active_workspace_id";

export function getLocalActiveWorkspaceId(): string | null {
  return localStorage.getItem(WS_STORAGE_KEY);
}

export function setLocalActiveWorkspaceId(workspaceId: string | null) {
  if (workspaceId) {
    localStorage.setItem(WS_STORAGE_KEY, workspaceId);
  } else {
    localStorage.removeItem(WS_STORAGE_KEY);
  }
}
