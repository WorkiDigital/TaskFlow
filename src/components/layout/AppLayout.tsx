import { Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { authService } from "@/services/authService";

export function AppLayout() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    authService.getSession()
      .then(session => {
        if (!mounted) return;
        if (!session) {
          void navigate({ to: "/login", replace: true });
          return;
        }
        setChecking(false);
      })
      .catch(() => {
        if (mounted) void navigate({ to: "/login", replace: true });
      });

    return () => {
      mounted = false;
    };
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <div className="hidden lg:block lg:w-64 lg:shrink-0">
        <div className="fixed inset-y-0 left-0 w-64">
          <Sidebar />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 h-[calc(100vh-64px)] flex flex-col overflow-hidden">
          <div className="w-full h-full animate-in fade-in duration-500 flex flex-col overflow-y-auto overflow-x-hidden">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
