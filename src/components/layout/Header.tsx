import { useRouterState } from "@tanstack/react-router";
import { Bell, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Sidebar, navItems } from "./Sidebar";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import { supabase } from "@/services/supabase";

export function Header() {
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const current = navItems.find((i) => currentPath.startsWith(i.to)) ?? navItems[0];
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
    });
  }, []);

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      toast.success("Sessao encerrada");
      window.location.href = "/login";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel sair.");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/60 px-4 backdrop-blur-xl md:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 border-r border-border bg-sidebar/95 p-0">
          <SheetTitle className="sr-only">Navegacao</SheetTitle>
          <Sidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold leading-tight md:text-lg">{current.label}</h1>
        <p className="truncate text-xs text-muted-foreground">{current.subtitle}</p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="relative"
        aria-label="Notificacoes"
        onClick={() => toast("Voce tem 3 notificacoes novas")}
      >
        <Bell className="h-5 w-5" />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="h-9 w-9 border border-border">
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                TF
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-sm">Usuario logado</span>
              <span className="text-xs text-muted-foreground">{email || "Sessao ativa"}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
