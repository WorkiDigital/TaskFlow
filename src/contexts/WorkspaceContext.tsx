import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from "react";
import { supabase } from "@/services/supabase";
import { User } from "@supabase/supabase-js";
import {
  Workspace,
  listUserWorkspaces,
  getLocalActiveWorkspaceId,
  setLocalActiveWorkspaceId,
} from "@/services/workspaceService";

interface WorkspaceContextData {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  activeWorkspace: Workspace | null;
  activeAgencyId: string | null;
  isLoading: boolean;
  error: Error | null;
  switchWorkspace: (workspaceId: string) => void;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextData | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Derivations
  const activeWorkspace = useMemo(
    () => workspaces.find((w) => w.id === activeWorkspaceId) || null,
    [workspaces, activeWorkspaceId]
  );
  
  // The agency_id is derived from the active workspace.
  // If no active workspace, fallback to the first workspace's agency, or user's default agency.
  const activeAgencyId = useMemo(() => {
    if (activeWorkspace) return activeWorkspace.agency_id;
    if (workspaces.length > 0) return workspaces[0].agency_id;
    return user?.user_metadata?.agency_id || null;
  }, [activeWorkspace, workspaces, user]);

  const refreshWorkspaces = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await listUserWorkspaces();
      setWorkspaces(data);

      const localId = getLocalActiveWorkspaceId();
      if (localId && data.some((w) => w.id === localId)) {
        setActiveWorkspaceIdState(localId);
      } else if (data.length > 0) {
        setActiveWorkspaceIdState(data[0].id);
        setLocalActiveWorkspaceId(data[0].id);
      } else {
        setActiveWorkspaceIdState(null);
        setLocalActiveWorkspaceId(null);
      }
    } catch (err) {
      console.error("[WorkspaceContext] Error fetching workspaces", err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      refreshWorkspaces();
    } else {
      setWorkspaces([]);
      setActiveWorkspaceIdState(null);
      setLocalActiveWorkspaceId(null);
      setIsLoading(false);
    }
  }, [user]);

  const switchWorkspace = (workspaceId: string) => {
    const ws = workspaces.find((w) => w.id === workspaceId);
    if (ws) {
      setActiveWorkspaceIdState(workspaceId);
      setLocalActiveWorkspaceId(workspaceId);
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspaceId,
        activeWorkspace,
        activeAgencyId,
        isLoading,
        error,
        switchWorkspace,
        refreshWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
