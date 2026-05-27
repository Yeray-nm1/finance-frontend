"use client";

import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useSidebar } from "@/contexts/SidebarContext";

interface RootLayoutInnerProps {
  readonly children: React.ReactNode;
}

export default function RootLayoutInner({ children }: Readonly<RootLayoutInnerProps>) {
  const { isAuthenticated, isLoading } = useAuth();
  const { isCollapsed } = useSidebar();
  const pathname = usePathname();
  const showSidebar = isAuthenticated && !isLoading && !["/login", "/register"].includes(pathname);
  const sidebarCollapsed = isCollapsed ? "64px" : "240px";
  const sidebarWidth = showSidebar ? sidebarCollapsed : "0px";

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `${sidebarWidth} 1fr`,
          minHeight: "100vh",
        }}
      >
        {showSidebar && <Sidebar />}
        <main style={{ gridColumn: 2, minWidth: 0 }}>
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
      <Toaster />
    </>
  );
}
