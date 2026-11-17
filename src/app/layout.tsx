import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import RootLayoutInner from "@/components/layout/RootLayoutInner";

export const metadata: Metadata = {
  title: "Finance Dashboard - Personal Finance",
  description: "Track your personal finances with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased bg-bg-page text-text-primary min-h-screen">
        <AuthProvider>
          <NotificationsProvider>
            <SidebarProvider>
              <RootLayoutInner>{children}</RootLayoutInner>
            </SidebarProvider>
          </NotificationsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
