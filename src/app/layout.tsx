import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import { SidebarProvider } from "@/contexts/SidebarContext";
import RootLayoutInner from "@/components/layout/RootLayoutInner";

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
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased bg-bg-primary text-text-primary min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider>
            <SidebarProvider>
              <RootLayoutInner>{children}</RootLayoutInner>
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
