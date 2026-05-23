import { supabase } from './supabase';

export interface AgencyRole {
  id: string;
  agency_id: string;
  name: string;
  permissions: Record<string, boolean>;
  created_at: string;
}

export interface TeamMember {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'member' | 'client';
  agency_role_id: string | null;
  agency_id: string;
  created_at: string;
  agency_role?: AgencyRole;
}

export const teamService = {
  // Obter todos os membros da agência atual
  async getAgencyMembers(): Promise<TeamMember[]> {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) throw new Error('Não autenticado');

    // Pegar o agency_id do user logado
    const { data: userData } = await supabase
      .from('users')
      .select('agency_id')
      .eq('id', authData.user.id)
      .single();

    if (!userData?.agency_id) return [];

    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        agency_role:agency_roles(*)
      `)
      .eq('agency_id', userData.agency_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as TeamMember[];
  },

  // Obter todos os cargos criados pela agência
  async getAgencyRoles(): Promise<AgencyRole[]> {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) throw new Error('Não autenticado');

    const { data: userData } = await supabase
      .from('users')
      .select('agency_id')
      .eq('id', authData.user.id)
      .single();

    if (!userData?.agency_id) return [];

    const { data, error } = await supabase
      .from('agency_roles')
      .select('*')
      .eq('agency_id', userData.agency_id)
      .order('name');

    if (error) throw error;
    return data as AgencyRole[];
  },

  // Criar um novo cargo customizado
  async createAgencyRole(name: string, permissions: Record<string, boolean> = {}): Promise<AgencyRole> {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) throw new Error('Não autenticado');

    const { data: userData } = await supabase
      .from('users')
      .select('agency_id')
      .eq('id', authData.user.id)
      .single();

    if (!userData?.agency_id) throw new Error('Usuário sem agência vinculada');

    const { data, error } = await supabase
      .from('agency_roles')
      .insert({
        agency_id: userData.agency_id,
        name,
        permissions
      })
      .select()
      .single();

    if (error) throw error;
    return data as AgencyRole;
  },

  // Atualizar um cargo existente
  async updateAgencyRole(id: string, name: string, permissions: Record<string, boolean>): Promise<AgencyRole> {
    const { data, error } = await supabase
      .from('agency_roles')
      .update({ name, permissions, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AgencyRole;
  },

  // Deletar um cargo
  async deleteAgencyRole(id: string): Promise<void> {
    const { error } = await supabase
      .from('agency_roles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Convidar um novo membro para a equipe
  async inviteMember(email: string, role: 'admin' | 'member', agency_role_id?: string, full_name?: string) {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) throw new Error('Não autenticado');

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`
        },
        body: JSON.stringify({ email, role, agency_role_id, full_name })
      }
    );

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Falha ao convidar membro');
    }

    return result;
  },

  // Atualizar nível de acesso / cargo de um membro
  async updateMemberRole(userId: string, role: 'admin' | 'member', agency_role_id: string | null) {
    const { data, error } = await supabase
      .from('users')
      .update({ role, agency_role_id })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as TeamMember;
  },

  // Remover membro da equipe (Deletar da public.users)
  // Nota: Isso não deleta da auth.users, apenas remove o acesso na public.users (dependendo das políticas).
  // Idealmente, usar Edge Function ou RPC se quiser apagar do auth.users, mas remover agency_id ou deletar do public.users já corta o acesso.
  async removeMember(userId: string) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;
  }
};
