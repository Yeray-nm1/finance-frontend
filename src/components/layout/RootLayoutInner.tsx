"use client";

import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "@/components/ui/toaster";

export default function RootLayoutInner({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const showSidebar = isAuthenticated && !isLoading && !["/login", "/register"].includes(pathname);

  return (
    <>
      {showSidebar && (
        <div style={{ paddingLeft: "64px" }}>
          <Sidebar />
          {children}
        </div>
      )}
      {!showSidebar && children}
      <Toaster />
    </>
  );
}
