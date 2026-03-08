// components/ui/Sidebar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FORM_CATEGORIES } from "@/lib/constants";
import type { UserRole } from "@/types";

export default function Sidebar({ userEmail, userRole }: { userEmail: string; userRole: UserRole }) {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();
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
      color: isOn(href) ? "#FF9A5C" : "#666",
    }}>
      <span style={{ fontSize: 16 }}>{icon}</span>{label}
    </Link>
  );

  const sidebarContent = (
    <>
      {/* Logo */}
      <div style={{ padding: "4px 14px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, letterSpacing: ".08em", background: "linear-gradient(135deg,#FF6B35,#FF9A5C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>FORMFLOW</div>
          <div style={{ fontSize: 10, color: "#2a2a40", marginTop: 2, letterSpacing: ".07em", textTransform: "uppercase" }}>Pro Builder</div>
        </div>
        {isMobile && (
          <button onClick={() => setOpen(false)} style={{
            background: "#1e1e30", border: "none", color: "#777", fontSize: 18, cursor: "pointer",
            width: 34, height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        )}
      </div>

      {/* Main nav */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {navLink("/dashboard", "Dashboard", "▣")}
        {navLink("/forms", "All Forms", "◫")}
      </div>

      {/* Admin section */}
      {userRole === "admin" && (
        <div style={{ marginTop: 10, borderTop: "1.5px solid #111120", paddingTop: 14 }}>
          <div style={{ fontSize: 10, color: "#2a2a40", letterSpacing: ".07em", textTransform: "uppercase", paddingLeft: 14, marginBottom: 8 }}>Admin</div>
          {navLink("/admin/users", "User Management", "👥")}
        </div>
      )}

      {/* Quick create */}
      {(userRole === "admin" || userRole === "editor") && (
        <div style={{ marginTop: 10, borderTop: "1.5px solid #111120", paddingTop: 14 }}>
          <div style={{ fontSize: 10, color: "#2a2a40", letterSpacing: ".07em", textTransform: "uppercase", paddingLeft: 14, marginBottom: 8 }}>Quick Create</div>
          {FORM_CATEGORIES.map(cat => (
            <Link key={cat.id} href={`/builder?category=${cat.id}`}
              style={{ padding: "10px 14px", borderRadius: 10, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "#555", transition: "all .2s" }}>
              <span>{cat.icon}</span>{cat.label}
            </Link>
          ))}
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
        <div style={{ padding: "10px 12px", borderRadius: 10, background: "#0d0d16", border: "1px solid #171726" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontSize: 11, color: "#444", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{userEmail}</div>
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
          background: "#08080f", borderBottom: "1.5px solid #111120",
          padding: "10px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <button onClick={() => setOpen(true)} style={{
            background: "none", border: "1.5px solid #1e1e30", borderRadius: 8,
            color: "#888", fontSize: 20, cursor: "pointer", padding: "6px 10px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>☰</button>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: ".08em", background: "linear-gradient(135deg,#FF6B35,#FF9A5C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>FORMFLOW</div>
          <div style={{ width: 40 }} /> {/* spacer for centering */}
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
        background: "#08080f",
        borderRight: "1.5px solid #111120",
        padding: "18px 10px",
        display: "flex", flexDirection: "column", gap: 3,
        flexShrink: 0,
        height: "100vh",
        overflowY: "auto",
        ...(isMobile ? {
          position: "fixed",
          top: 0,
          left: open ? 0 : -300,
          zIndex: 99,
          transition: "left .25s ease",
          boxShadow: open ? "4px 0 24px rgba(0,0,0,.5)" : "none",
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
