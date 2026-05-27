import { createFileRoute } from "@tanstack/react-router";
import { GlassCard } from "@/components/ui/GlassCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/services/supabase";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { teamMembers } from "@/lib/mock-data";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { WhatsAppConnectionPanel } from "@/components/whatsapp/WhatsAppConnectionPanel";
import { settingsService } from "@/services/settingsService";
import { teamService, TeamMember } from "@/services/teamService";
import { InviteMemberModal } from "@/components/team/InviteMemberModal";
import { AgencyRolesModal } from "@/components/team/AgencyRolesModal";
import {
  Loader2,
  Plus,
  Settings2,
  Copy,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Mail,
  UserMinus,
  UserCheck,
  Briefcase,
  Users,
  Bot,
  CheckCircle2,
  Eye,
  EyeOff,
  Link2,
  ChevronDown,
  Check,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { agentService, AI_MODELS, type AgentProvider } from "@/services/agentService";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [agency, setAgency] = useState({ name: "", domain: "", bio: "" });
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [savingAgency, setSavingAgency] = useState(false);
  const [notifs, setNotifs] = useState({ email: true, push: false, weekly: true });

  // Team Management
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [isLoadingInvites, setIsLoadingInvites] = useState(true);

  // Integrações
  const [editingIntegration, setEditingIntegration] = useState<"autentique" | null>(null);

  // Agente de IA
  const [aiProvider, setAiProvider] = useState<AgentProvider>("claude");
  const [aiModel, setAiModel] = useState<string>("");
  const [aiApiKey, setAiApiKey] = useState("");
  const [showAiKey, setShowAiKey] = useState(false);
  const [isSavingAi, setIsSavingAi] = useState(false);

  const [autentiqueConfig, setAutentiqueConfig] = useState({
    token: "",
    isConfigured: false,
  });
  const [webhookCopied, setWebhookCopied] = useState(false);

  function copyWebhookUrl() {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/autentique-webhook`;
    void navigator.clipboard.writeText(url).then(() => {
      setWebhookCopied(true);
      setTimeout(() => setWebhookCopied(false), 2000);
    });
  }

  const loadMembers = () => {
    setIsLoadingMembers(true);
    teamService
      .getAgencyMembers()
      .then(setMembers)
      .catch((error) => console.error("[Settings] Erro ao carregar membros:", error))
      .finally(() => setIsLoadingMembers(false));

    setIsLoadingInvites(true);
    teamService
      .getPendingInvites()
      .then(setPendingInvites)
      .catch((error) => console.error("[Settings] Erro ao carregar convites:", error))
      .finally(() => setIsLoadingInvites(false));
  };

  const handleToggleStatus = async (member: TeamMember) => {
    const nextStatus = member.status === "suspended" ? "active" : "suspended";
    try {
      await teamService.updateMemberStatus(member.id, nextStatus);
      toast.success(`Membro ${nextStatus === "suspended" ? "suspenso" : "reativado"} com sucesso!`);
      loadMembers();
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar status do membro.");
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!confirm("Deseja mesmo cancelar este convite?")) return;
    try {
      await teamService.cancelInvite(inviteId);
      toast.success("Convite cancelado.");
      loadMembers();
    } catch (err: any) {
      toast.error(err.message || "Erro ao cancelar convite.");
    }
  };

  const handleCopyInviteLink = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Link do convite copiado!");
  };

  const handleRoleChange = async (userId: string, newRole: any) => {
    try {
      await teamService.updateMemberRole(userId, newRole);
      toast.success("Nível de acesso atualizado.");
      loadMembers();
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar nível de acesso.");
    }
  };

  useEffect(() => {
    settingsService
      .getSettings()
      .then((settings) => {
        setAutentiqueConfig((prev) => ({
          ...prev,
          isConfigured: settings.is_autentique_configured,
        }));
      })
      .catch((error) => {
        console.error("[Settings] Erro ao carregar integracoes:", error);
        toast.error("Nao foi possivel carregar as integracoes.");
      });

    agentService
      .getProviderConfig()
      .then((config) => {
        setAiProvider(config.provider);
        setAiModel(config.model ?? "");
      })
      .catch(() => {});

    loadMembers();

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: userRow } = await supabase
        .from("users")
        .select("agency_id")
        .eq("id", user.id)
        .single();
      if (!userRow?.agency_id) return;
      setAgencyId(userRow.agency_id);
      const { data: ag } = await supabase
        .from("agencies")
        .select("name, domain, bio")
        .eq("id", userRow.agency_id)
        .single();
      if (ag) setAgency({ name: ag.name ?? "", domain: ag.domain ?? "", bio: ag.bio ?? "" });
    });
  }, []);

  const saveAiProviderConfig = async () => {
    setIsSavingAi(true);
    try {
      await agentService.updateProviderConfig(
        aiProvider,
        aiApiKey || undefined,
        aiModel || undefined,
      );
      setAiApiKey("");
      toast.success(
        `Configuração salva — ${aiProvider.toUpperCase()} ${aiModel ? `(${aiModel})` : ""}`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar configuração de IA.");
    } finally {
      setIsSavingAi(false);
    }
  };

  const saveAutentiqueConfig = async () => {
    try {
      const settings = await settingsService.updateAutentiqueToken(autentiqueConfig.token);
      setAutentiqueConfig({ token: "", isConfigured: settings.is_autentique_configured });
      toast.success("Integracao com Autentique salva!");
      setEditingIntegration(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Nao foi possivel salvar o token do Autentique.",
      );
    }
  };

  const isAutentiqueConfigured = autentiqueConfig.isConfigured;

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full px-4 py-6 md:px-8 md:py-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Configurações</h2>
        <p className="text-sm text-muted-foreground">
          Personalize sua agência, equipe e integrações.
        </p>
      </div>

      <Tabs defaultValue="agency" className="space-y-6">
        <TabsList className="glass-panel flex-wrap h-auto gap-1">
          <TabsTrigger value="agency">Agência</TabsTrigger>
          <TabsTrigger value="team">Equipe</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="agent" className="gap-1.5">
            <Bot className="h-3.5 w-3.5" />
            Agente de IA
          </TabsTrigger>
          <TabsTrigger value="preferences">Preferências</TabsTrigger>
        </TabsList>

        <TabsContent value="agency" className="space-y-4">
          <GlassCard>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-xl font-semibold text-primary-foreground">
                AP
              </div>
              <div>
                <p className="text-sm font-medium">Logo da agência</p>
                <p className="text-xs text-muted-foreground">PNG ou SVG, máx 2MB</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 px-0 text-primary"
                  onClick={() => toast("Upload (demo)")}
                >
                  Trocar logo
                </Button>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ag-name">Nome</Label>
                <Input
                  id="ag-name"
                  value={agency.name}
                  onChange={(e) => setAgency({ ...agency, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ag-domain">Domínio</Label>
                <Input
                  id="ag-domain"
                  value={agency.domain}
                  onChange={(e) => setAgency({ ...agency, domain: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="ag-bio">Sobre</Label>
                <Textarea
                  id="ag-bio"
                  rows={3}
                  value={agency.bio}
                  onChange={(e) => setAgency({ ...agency, bio: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <Button
                disabled={savingAgency}
                onClick={async () => {
                  if (!agencyId) return;
                  setSavingAgency(true);
                  const { error } = await supabase
                    .from("agencies")
                    .update({
                      name: agency.name,
                      domain: agency.domain,
                      bio: agency.bio,
                      updated_at: new Date().toISOString(),
                    })
                    .eq("id", agencyId);
                  setSavingAgency(false);
                  if (error) toast.error("Erro ao salvar agência");
                  else toast.success("Alterações salvas");
                }}
              >
                {savingAgency ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
              </Button>
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-foreground">Equipe da Agência</h3>
              <p className="text-xs text-muted-foreground">
                Gerencie membros, cargos e acessos do workspace.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsInviteModalOpen(true)} className="gap-2 text-xs h-9">
                <Plus className="h-4 w-4" /> Convidar Membro
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsRolesModalOpen(true)}
                className="gap-2 text-xs h-9"
              >
                <Settings2 className="h-4 w-4" /> Gerenciar Cargos
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Membros Ativos */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" />
                Membros da Agência ({members.length})
              </h4>
              <div className="space-y-3">
                {isLoadingMembers ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : members.length === 0 ? (
                  <GlassCard className="p-8 text-center text-muted-foreground text-sm">
                    Nenhum membro encontrado.
                  </GlassCard>
                ) : (
                  members.map((m) => {
                    const isSuspended = m.status === "suspended";
                    return (
                      <GlassCard
                        key={m.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 border transition-all ${isSuspended ? "opacity-65 border-destructive/20 bg-destructive/5" : "hover:border-border/80"}`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarFallback
                              className={`bg-gradient-to-br text-primary-foreground text-xs font-semibold ${isSuspended ? "from-muted to-muted-foreground" : "from-primary to-accent"}`}
                            >
                              {m.full_name?.substring(0, 2).toUpperCase() ||
                                m.email?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium">{m.full_name || m.email}</p>
                              {m.department && (
                                <span className="inline-flex items-center text-[10px] bg-secondary/60 text-secondary-foreground px-2 py-0.5 rounded-full font-medium">
                                  {m.department}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                              <span>{m.email}</span>
                              <span>&bull;</span>
                              <span className="font-semibold text-foreground">
                                {m.job_title || "Membro"}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-auto border-t sm:border-0 pt-2 sm:pt-0">
                          {/* Nivel de acesso */}
                          <div className="flex items-center gap-1.5">
                            <select
                              value={m.role}
                              onChange={(e) => handleRoleChange(m.id, e.target.value)}
                              disabled={m.role === "owner"} // owner can't change their own role here
                              className="rounded-lg border border-border bg-background/50 px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-8"
                            >
                              <option value="owner">Dono (Owner)</option>
                              <option value="admin">Admin</option>
                              <option value="manager">Manager</option>
                              <option value="team">Team (Membro)</option>
                              <option value="client">Client (Cliente)</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2">
                            <StatusBadge tone={isSuspended ? "danger" : "success"}>
                              {isSuspended ? "Suspenso" : "Ativo"}
                            </StatusBadge>

                            {m.role !== "owner" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 ${isSuspended ? "text-success hover:bg-success/10" : "text-destructive hover:bg-destructive/10"}`}
                                onClick={() => handleToggleStatus(m)}
                                title={isSuspended ? "Reativar Membro" : "Suspender Membro"}
                              >
                                {isSuspended ? (
                                  <UserCheck className="h-4 w-4" />
                                ) : (
                                  <UserMinus className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </GlassCard>
                    );
                  })
                )}
              </div>
            </div>

            {/* Convites Pendentes */}
            <div className="space-y-3 border-t border-border/30 pt-6">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-amber-500" />
                Convites Pendentes ({pendingInvites.length})
              </h4>
              <div className="space-y-3">
                {isLoadingInvites ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : pendingInvites.length === 0 ? (
                  <GlassCard className="p-6 text-center text-muted-foreground text-xs italic bg-secondary/5">
                    Nenhum convite pendente.
                  </GlassCard>
                ) : (
                  pendingInvites.map((invite) => (
                    <GlassCard
                      key={invite.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:border-border/60"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">{invite.email}</p>
                          <span className="inline-flex items-center text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full font-medium">
                            Pendente
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>Acesso: {invite.role}</span>
                          {invite.job_title && (
                            <>
                              <span>&bull;</span>
                              <span>Função: {invite.job_title}</span>
                            </>
                          )}
                          {invite.department && (
                            <>
                              <span>&bull;</span>
                              <span>Depto: {invite.department}</span>
                            </>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1"
                          onClick={() => handleCopyInviteLink(invite.token)}
                        >
                          <Copy className="h-3 w-3" /> Copiar Link
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => handleCancelInvite(invite.id)}
                          title="Cancelar Convite"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </GlassCard>
                  ))
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-0">
          <WhatsAppConnectionPanel />
        </TabsContent>

        <TabsContent value="integrations" className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Autentique */}
          <button onClick={() => setEditingIntegration("autentique")} className="text-left">
            <GlassCard className="flex items-start justify-between gap-3 transition-all hover:border-primary/50 cursor-pointer h-full">
              <div>
                <p className="font-medium">Autentique</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Assinatura eletrônica de contratos
                </p>
                {isAutentiqueConfigured && (
                  <p className="mt-1 text-[10px] text-primary/60 font-mono">webhook ativo</p>
                )}
              </div>
              {isAutentiqueConfigured ? (
                <StatusBadge tone="success">Conectado</StatusBadge>
              ) : (
                <StatusBadge tone="neutral">Pendente</StatusBadge>
              )}
            </GlassCard>
          </button>

          {/* Em Breve */}
          <GlassCard className="flex items-start justify-between gap-3 opacity-60 pointer-events-none">
            <div>
              <p className="font-medium">Google Drive</p>
              <p className="mt-1 text-xs text-muted-foreground">Sincronize documentos do cliente</p>
            </div>
            <StatusBadge tone="neutral">Em breve</StatusBadge>
          </GlassCard>

          <GlassCard className="flex items-start justify-between gap-3 opacity-60 pointer-events-none">
            <div>
              <p className="font-medium">IA Studio</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Assistente para briefings e propostas
              </p>
            </div>
            <StatusBadge tone="neutral">Em breve</StatusBadge>
          </GlassCard>
        </TabsContent>

        {/* ── Agente de IA ── */}
        <TabsContent value="agent" className="space-y-4">
          <GlassCard className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 border border-primary/30">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Agente Operacional</p>
                <p className="text-xs text-muted-foreground">
                  Configure o provider de IA usado para análises e sugestões
                </p>
              </div>
            </div>

            {/* Provider Selection */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Provider de IA</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {(
                  [
                    {
                      value: "claude",
                      label: "Claude",
                      sublabel: "Anthropic · claude-sonnet-4-5",
                      icon: "✦",
                    },
                    { value: "gpt", label: "GPT-4o", sublabel: "OpenAI · gpt-4o", icon: "⬡" },
                    {
                      value: "gemini",
                      label: "Gemini",
                      sublabel: "Google · gemini-1.5-pro",
                      icon: "◈",
                    },
                  ] as Array<{
                    value: AgentProvider;
                    label: string;
                    sublabel: string;
                    icon: string;
                  }>
                ).map((p) => (
                  <button
                    key={p.value}
                    onClick={() => {
                      setAiProvider(p.value);
                      setAiModel("");
                    }}
                    className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                      aiProvider === p.value
                        ? "border-primary/60 bg-primary/10"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <span className="text-lg leading-none mt-0.5">{p.icon}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium">{p.label}</p>
                        {aiProvider === p.value && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{p.sublabel}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <Label>Modelo</Label>
              <div
                className={`grid grid-cols-1 gap-2 ${AI_MODELS[aiProvider].length > 3 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}
              >
                {AI_MODELS[aiProvider].map((m) => {
                  const isSelected = aiModel ? aiModel === m.id : !!m.isDefault;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setAiModel(m.id)}
                      className={`flex flex-col gap-0.5 rounded-xl border p-3 text-left transition-all ${
                        isSelected
                          ? "border-primary/60 bg-primary/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium">{m.label}</p>
                        {isSelected && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                        )}
                        {m.isDefault && !isSelected && (
                          <span className="text-[10px] text-muted-foreground border border-white/10 rounded px-1">
                            padrão
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-snug">{m.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="ai-key">
                API Key (
                {aiProvider === "claude"
                  ? "Anthropic"
                  : aiProvider === "gpt"
                    ? "OpenAI"
                    : "Google AI"}
                )
              </Label>
              <div className="relative">
                <Input
                  id="ai-key"
                  type={showAiKey ? "text" : "password"}
                  placeholder={
                    aiProvider === "claude"
                      ? "sk-ant-..."
                      : aiProvider === "gpt"
                        ? "sk-..."
                        : "AI..."
                  }
                  value={aiApiKey}
                  onChange={(e) => setAiApiKey(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowAiKey(!showAiKey)}
                >
                  {showAiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Deixe em branco para usar a chave global da plataforma. A chave fica armazenada com
                segurança e nunca é exibida novamente.
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={saveAiProviderConfig} disabled={isSavingAi} className="gap-2">
                {isSavingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Salvar configuração
              </Button>
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="preferences">
          <GlassCard className="space-y-4">
            {[
              {
                key: "email" as const,
                label: "Notificações por e-mail",
                desc: "Receba atualizações importantes no seu e-mail.",
              },
              {
                key: "push" as const,
                label: "Notificações push",
                desc: "Alertas em tempo real no navegador.",
              },
              {
                key: "weekly" as const,
                label: "Resumo semanal",
                desc: "Recap de métricas toda segunda-feira.",
              },
            ].map((p) => (
              <div key={p.key} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{p.label}</p>
                  <p className="text-xs text-muted-foreground">{p.desc}</p>
                </div>
                <Switch
                  checked={notifs[p.key]}
                  onCheckedChange={(v) => setNotifs({ ...notifs, [p.key]: v })}
                />
              </div>
            ))}
          </GlassCard>
        </TabsContent>
      </Tabs>

      {/* Dialog: Autentique Config */}
      <Dialog
        open={editingIntegration === "autentique"}
        onOpenChange={(open) => !open && setEditingIntegration(null)}
      >
        <DialogContent className="bg-background border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Integração Autentique</DialogTitle>
            <DialogDescription>
              Conecte o Autentique para disparar e monitorar a assinatura de contratos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Token de Acesso</Label>
              <Input
                type="password"
                placeholder="Insira seu Token do Autentique"
                value={autentiqueConfig.token}
                onChange={(e) =>
                  setAutentiqueConfig((prev) => ({ ...prev, token: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                URL do Webhook (somente leitura)
              </Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/autentique-webhook`}
                  className="font-mono text-xs bg-white/5 text-muted-foreground"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyWebhookUrl}
                  className="shrink-0"
                >
                  {webhookCopied ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                <ChevronDown className="w-3.5 h-3.5" />
                Como configurar no Autentique
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ol className="mt-3 space-y-2 text-xs text-muted-foreground list-decimal list-inside">
                  <li>
                    Acesse seu painel em{" "}
                    <span className="text-foreground font-medium">app.autentique.com.br</span>
                  </li>
                  <li>
                    Vá em{" "}
                    <span className="text-foreground font-medium">
                      Configurações → Integrações → Webhooks
                    </span>
                  </li>
                  <li>
                    Clique em{" "}
                    <span className="text-foreground font-medium">Adicionar webhook</span>
                  </li>
                  <li>
                    Cole a URL acima e selecione o evento{" "}
                    <span className="text-foreground font-medium">document.signed</span>
                  </li>
                  <li>
                    Salve. Contratos assinados serão detectados automaticamente a partir de agora.
                  </li>
                </ol>
              </CollapsibleContent>
            </Collapsible>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingIntegration(null)}>
              Cancelar
            </Button>
            <Button
              onClick={saveAutentiqueConfig}
              className="bg-primary text-primary-foreground hover:opacity-90"
            >
              Salvar Token
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modais de Equipe */}
      <InviteMemberModal
        open={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
        onSuccess={loadMembers}
      />
      <AgencyRolesModal open={isRolesModalOpen} onOpenChange={setIsRolesModalOpen} />
    </div>
  );
}
