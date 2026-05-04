"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { ChevronLeft, Upload, LayoutDashboard, PiggyBank, Repeat, ArrowLeftRight, Settings } from "lucide-react";
import { CsvUploadDialog } from "@/components/CsvUploadDialog";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/budgets", label: "Presupuestos", icon: PiggyBank },
  { href: "/subscriptions", label: "Suscripciones", icon: Repeat },
  { href: "/transactions", label: "Transacciones", icon: ArrowLeftRight },
  { href: "/preferences", label: "Preferencias", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isCollapsed, toggleCollapsed } = useSidebar();
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : "U";

  const handleNavClick = () => {
    if (!isCollapsed) {
      toggleCollapsed();
    }
  };

  return (
    <>
      {!isCollapsed && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 40,
          }}
          onClick={toggleCollapsed}
        />
      )}

      <aside
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          height: "100vh",
          width: isCollapsed ? 64 : 240,
          background: "#111111",
          borderRight: "1px solid #252525",
          display: "flex",
          flexDirection: "column",
          zIndex: 50,
          transition: "width 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* Header */}
        <div style={{
          padding: isCollapsed ? "24px 12px 16px" : "24px 16px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: isCollapsed ? "center" : "space-between",
        }}>
          <span style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "18px",
            fontWeight: "bold",
            color: "#e8e8e8",
          }}>
            {isCollapsed ? userInitial : "FINANCE"}
          </span>
          {!isCollapsed && (
            <button onClick={toggleCollapsed} style={{ background: "none", border: "none", color: "#888888", cursor: "pointer", padding: "4px" }}>
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {user?.email && !isCollapsed && (
          <p style={{
            fontSize: "11px",
            color: "#888888",
            padding: "0 16px",
            marginBottom: "16px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {user.email}
          </p>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                onClick={handleNavClick}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: isCollapsed ? "center" : "flex-start",
                  padding: isCollapsed ? "10px 0" : "10px 12px",
                  borderRadius: "4px",
                  color: active ? "#a6e22e" : "#888888",
                  background: active ? "rgba(166, 226, 46, 0.05)" : "transparent",
                  borderLeft: active && !isCollapsed ? "2px solid #a6e22e" : "2px solid transparent",
                  textDecoration: "none",
                  fontSize: "12px",
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase" as const,
                  transition: "all 0.2s",
                  marginBottom: "2px",
                }}
              >
                {isCollapsed ? (
                  <Icon size={16} strokeWidth={1.5} />
                ) : (
                  <span>{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "16px 8px", borderTop: "1px solid #252525" }}>
          {/* CSV Upload button - always visible */}
          <button
            onClick={() => setCsvDialogOpen(true)}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = "#a6e22e"; }}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = "#888888"; }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: isCollapsed ? "center" : "flex-start",
              width: "100%",
              padding: isCollapsed ? "10px 0" : "10px 12px",
              background: "none",
              border: "none",
              color: "#888888",
              cursor: "pointer",
              fontSize: "12px",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              marginBottom: "8px",
              transition: "all 0.2s",
            }}
            title={isCollapsed ? "Subir extracto" : undefined}
          >
            <Upload size={isCollapsed ? 16 : 14} strokeWidth={1.5} style={{ marginRight: isCollapsed ? 0 : "8px" }} />
            {!isCollapsed && "Subir extracto"}
          </button>

          {isCollapsed && (
            <button onClick={toggleCollapsed} style={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
              padding: "10px 0",
              background: "none",
              border: "none",
              color: "#888888",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "bold",
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              &raquo;
            </button>
          )}

          {!isCollapsed && (
            <button
              onClick={logout}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = "#f44747"; }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = "#888888"; }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                width: "100%",
                padding: "10px 12px",
                background: "none",
                border: "none",
                color: "#888888",
                cursor: "pointer",
                fontSize: "12px",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                marginTop: "8px",
              }}
            >
              Cerrar sesion
            </button>
          )}
        </div>
      </aside>

      <CsvUploadDialog
        open={csvDialogOpen}
        onClose={() => setCsvDialogOpen(false)}
        onImported={() => window.location.reload()}
      />
    </>
  );
}
