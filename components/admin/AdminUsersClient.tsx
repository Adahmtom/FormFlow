// components/admin/AdminUsersClient.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inviteUser, updateUserRole, toggleUserActive, deleteUser } from "@/lib/actions/users";
import type { UserProfile, UserRole } from "@/types";

const ROLES: { value: UserRole; label: string; desc: string; color: string }[] = [
  { value: "admin",     label: "Admin",     desc: "Full access — manage users, forms, responses", color: "#FF6B35" },
  { value: "editor",    label: "Editor",    desc: "Create & edit forms, view responses",           color: "#00D4FF" },
  { value: "viewer",    label: "Viewer",    desc: "View forms and responses only",                 color: "#C77DFF" },
  { value: "responder", label: "Responder", desc: "Submit forms only",                             color: "#22c55e" },
];

const roleColor = (role: UserRole) => ROLES.find(r => r.value === role)?.color ?? "#666";

export default function AdminUsersClient({
  users,
  currentUserId,
}: {
  users: UserProfile[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [showInvite, setShowInvite] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Invite form state
  const [inviteData, setInviteData] = useState({ email: "", full_name: "", role: "viewer" as UserRole, password: "" });
  const [inviteError, setInviteError] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true); setInviteError("");
    const res = await inviteUser(inviteData);
    setInviteLoading(false);
    if (!res.success) { setInviteError(res.error ?? "Failed"); return; }
    setShowInvite(false);
    setInviteData({ email: "", full_name: "", role: "viewer", password: "" });
    showToast("User invited successfully ✓");
    router.refresh();
  };

  const handleRoleChange = (userId: string, role: UserRole) => {
    start(async () => { await updateUserRole(userId, role); showToast("Role updated ✓"); router.refresh(); });
  };

  const handleToggleActive = (userId: string, current: boolean) => {
    start(async () => { await toggleUserActive(userId, !current); showToast(`User ${!current ? "activated" : "deactivated"} ✓`); router.refresh(); });
  };

  const handleDelete = (userId: string, email: string) => {
    if (!confirm(`Permanently delete ${email}? This cannot be undone.`)) return;
    start(async () => { await deleteUser(userId); showToast("User deleted"); router.refresh(); });
  };

  const inp: React.CSSProperties = { width: "100%", background: "#0e0e16", border: "1.5px solid #1e1e30", borderRadius: 9, color: "#F0EFF8", fontFamily: "Outfit,sans-serif", fontSize: 13, padding: "9px 12px", outline: "none" };

  return (
    <div style={{ padding: "clamp(16px, 4vw, 36px)" }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: toast.ok ? "#0d1f0d" : "#1f0d0d", border: `1.5px solid ${toast.ok ? "#22c55e" : "#ef4444"}`, borderRadius: 11, padding: "11px 18px", fontSize: 13, color: toast.ok ? "#86efac" : "#fca5a5", fontWeight: 700 }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 10, color: "#FF6B35", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 5 }}>Admin</div>
          <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 40, letterSpacing: ".05em", lineHeight: 1 }}>USER MANAGEMENT</h1>
          <div style={{ fontSize: 13, color: "#555", marginTop: 6 }}>{users.length} users · manage access levels and permissions</div>
        </div>
        <button onClick={() => setShowInvite(true)} style={{ background: "linear-gradient(135deg,#FF6B35,#FF9A5C)", color: "#fff", border: "none", borderRadius: 9, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif" }}>
          + Invite User
        </button>
      </div>

      {/* Role legend */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {ROLES.map(r => (
          <div key={r.value} style={{ background: "#0d0d16", border: `1.5px solid ${r.color}25`, borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "flex-start", gap: 10, flex: "1 1 180px" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.color, marginTop: 5, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: r.color }}>{r.label}</div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 2, lineHeight: 1.4 }}>{r.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div style={{ background: "#0d0d16", border: "1.5px solid #171726", borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#0a0a12" }}>
              {["User", "Role", "Status", "Invited", "Actions"].map(h => (
                <th key={h} style={{ padding: "12px 18px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#444", letterSpacing: ".07em", textTransform: "uppercase", borderBottom: "1.5px solid #111120" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: "1px solid #0f0f1a" }}>
                <td style={{ padding: "14px 18px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{u.full_name || "—"}</div>
                  <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{u.email}</div>
                  {u.id === currentUserId && <span style={{ fontSize: 10, color: "#FF6B35", fontWeight: 700 }}>YOU</span>}
                </td>
                <td style={{ padding: "14px 18px" }}>
                  {u.id === currentUserId ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${roleColor(u.role)}20`, color: roleColor(u.role), border: `1px solid ${roleColor(u.role)}30` }}>
                      {u.role}
                    </span>
                  ) : (
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u.id, e.target.value as UserRole)}
                      disabled={isPending}
                      style={{ ...inp, width: "auto", fontSize: 12, padding: "5px 10px", cursor: "pointer", color: roleColor(u.role) }}
                    >
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  )}
                </td>
                <td style={{ padding: "14px 18px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: u.is_active ? "#22c55e20" : "#ef444420", color: u.is_active ? "#22c55e" : "#ef4444", border: `1px solid ${u.is_active ? "#22c55e30" : "#ef444430"}` }}>
                    {u.is_active ? "● Active" : "○ Inactive"}
                  </span>
                </td>
                <td style={{ padding: "14px 18px", fontSize: 12, color: "#555" }}>
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td style={{ padding: "14px 18px" }}>
                  {u.id !== currentUserId && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => handleToggleActive(u.id, u.is_active)}
                        disabled={isPending}
                        style={{ background: "transparent", color: u.is_active ? "#f59e0b" : "#22c55e", border: `1.5px solid ${u.is_active ? "#f59e0b30" : "#22c55e30"}`, borderRadius: 7, padding: "5px 11px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif" }}
                      >
                        {u.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleDelete(u.id, u.email)}
                        disabled={isPending}
                        style={{ background: "rgba(239,68,68,.08)", color: "#f87171", border: "1.5px solid rgba(239,68,68,.2)", borderRadius: 7, padding: "5px 11px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif" }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#0d0d16", border: "1.5px solid #1e1e30", borderRadius: 16, padding: 32, width: "100%", maxWidth: 460 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>Invite New User</h2>
              <button onClick={() => { setShowInvite(false); setInviteError(""); }} style={{ background: "none", border: "none", color: "#555", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <form onSubmit={handleInvite} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#555", letterSpacing: ".07em", textTransform: "uppercase", marginBottom: 6 }}>Full Name</div>
                <input style={inp} placeholder="Jane Smith" value={inviteData.full_name} onChange={e => setInviteData(p => ({ ...p, full_name: e.target.value }))} required />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#555", letterSpacing: ".07em", textTransform: "uppercase", marginBottom: 6 }}>Email</div>
                <input style={inp} type="email" placeholder="jane@company.com" value={inviteData.email} onChange={e => setInviteData(p => ({ ...p, email: e.target.value }))} required />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#555", letterSpacing: ".07em", textTransform: "uppercase", marginBottom: 6 }}>Temporary Password</div>
                <input style={inp} type="password" placeholder="Min. 8 characters" value={inviteData.password} onChange={e => setInviteData(p => ({ ...p, password: e.target.value }))} required minLength={8} />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#555", letterSpacing: ".07em", textTransform: "uppercase", marginBottom: 8 }}>Access Level</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {ROLES.map(r => (
                    <label key={r.value} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 9, border: `1.5px solid ${inviteData.role === r.value ? r.color : "#1e1e30"}`, background: inviteData.role === r.value ? `${r.color}10` : "transparent", cursor: "pointer", transition: "all .2s" }}>
                      <input type="radio" name="role" value={r.value} checked={inviteData.role === r.value} onChange={() => setInviteData(p => ({ ...p, role: r.value }))} style={{ accentColor: r.color }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: inviteData.role === r.value ? r.color : "#F0EFF8" }}>{r.label}</div>
                        <div style={{ fontSize: 11, color: "#555" }}>{r.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              {inviteError && <div style={{ fontSize: 13, color: "#f87171", background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.2)", borderRadius: 8, padding: "10px 14px" }}>{inviteError}</div>}
              <button type="submit" disabled={inviteLoading} style={{ background: "linear-gradient(135deg,#FF6B35,#FF9A5C)", color: "#fff", border: "none", borderRadius: 9, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif", opacity: inviteLoading ? .7 : 1, marginTop: 4 }}>
                {inviteLoading ? "Inviting…" : "Send Invite"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
