"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { ChevronLeft, ChevronRight, Upload, LayoutDashboard, PiggyBank, Repeat, ArrowLeftRight, Settings } from "lucide-react";
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
  const router = useRouter();
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
          position: isCollapsed ? "sticky" : "fixed",
          ...(isCollapsed
            ? { top: 0 }
            : { left: 0, top: 0, zIndex: 40 }
          ),
          height: "100vh",
          width: isCollapsed ? 64 : 240,
          background: "#ffffff",
          borderRight: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
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
            fontSize: "18px",
            fontWeight: "bold",
            color: "#111827",
          }}>
            {isCollapsed ? userInitial : "FINANCE"}
          </span>
          {!isCollapsed && (
            <button onClick={toggleCollapsed} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: "4px" }}>
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {user?.email && !isCollapsed && (
          <p style={{
            fontSize: "11px",
            color: "#6b7280",
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
                  borderRadius: "6px",
                  color: active ? "#005696" : "#6b7280",
                  background: active ? "rgba(0, 86, 150, 0.06)" : "transparent",
                  borderLeft: active && !isCollapsed ? "2px solid #005696" : "2px solid transparent",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: active ? "600" : "400",
                  transition: "all 0.2s",
                  marginBottom: "2px",
                }}
              >
                {isCollapsed ? (
                  <Icon size={18} strokeWidth={1.5} />
                ) : (
                  <span>{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "16px 8px 0", borderTop: "1px solid #e5e7eb" }}>
          {/* CSV Upload button - always visible */}
          <button
            onClick={() => setCsvDialogOpen(true)}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = "#005696"; }}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = "#6b7280"; }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: isCollapsed ? "center" : "flex-start",
              width: "100%",
              padding: isCollapsed ? "10px 0" : "10px 12px",
              background: "none",
              border: "none",
              color: "#6b7280",
              cursor: "pointer",
              fontSize: "13px",
              transition: "all 0.2s",
            }}
            title={isCollapsed ? "Subir extracto" : undefined}
          >
            <Upload size={isCollapsed ? 18 : 14} strokeWidth={1.5} style={{ marginRight: isCollapsed ? 0 : "8px" }} />
            {!isCollapsed && "Subir extracto"}
          </button>

          {!isCollapsed && (
            <button
              onClick={logout}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = "#dc2626"; }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = "#6b7280"; }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                width: "100%",
                padding: "10px 12px",
                background: "none",
                border: "none",
                color: "#6b7280",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              Cerrar sesion
            </button>
          )}

          {/* Toggle - only at bottom when collapsed (expand) */}
          {isCollapsed && (
            <button
              onClick={toggleCollapsed}
              title="Expandir sidebar"
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                padding: "12px 0",
                background: "none",
                border: "none",
                color: "#6b7280",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              <ChevronRight size={16} strokeWidth={2} />
            </button>
          )}
        </div>
      </aside>

      <CsvUploadDialog
        open={csvDialogOpen}
        onClose={() => setCsvDialogOpen(false)}
        onImported={() => router.refresh()}
      />
    </>
  );
}
