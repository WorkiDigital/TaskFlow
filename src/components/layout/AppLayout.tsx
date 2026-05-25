import { Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { authService } from "@/services/authService";

import { CreateWorkspaceDialog } from "@/components/workspaces/CreateWorkspaceDialog";
import { WorkspaceSettingsDialog } from "@/components/workspaces/WorkspaceSettingsDialog";

export function AppLayout() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    authService
      .getSession()
      .then((session) => {
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
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh w-full">
      <div className="hidden shrink-0 lg:block lg:w-[18vw] lg:max-w-[20rem] lg:min-w-[16rem]">
        <div className="fixed inset-y-0 left-0 w-[18vw] max-w-[20rem] min-w-[16rem]">
          <Sidebar />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex h-[calc(100dvh-4rem)] flex-1 flex-col overflow-hidden">
          <div className="flex h-full w-full animate-in flex-col overflow-y-auto overflow-x-hidden fade-in duration-500">
            <Outlet />
          </div>
        </main>
      </div>
      <CreateWorkspaceDialog />
      <WorkspaceSettingsDialog />
    </div>
  );
}
