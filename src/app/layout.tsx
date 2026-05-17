import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import RootLayoutInner from "@/components/layout/RootLayoutInner";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Finance Dashboard - Personal Finance",
  description: "Track your personal finances with ease",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased bg-bg-page text-text-primary min-h-screen">
        <AuthProvider>
          <SidebarProvider>
            <RootLayoutInner>{children}</RootLayoutInner>
            <Toaster />
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
