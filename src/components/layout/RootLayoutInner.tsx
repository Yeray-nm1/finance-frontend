"use client";

import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "@/components/ui/toaster";
interface RootLayoutInnerProps {
  readonly children: React.ReactNode;
}

export default function RootLayoutInner({ children }: Readonly<RootLayoutInnerProps>) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const showSidebar = isAuthenticated && !isLoading && !["/login", "/register"].includes(pathname);

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: showSidebar ? "64px 1fr" : "1fr",
          minHeight: "100vh",
        }}
      >
        {showSidebar && <Sidebar />}
        <main style={{ gridColumn: 2, minWidth: 0 }}>
          {children}
        </main>
      </div>
      <Toaster />
    </>
  );
}
