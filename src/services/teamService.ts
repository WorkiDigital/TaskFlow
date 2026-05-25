import { supabase } from "./supabase";

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
  role: "owner" | "admin" | "manager" | "team" | "client";
  agency_role_id: string | null;
  agency_id: string;
  avatar_url?: string | null;
  department?: string | null;
  job_title?: string | null;
  status?: "active" | "invited" | "inactive" | "suspended";
  created_at: string;
  agency_role?: AgencyRole;
}

export interface TeamInvite {
  id: string;
  agency_id: string;
  email: string;
  role: "admin" | "manager" | "team" | "client";
  department: string | null;
  job_title: string | null;
  invited_by: string | null;
  status: "pending" | "accepted" | "expired" | "cancelled";
  token: string;
  expires_at: string | null;
  accepted_at: string | null;
  created_at: string;
}

export const teamService = {
  // Obter todos os membros da agência atual
  async getAgencyMembers(): Promise<TeamMember[]> {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) throw new Error("Não autenticado");

    // Pegar o agency_id do user logado
    const { data: userData } = await supabase
      .from("users")
      .select("agency_id")
      .eq("id", authData.user.id)
      .single();

    if (!userData?.agency_id) return [];

    const { data, error } = await supabase
      .from("users")
      .select(
        `
        *,
        agency_role:agency_roles(*)
      `,
      )
      .eq("agency_id", userData.agency_id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as TeamMember[];
  },

  // Alias para getAgencyMembers
  async getTeamMembers(): Promise<TeamMember[]> {
    return this.getAgencyMembers();
  },

  // Obter convites pendentes
  async getPendingInvites(): Promise<TeamInvite[]> {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) throw new Error("Não autenticado");

    const { data: userData } = await supabase
      .from("users")
      .select("agency_id")
      .eq("id", authData.user.id)
      .single();

    if (!userData?.agency_id) return [];

    const { data, error } = await supabase
      .from("team_invites")
      .select("*")
      .eq("agency_id", userData.agency_id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as TeamInvite[];
  },

  // Obter todos os cargos criados pela agência
  async getAgencyRoles(): Promise<AgencyRole[]> {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) throw new Error("Não autenticado");

    const { data: userData } = await supabase
      .from("users")
      .select("agency_id")
      .eq("id", authData.user.id)
      .single();

    if (!userData?.agency_id) return [];

    const { data, error } = await supabase
      .from("agency_roles")
      .select("*")
      .eq("agency_id", userData.agency_id)
      .order("name");

    if (error) throw error;
    return data as AgencyRole[];
  },

  // Criar um novo cargo customizado
  async createAgencyRole(
    name: string,
    permissions: Record<string, boolean> = {},
  ): Promise<AgencyRole> {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) throw new Error("Não autenticado");

    const { data: userData } = await supabase
      .from("users")
      .select("agency_id")
      .eq("id", authData.user.id)
      .single();

    if (!userData?.agency_id) throw new Error("Usuário sem agência vinculada");

    const { data, error } = await supabase
      .from("agency_roles")
      .insert({
        agency_id: userData.agency_id,
        name,
        permissions,
      })
      .select()
      .single();

    if (error) throw error;
    return data as AgencyRole;
  },

  // Atualizar um cargo existente
  async updateAgencyRole(
    id: string,
    name: string,
    permissions: Record<string, boolean>,
  ): Promise<AgencyRole> {
    const { data, error } = await supabase
      .from("agency_roles")
      .update({ name, permissions, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as AgencyRole;
  },

  // Deletar um cargo
  async deleteAgencyRole(id: string): Promise<void> {
    const { error } = await supabase.from("agency_roles").delete().eq("id", id);

    if (error) throw error;
  },

  // Convidar um novo membro para a equipe
  async inviteMember(
    email: string,
    role: "admin" | "manager" | "team" | "client",
    department?: string,
    job_title?: string,
  ) {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) throw new Error("Não autenticado");

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/team-invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.session.access_token}`,
      },
      body: JSON.stringify({ email, role, department, job_title }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Falha ao convidar membro");
    }

    return result;
  },

  // Cancelar convite
  async cancelInvite(inviteId: string): Promise<void> {
    const { error } = await supabase
      .from("team_invites")
      .update({ status: "cancelled" })
      .eq("id", inviteId);

    if (error) throw error;
  },

  // Atualizar nível de acesso / cargo de um membro
  async updateMemberRole(
    userId: string,
    role: "owner" | "admin" | "manager" | "team" | "client",
    agency_role_id?: string | null,
  ) {
    const patch: Record<string, any> = { role };
    if (agency_role_id !== undefined) {
      patch.agency_role_id = agency_role_id;
    }
    const { data, error } = await supabase
      .from("users")
      .update(patch)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data as TeamMember;
  },

  // Atualizar departamento de um membro
  async updateMemberDepartment(userId: string, department: string) {
    const { data, error } = await supabase
      .from("users")
      .update({ department })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data as TeamMember;
  },

  // Atualizar cargo (job title) de um membro
  async updateMemberJobTitle(userId: string, jobTitle: string) {
    const { data, error } = await supabase
      .from("users")
      .update({ job_title: jobTitle })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data as TeamMember;
  },

  // Atualizar status de um membro (active, inactive, suspended)
  async updateMemberStatus(userId: string, status: "active" | "inactive" | "suspended") {
    const { data, error } = await supabase
      .from("users")
      .update({ status })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data as TeamMember;
  },

  // Validar token de convite
  async validateInviteToken(token: string) {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/team-accept-invite?token=${encodeURIComponent(token)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Convite inválido ou expirado");
    }

    return result as {
      valid: boolean;
      email: string;
      role: "admin" | "manager" | "team" | "client";
      department: string | null;
      job_title: string | null;
      agencyName: string;
    };
  },

  // Aceitar convite
  async acceptInvite(token: string) {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) throw new Error("Não autenticado");

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/team-accept-invite?token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.session.access_token}`,
        },
      },
    );

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Falha ao aceitar convite");
    }

    return result;
  },

  // Remover membro da equipe (Deletar da public.users)
  async removeMember(userId: string) {
    const { error } = await supabase.from("users").delete().eq("id", userId);

    if (error) throw error;
  },
};
