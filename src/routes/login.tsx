import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, LockKeyhole, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/authService";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    authService
      .getSession()
      .then((session) => {
        if (mounted && session) void navigate({ to: "/dashboard", replace: true });
      })
      .catch(() => {
        // Login page remains available when there is no valid session.
      })
      .finally(() => {
        if (mounted) setChecking(false);
      });

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      toast.error("Informe e-mail e senha.");
      return;
    }

    if (!isStrongPassword(password)) {
      toast.error("A senha precisa ter minimo 8 caracteres, uma letra maiuscula e uma minuscula.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await authService.signIn(normalizedEmail, password);
        toast.success("Login realizado.");
        await navigate({ to: "/dashboard", replace: true });
        return;
      }

      const result = await authService.signUp(normalizedEmail, password);
      if (result.session) {
        toast.success("Conta criada e login realizado.");
        await navigate({ to: "/dashboard", replace: true });
      } else {
        toast.success("Conta criada. Confira o e-mail para confirmar o acesso.");
        setMode("login");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel autenticar.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grid lg:grid-cols-[1fr_440px]">
      <section className="hidden lg:flex flex-col justify-between border-r border-border bg-sidebar/50 p-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-[var(--shadow-glow)]">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">TaskFlow</p>
            <p className="text-xs text-muted-foreground">Plataforma SaaS para agencias</p>
          </div>
        </div>

        <div className="max-w-xl">
          <p className="text-sm uppercase tracking-widest text-primary font-semibold">
            Acesso seguro
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">
            Controle seus clientes, contratos e onboarding em um painel protegido.
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Entre com sua conta para acessar dados internos da agencia. Links publicos de
            formularios continuam liberados para clientes.
          </p>
        </div>

        <p className="text-xs text-muted-foreground">Supabase Auth ativo</p>
      </section>

      <main className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">TaskFlow</p>
              <p className="text-xs text-muted-foreground">Acesso seguro</p>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="mb-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-semibold">
                {mode === "login" ? "Entrar na plataforma" : "Criar acesso"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === "login"
                  ? "Use seu e-mail e senha para continuar."
                  : "Crie o primeiro usuario do painel."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={loading}
                  placeholder="voce@agencia.com"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading}
                  placeholder="Minimo 8 caracteres"
                />
              </div>

              <div className="rounded-md border border-border bg-white/5 p-3 text-xs text-muted-foreground">
                <p className={password.length >= 8 ? "text-success" : ""}>Minimo 8 caracteres</p>
                <p className={/[A-Z]/.test(password) ? "text-success" : ""}>
                  Pelo menos uma letra maiuscula
                </p>
                <p className={/[a-z]/.test(password) ? "text-success" : ""}>
                  Pelo menos uma letra minuscula
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "login" ? "Entrar" : "Criar conta"}
              </Button>
            </form>

            <div className="mt-5 border-t border-border pt-4 text-center">
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-sm text-primary hover:text-primary/80"
                disabled={loading}
              >
                {mode === "login" ? "Criar primeiro acesso" : "Ja tenho acesso"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function isStrongPassword(password: string) {
  return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password);
}
