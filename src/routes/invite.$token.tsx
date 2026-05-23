import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, UserPlus, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, LogIn } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { teamService } from "@/services/teamService";
import { authService } from "@/services/authService";

export const Route = createFileRoute("/invite/$token")({
  component: InviteAcceptPage,
});

function InviteAcceptPage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteDetails, setInviteDetails] = useState<{
    email: string;
    role: string;
    department: string | null;
    job_title: string | null;
    agencyName: string;
  } | null>(null);

  // Form states
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasAccount, setHasAccount] = useState(false); // Mode toggle: Create account vs Login

  useEffect(() => {
    let mounted = true;

    async function validateToken() {
      try {
        setLoading(true);
        const details = await teamService.validateInviteToken(token);
        if (mounted) {
          setInviteDetails(details);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || "Este convite é inválido ou expirou.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    validateToken();

    return () => {
      mounted = false;
    };
  }, [token]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!inviteDetails) return;

    if (!hasAccount && !fullName.trim()) {
      toast.error("Por favor, preencha seu nome completo.");
      return;
    }

    if (!password || password.length < 8) {
      toast.error("A senha deve conter no mínimo 8 caracteres.");
      return;
    }

    setSubmitting(true);
    try {
      if (hasAccount) {
        // Mode: Existing account login & accept
        await authService.signIn(inviteDetails.email, password);
        await teamService.acceptInvite(token);
        toast.success("Convite aceito e login realizado com sucesso!");
        await navigate({ to: "/dashboard", replace: true });
      } else {
        // Mode: Create account & accept (trigger handles linking via metadata)
        const result = await authService.signUp(inviteDetails.email, password, {
          data: {
            invite_token: token,
            full_name: fullName.trim()
          }
        });

        if (result.session) {
          toast.success("Conta criada e convite aceito!");
          await navigate({ to: "/dashboard", replace: true });
        } else {
          setSuccess(true);
          toast.success("Cadastro realizado!");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar o cadastro. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Validando seu convite...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-5">
        <div className="w-full max-w-md glass-card p-6 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Convite Inválido</h1>
          <p className="text-sm text-muted-foreground">
            {error}
          </p>
          <div className="pt-4 border-t border-border/50">
            <Button asChild className="w-full">
              <Link to="/login">Ir para o Login</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-5">
        <div className="w-full max-w-md glass-card p-8 text-center space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/20 text-success">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Cadastro Realizado!</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Enviamos um e-mail de confirmação para <strong>{inviteDetails?.email}</strong>. 
              Por favor, confirme seu e-mail para ativar sua conta e ingressar na agência.
            </p>
          </div>
          <div className="pt-4 border-t border-border/50">
            <Button asChild className="w-full gap-2">
              <Link to="/login">
                Ir para o Login <LogIn className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grid lg:grid-cols-[1fr_480px]">
      {/* Esquerda: Painel Informativo com Design Premium */}
      <section className="hidden lg:flex flex-col justify-between border-r border-border bg-sidebar/50 p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-[var(--shadow-glow)]">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">TaskFlow</p>
            <p className="text-xs text-muted-foreground">Plataforma SaaS para agências</p>
          </div>
        </div>

        <div className="max-w-xl space-y-6">
          <span className="inline-flex items-center text-xs font-semibold text-primary uppercase tracking-widest bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
            Convite Recebido
          </span>
          <h1 className="text-4xl font-semibold leading-tight text-foreground">
            Você foi convidado para a equipe da <span className="text-primary font-bold">{inviteDetails?.agencyName}</span>!
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O TaskFlow é o centro operacional onde você poderá gerenciar suas tarefas diárias, 
            ver cronogramas de projetos, colaborar com o time e manter a comunicação alinhada com o cliente.
          </p>
        </div>

        <p className="text-xs text-muted-foreground">Convite exclusivo &bull; Link expira em breve</p>
      </section>

      {/* Direita: Formulário de Cadastro/Login */}
      <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Header Mobile */}
          <div className="mb-8 lg:hidden flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">TaskFlow</p>
              <p className="text-xs text-muted-foreground">Convite Aceito</p>
            </div>
          </div>

          <div className="glass-card p-6 md:p-8">
            <div className="mb-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UserPlus className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold">Aceitar Convite</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Agência: <span className="font-semibold text-foreground">{inviteDetails?.agencyName}</span>
              </p>
              {inviteDetails?.job_title && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Cargo/Função: <span className="font-semibold text-primary">{inviteDetails?.job_title}</span>
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail de Cadastro</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteDetails?.email}
                  disabled
                  className="bg-secondary/40 cursor-not-allowed opacity-80"
                />
              </div>

              {!hasAccount && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Seu Nome Completo</Label>
                  <Input
                    id="name"
                    type="text"
                    required
                    placeholder="Ex: João Silva"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="password">Sua Senha</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={submitting}
                />
              </div>

              {!hasAccount && (
                <div className="rounded-xl border border-border bg-white/5 p-3.5 text-xs text-muted-foreground space-y-1">
                  <p className={password.length >= 8 ? "text-success font-medium" : ""}>&bull; Mínimo 8 caracteres</p>
                  <p className={/[A-Z]/.test(password) ? "text-success font-medium" : ""}>&bull; Pelo menos uma letra maiúscula</p>
                  <p className={/[a-z]/.test(password) ? "text-success font-medium" : ""}>&bull; Pelo menos uma letra minúscula</p>
                </div>
              )}

              <Button type="submit" className="w-full gap-1.5 mt-2" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : hasAccount ? (
                  <>
                    Entrar e Aceitar <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Criar Conta e Entrar <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 border-t border-border/50 pt-4 text-center">
              <button
                type="button"
                onClick={() => setHasAccount(!hasAccount)}
                className="text-xs text-primary hover:text-primary/80 font-medium"
                disabled={submitting}
              >
                {hasAccount 
                  ? "Não tem conta? Cadastre-se por aqui" 
                  : "Já possui uma conta no TaskFlow? Entre por aqui"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
