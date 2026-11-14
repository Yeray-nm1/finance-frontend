"use client";

import { useAuth } from "@/hooks/useAuth";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileTopBar } from "@/components/layout/MobileTopBar";
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

  return (
    <>
      <div
        className="app-shell"
        data-sidebar={showSidebar ? (isCollapsed ? "collapsed" : "expanded") : "none"}
      >
        {showSidebar && <Sidebar />}
        <main className="app-main">
          {showSidebar && <MobileTopBar />}
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
      <Toaster />
    </>
  );
}
