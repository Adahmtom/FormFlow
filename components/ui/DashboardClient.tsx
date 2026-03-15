// components/ui/DashboardClient.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { FORM_CATEGORIES } from "@/lib/constants";
import type { Form } from "@/types";
import type { FileUploadEntry } from "@/app/(app)/dashboard/page";

const EXT_COLORS: Record<string, string> = {
  pdf: "#f87171", jpg: "#34d399", jpeg: "#34d399", png: "#34d399",
  gif: "#34d399", doc: "#60a5fa", docx: "#60a5fa", xls: "#4ade80",
  xlsx: "#4ade80", zip: "#fb923c", txt: "#a78bfa",
};

export default function DashboardClient({
  forms,
  responseMap,
  fileUploads,
}: {
  forms: Form[];
  responseMap: Record<string, number>;
  fileUploads: FileUploadEntry[];
}) {
  const [downloadingPath, setDownloadingPath] = useState<string | null>(null);
  const [activeCat, setActiveCat]             = useState<string>("all");
  const [expandedForms, setExpandedForms]     = useState<Record<string, boolean>>({});

  const totalResp = Object.values(responseMap).reduce((s, c) => s + c, 0);
  const catCount  = (id: string) => forms.filter(f => f.category === id).length;
  const catResp   = (id: string) =>
    forms.filter(f => f.category === id).reduce((s, f) => s + (responseMap[f.id] || 0), 0);

  const handleDownload = async (filePath: string, fileName: string) => {
    setDownloadingPath(filePath);
    try {
      const res  = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`);
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch {}
    setDownloadingPath(null);
  };

  const toggleForm = (formId: string) =>
    setExpandedForms(prev => ({ ...prev, [formId]: !prev[formId] }));

  // ── Group file uploads by formId, then filter by category tab ──
  const filteredUploads = activeCat === "all"
    ? fileUploads
    : fileUploads.filter(e => {
        const form = forms.find(f => f.id === e.formId);
        return form?.category === activeCat;
      });

  // Group by formId preserving order of first appearance
  const groupedByForm: { formId: string; entries: FileUploadEntry[] }[] = [];
  const seen = new Set<string>();
  for (const entry of filteredUploads) {
    if (!seen.has(entry.formId)) {
      seen.add(entry.formId);
      groupedByForm.push({ formId: entry.formId, entries: [] });
    }
    groupedByForm.find(g => g.formId === entry.formId)!.entries.push(entry);
  }

  // Category tab counts
  const catFileCounts: Record<string, number> = { all: fileUploads.length };
  for (const cat of FORM_CATEGORIES) {
    catFileCounts[cat.id] = fileUploads.filter(e => {
      const form = forms.find(f => f.id === e.formId);
      return form?.category === cat.id;
    }).length;
  }

  // ── Shared tokens ──
  const card: React.CSSProperties = { background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 14 };
  const dimText: React.CSSProperties   = { color: "var(--text-dim)" };
  const mutedText: React.CSSProperties = { color: "var(--text-muted)" };

  return (
    <div style={{ padding: "clamp(16px, 4vw, 36px)" }} className="animate-fade-up">

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: "var(--accent)", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 5 }}>Overview</div>
          <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(28px, 5vw, 40px)", letterSpacing: ".05em", lineHeight: 1, color: "var(--text)" }}>DASHBOARD</h1>
        </div>
        <Link href="/builder" style={{ background: "linear-gradient(135deg,#FF6B35,#FF9A5C)", color: "#fff", borderRadius: 9, padding: "10px 20px", fontSize: 13, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
          + New Form
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Forms",   value: forms.length,                             accent: "#FF6B35" },
          { label: "All Responses", value: totalResp,                                accent: "#00D4FF" },
          { label: "Active Forms",  value: forms.filter(f => f.is_published).length, accent: "#22c55e" },
          { label: "File Uploads",  value: fileUploads.length,                       accent: "#C77DFF" },
        ].map(s => (
          <div key={s.label} style={{ ...card, padding: 20, borderTop: `3px solid ${s.accent}` }}>
            <div style={{ fontSize: 38, fontFamily: "'Bebas Neue',sans-serif", color: s.accent, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12, marginBottom: 24 }}>
        {FORM_CATEGORIES.map(cat => (
          <div key={cat.id} style={{ background: "var(--bg-card)", border: `1.5px solid ${cat.color}20`, borderRadius: 14, padding: 20, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: cat.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{cat.icon}</div>
            <div>
              <div style={{ fontSize: 10, color: cat.color, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", marginBottom: 3 }}>{cat.label}</div>
              <div style={{ fontSize: 24, fontFamily: "'Bebas Neue',sans-serif", color: cat.color, lineHeight: 1 }}>
                {catCount(cat.id)}{" "}
                <span style={{ fontSize: 12, color: "var(--text-dim)", fontFamily: "Outfit,sans-serif" }}>forms · {catResp(cat.id)} resp.</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two-column bottom section */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16 }}>

        {/* Recent Forms */}
        <div style={{ ...card, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", ...dimText }}>Recent Forms</div>
            <Link href="/forms" style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}>View all →</Link>
          </div>
          {forms.length === 0
            ? (
              <div style={{ textAlign: "center", padding: "32px 0", ...dimText }}>
                No forms yet.{" "}
                <Link href="/builder" style={{ color: "#FF9A5C" }}>Create one →</Link>
              </div>
            )
            : forms.slice(0, 6).map(form => {
                const cat = FORM_CATEGORIES.find(c => c.id === form.category)!;
                const rc  = responseMap[form.id] || 0;
                return (
                  <div key={form.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: "1.5px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: cat.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{cat.icon}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 1, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{form.name}</div>
                        <div style={{ fontSize: 11, ...dimText }}>{form.fields.length} fields · <span style={{ color: cat.color }}>{rc} resp.</span></div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                      <Link href={`/f/${form.id}`} target="_blank" style={{ background: "transparent", color: "var(--text-muted)", border: "1.5px solid var(--border-lt)", borderRadius: 8, padding: "5px 10px", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>↗</Link>
                      <Link href={`/forms/${form.id}/responses`} style={{ background: "transparent", color: "var(--text-muted)", border: "1.5px solid var(--border-lt)", borderRadius: 8, padding: "5px 10px", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>Data</Link>
                    </div>
                  </div>
                );
              })
          }
        </div>

        {/* ── File Uploads (grouped by form, filtered by category) ── */}
        <div style={{ ...card, padding: 22, display: "flex", flexDirection: "column" }}>

          {/* Card header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", ...dimText }}>
              📎 File Uploads
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#C77DFF", background: "#C77DFF15", padding: "2px 8px", borderRadius: 20 }}>
              {filteredUploads.length}
            </span>
          </div>

          {/* Category filter tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {[{ id: "all", label: "All", color: "#C77DFF", icon: "📂" }, ...FORM_CATEGORIES].map(tab => {
              const isActive = activeCat === tab.id;
              const count    = catFileCounts[tab.id] ?? 0;
              const cat      = FORM_CATEGORIES.find(c => c.id === tab.id);
              const color    = cat?.color ?? "#C77DFF";
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveCat(tab.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "5px 11px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                    cursor: "pointer", fontFamily: "Outfit,sans-serif", transition: "all .15s",
                    background: isActive ? `${color}18` : "transparent",
                    color: isActive ? color : "var(--text-muted)",
                    border: `1.5px solid ${isActive ? `${color}40` : "var(--border)"}`,
                  }}
                >
                  <span>{tab.icon ?? cat?.icon}</span>
                  {tab.label}
                  <span style={{ background: isActive ? `${color}25` : "var(--bg-sub)", color: isActive ? color : "var(--text-dim)", borderRadius: 10, padding: "1px 6px", fontSize: 10 }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          {filteredUploads.length === 0
            ? (
              <div style={{ textAlign: "center", padding: "32px 0", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
                <div style={{ fontSize: 13, fontWeight: 600, ...mutedText, marginBottom: 4 }}>No files yet</div>
                <div style={{ fontSize: 12, ...dimText }}>
                  {activeCat === "all"
                    ? "Files submitted through your forms will appear here"
                    : `No files uploaded via ${FORM_CATEGORIES.find(c => c.id === activeCat)?.label} forms`}
                </div>
              </div>
            )
            : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {groupedByForm.map(({ formId, entries }) => {
                  const form    = forms.find(f => f.id === formId);
                  const cat     = FORM_CATEGORIES.find(c => c.id === form?.category);
                  const isOpen  = expandedForms[formId] !== false; // default open
                  const PREVIEW = 3;

                  return (
                    <div key={formId} style={{ border: `1.5px solid ${cat?.color ?? "var(--border)"}22`, borderRadius: 10, overflow: "hidden" }}>

                      {/* Form group header */}
                      <button
                        onClick={() => toggleForm(formId)}
                        style={{
                          width: "100%", display: "flex", alignItems: "center", gap: 8,
                          padding: "10px 12px", background: cat ? `${cat.color}0c` : "var(--bg-sub)",
                          border: "none", borderBottom: isOpen ? `1.5px solid ${cat?.color ?? "var(--border)"}22` : "none",
                          cursor: "pointer", fontFamily: "Outfit,sans-serif", textAlign: "left",
                        }}
                      >
                        {/* Category icon */}
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: cat?.bg ?? "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>
                          {cat?.icon ?? "📄"}
                        </div>

                        {/* Form name */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {form?.name ?? entries[0].formName}
                          </div>
                          <div style={{ fontSize: 10, color: cat?.color ?? "var(--text-dim)", fontWeight: 600 }}>
                            {cat?.label ?? "Form"} · {entries.length} file{entries.length !== 1 ? "s" : ""}
                          </div>
                        </div>

                        {/* View responses link */}
                        <Link
                          href={`/forms/${formId}/responses`}
                          onClick={e => e.stopPropagation()}
                          style={{ fontSize: 10, fontWeight: 700, color: cat?.color ?? "var(--accent)", textDecoration: "none", padding: "3px 8px", border: `1px solid ${cat?.color ?? "var(--accent)"}30`, borderRadius: 6, flexShrink: 0 }}
                        >
                          Responses →
                        </Link>

                        {/* Collapse arrow */}
                        <span style={{ fontSize: 10, color: "var(--text-dim)", transition: "transform .2s", display: "inline-block", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", flexShrink: 0 }}>
                          ▶
                        </span>
                      </button>

                      {/* File rows */}
                      {isOpen && (
                        <div style={{ background: "var(--bg-card)" }}>
                          {entries.slice(0, PREVIEW).map((entry, i) => {
                            const ext       = entry.fileName.split(".").pop()?.toLowerCase() || "";
                            const extColor  = EXT_COLORS[ext] || "#C77DFF";
                            const isLoading = downloadingPath === entry.filePath;

                            // Submitter avatar
                            const initials = entry.submitterName
                              ? entry.submitterName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
                              : "?";
                            const avatarColor = entry.submitterEmail
                              ? `hsl(${[...entry.submitterEmail].reduce((n, c) => n + c.charCodeAt(0), 0) % 360},55%,55%)`
                              : (cat?.color ?? "#C77DFF");

                            return (
                              <div key={`${entry.filePath}-${i}`} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderBottom: i < entries.slice(0, PREVIEW).length - 1 ? "1px solid var(--border)" : "none" }}>

                                {/* Submitter avatar */}
                                <div
                                  title={[entry.submitterName, entry.submitterEmail].filter(Boolean).join(" · ") || "Anonymous"}
                                  style={{ width: 30, height: 30, borderRadius: "50%", background: `${avatarColor}20`, border: `1.5px solid ${avatarColor}50`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}
                                >
                                  <span style={{ fontSize: 10, fontWeight: 800, color: avatarColor }}>{initials}</span>
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  {/* Submitter row */}
                                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2, flexWrap: "wrap" }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap" }}>
                                      {entry.submitterName ?? "Anonymous"}
                                    </span>
                                    {entry.submitterEmail && (
                                      <span style={{ fontSize: 10, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>
                                        {entry.submitterEmail}
                                      </span>
                                    )}
                                  </div>
                                  {/* File row */}
                                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                    <div style={{ width: 18, height: 18, borderRadius: 4, background: `${extColor}12`, border: `1px solid ${extColor}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                      <span style={{ fontSize: 7, fontWeight: 800, color: extColor, textTransform: "uppercase" }}>{ext || "?"}</span>
                                    </div>
                                    <span style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {entry.fileName}
                                    </span>
                                  </div>
                                  {/* Meta */}
                                  <div style={{ fontSize: 10, ...dimText, marginTop: 2 }}>
                                    {entry.fieldLabel} · {new Date(entry.submittedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                  </div>
                                </div>

                                {/* Download */}
                                <button
                                  onClick={() => handleDownload(entry.filePath, entry.fileName)}
                                  disabled={isLoading}
                                  title={`Download ${entry.fileName}`}
                                  style={{
                                    background: isLoading ? "transparent" : "#00D4FF12",
                                    color: isLoading ? "var(--text-dim)" : "#00D4FF",
                                    border: `1.5px solid ${isLoading ? "var(--border)" : "#00D4FF28"}`,
                                    borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 700,
                                    cursor: isLoading ? "not-allowed" : "pointer", fontFamily: "Outfit,sans-serif",
                                    flexShrink: 0, transition: "all .15s", marginTop: 2,
                                  }}
                                >
                                  {isLoading ? "⏳" : "↓"}
                                </button>
                              </div>
                            );
                          })}

                          {/* "N more" footer if form has many files */}
                          {entries.length > PREVIEW && (
                            <div style={{ padding: "7px 12px", background: "var(--bg-sub)", borderTop: "1px solid var(--border)" }}>
                              <Link href={`/forms/${formId}/responses`} style={{ fontSize: 11, color: cat?.color ?? "var(--accent)", fontWeight: 700, textDecoration: "none" }}>
                                +{entries.length - PREVIEW} more file{entries.length - PREVIEW !== 1 ? "s" : ""} — view in Responses →
                              </Link>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>

      </div>
    </div>
  );
}
