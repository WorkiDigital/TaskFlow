import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface SidebarContextData {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextData | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("sidebar_collapsed");
      return stored ? JSON.parse(stored) === true : false;
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar_collapsed", JSON.stringify(next));
      return next;
    });
  };

  const setCollapsed = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    localStorage.setItem("sidebar_collapsed", JSON.stringify(collapsed));
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleCollapse, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
