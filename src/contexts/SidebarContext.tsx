"use client";

import { createContext, useContext, useState, useCallback, useMemo } from "react";

type SidebarContextType = {
  isCollapsed: boolean;
  toggleCollapsed: () => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const value = useMemo(() => ({ isCollapsed, toggleCollapsed }), [isCollapsed, toggleCollapsed]);

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within SidebarProvider");
  return context;
}
