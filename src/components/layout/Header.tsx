import { useRouterState } from "@tanstack/react-router";
import { Bell, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
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
import { useState } from "react";
import { toast } from "sonner";

export function Header() {
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const current = navItems.find((i) => currentPath.startsWith(i.to)) ?? navItems[0];
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/60 px-4 backdrop-blur-xl md:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 border-r border-border bg-sidebar/95 p-0">
          <SheetTitle className="sr-only">Navegação</SheetTitle>
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
        aria-label="Notificações"
        onClick={() => toast("Você tem 3 notificações novas")}
      >
        <Bell className="h-5 w-5" />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="h-9 w-9 border border-border">
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                AP
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-sm">Ana Prado</span>
              <span className="text-xs text-muted-foreground">ana@agenciaprime.com</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => toast.success("Sessão encerrada (demo)")}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
