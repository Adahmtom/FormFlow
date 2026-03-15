// components/ui/Sidebar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FORM_CATEGORIES } from "@/lib/constants";
import { useTheme } from "@/components/ThemeProvider";
import type { UserRole } from "@/types";

export default function Sidebar({ userEmail, userRole }: { userEmail: string; userRole: UserRole }) {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => { setOpen(false); }, [pathname]);

  // Prevent body scroll when sidebar open on mobile
  useEffect(() => {
    if (isMobile && open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isMobile, open]);

  const isOn = (path: string) => pathname.startsWith(path);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const roleColors: Record<UserRole, string> = {
    admin: "#FF6B35", editor: "#00D4FF", viewer: "#C77DFF", responder: "#22c55e",
  };

  const navLink = (href: string, label: string, icon: string) => (
    <Link key={href} href={href} style={{
      padding: "10px 14px", borderRadius: 10, fontSize: 14, fontWeight: 600,
      display: "flex", alignItems: "center", gap: 10, textDecoration: "none",
      transition: "all .2s",
      background: isOn(href) ? "#FF6B3515" : "transparent",
      color: isOn(href) ? "#FF9A5C" : "var(--text-muted)",
    }}>
      <span style={{ fontSize: 16 }}>{icon}</span>{label}
    </Link>
  );

  const isDark = theme === "dark";

  const sidebarContent = (
    <>
      {/* Logo + theme toggle */}
      <div style={{ padding: "4px 14px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, letterSpacing: ".08em", background: "linear-gradient(135deg,#FF6B35,#FF9A5C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>FORMFLOW</div>
          <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 2, letterSpacing: ".07em", textTransform: "uppercase" }}>Pro Builder</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Theme toggle */}
          <button
            onClick={toggle}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            style={{
              background: "var(--bg-card)",
              border: "1.5px solid var(--border-lt)",
              borderRadius: 8,
              color: isDark ? "#f59e0b" : "#6366f1",
              fontSize: 15,
              cursor: "pointer",
              width: 34,
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all .2s",
              flexShrink: 0,
            }}
          >
            {isDark ? "☀️" : "🌙"}
          </button>
          {isMobile && (
            <button onClick={() => setOpen(false)} style={{
              background: "var(--bg-card)", border: "1.5px solid var(--border-lt)", color: "var(--text-muted)", fontSize: 18, cursor: "pointer",
              width: 34, height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
          )}
        </div>
      </div>

      {/* Main nav */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {navLink("/dashboard", "Dashboard", "▣")}
        {navLink("/forms", "All Forms", "◫")}
        {/* Category shortcuts */}
        <div style={{ paddingLeft: 10, display: "flex", flexDirection: "column", gap: 1, marginTop: 2 }}>
          {FORM_CATEGORIES.map(cat => {
            const href  = `/forms?category=${cat.id}`;
            const active = pathname.startsWith("/forms") && new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("category") === cat.id;
            return (
              <Link key={cat.id} href={href} style={{
                padding: "7px 14px", borderRadius: 9, fontSize: 13, fontWeight: 600,
                display: "flex", alignItems: "center", gap: 9, textDecoration: "none",
                transition: "all .2s",
                color: "var(--text-muted)",
              }}>
                <span style={{ fontSize: 13 }}>{cat.icon}</span>{cat.label}
              </Link>
            );
          })}
        </div>
        <div style={{ marginTop: 4 }}>
          {navLink("/uploads", "File Uploads", "📎")}
        </div>
      </div>

      {/* Admin section */}
      {userRole === "admin" && (
        <div style={{ marginTop: 10, borderTop: "1.5px solid var(--border)", paddingTop: 14 }}>
          {navLink("/admin/users", "User Management", "👥")}
        </div>
      )}

      {/* Bottom */}
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8, paddingTop: 12 }}>
        {(userRole === "admin" || userRole === "editor") && (
          <Link href="/builder" style={{
            background: "linear-gradient(135deg,#FF6B35,#FF9A5C)", color: "#fff", border: "none",
            borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer",
            fontFamily: "Outfit,sans-serif", textAlign: "center", textDecoration: "none", display: "block",
          }}>+ New Form</Link>
        )}
        <div style={{ padding: "10px 12px", borderRadius: 10, background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontSize: 11, color: "var(--text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{userEmail}</div>
            <span style={{ fontSize: 10, fontWeight: 700, color: roleColors[userRole], background: `${roleColors[userRole]}15`, padding: "2px 7px", borderRadius: 20, marginLeft: 6, flexShrink: 0 }}>{userRole}</span>
          </div>
          <button onClick={handleSignOut} style={{ fontSize: 11, color: "#f87171", background: "none", border: "none", cursor: "pointer", fontFamily: "Outfit,sans-serif", fontWeight: 600, padding: 0 }}>Sign out</button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      {isMobile && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
          background: "var(--bg-sub)", borderBottom: "1.5px solid var(--border)",
          padding: "10px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <button onClick={() => setOpen(true)} style={{
            background: "none", border: "1.5px solid var(--border-lt)", borderRadius: 8,
            color: "var(--text-muted)", fontSize: 20, cursor: "pointer", padding: "6px 10px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>☰</button>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: ".08em", background: "linear-gradient(135deg,#FF6B35,#FF9A5C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>FORMFLOW</div>
          {/* Mobile theme toggle */}
          <button
            onClick={toggle}
            style={{
              background: "none", border: "1.5px solid var(--border-lt)", borderRadius: 8,
              color: isDark ? "#f59e0b" : "#6366f1", fontSize: 16, cursor: "pointer",
              width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {isDark ? "☀️" : "🌙"}
          </button>
        </div>
      )}

      {/* Mobile overlay */}
      {isMobile && open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 98,
            animation: "fadeIn .2s ease",
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: isMobile ? 280 : 220,
        background: "var(--bg-sub)",
        borderRight: "1.5px solid var(--border)",
        padding: "18px 10px",
        display: "flex", flexDirection: "column", gap: 3,
        flexShrink: 0,
        height: "100vh",
        overflowY: "auto",
        transition: "background .2s, border-color .2s",
        ...(isMobile ? {
          position: "fixed",
          top: 0,
          left: open ? 0 : -300,
          zIndex: 99,
          transition: "left .25s ease, background .2s",
          boxShadow: open ? "4px 0 24px rgba(0,0,0,.3)" : "none",
        } : {
          position: "sticky",
          top: 0,
        }),
      }}>
        {sidebarContent}
      </aside>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
}
