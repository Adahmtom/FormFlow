// components/ui/UploadsClient.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { FORM_CATEGORIES } from "@/lib/constants";
import type { Form } from "@/types";
import type { FileUploadEntry } from "@/app/(app)/dashboard/page";

const EXT_COLORS: Record<string, string> = {
  pdf: "#f87171", jpg: "#34d399", jpeg: "#34d399", png: "#34d399",
  gif: "#34d399", webp: "#34d399", doc: "#60a5fa", docx: "#60a5fa",
  xls: "#4ade80", xlsx: "#4ade80", zip: "#fb923c", txt: "#a78bfa",
  mp4: "#f472b6", mov: "#f472b6", mp3: "#e879f9",
};

export default function UploadsClient({
  forms,
  fileUploads,
}: {
  forms: Form[];
  fileUploads: FileUploadEntry[];
}) {
  const [activeCat,       setActiveCat]       = useState("all");
  const [search,          setSearch]          = useState("");
  const [downloadingPath, setDownloadingPath] = useState<string | null>(null);
  const [expandedForms,   setExpandedForms]   = useState<Record<string, boolean>>({});
  const [viewMode,        setViewMode]        = useState<"grouped" | "flat">("grouped");

  const toggleForm = (id: string) =>
    setExpandedForms(prev => ({ ...prev, [id]: prev[id] === false ? true : false }));

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

  // ── Filter ──
  const filtered = fileUploads.filter(e => {
    const catMatch = activeCat === "all" || forms.find(f => f.id === e.formId)?.category === activeCat;
    const searchMatch = !search || [e.fileName, e.formName, e.submitterName ?? "", e.submitterEmail ?? "", e.fieldLabel]
      .join(" ").toLowerCase().includes(search.toLowerCase());
    return catMatch && searchMatch;
  });

  // Category counts
  const catCount = (catId: string) =>
    catId === "all" ? fileUploads.length :
    fileUploads.filter(e => forms.find(f => f.id === e.formId)?.category === catId).length;

  // Group by form
  const groupedByForm: { formId: string; entries: FileUploadEntry[] }[] = [];
  const seen = new Set<string>();
  for (const entry of filtered) {
    if (!seen.has(entry.formId)) {
      seen.add(entry.formId);
      groupedByForm.push({ formId: entry.formId, entries: [] });
    }
    groupedByForm.find(g => g.formId === entry.formId)!.entries.push(entry);
  }

  const card: React.CSSProperties = { background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 14 };
  const dimText: React.CSSProperties = { color: "var(--text-dim)" };

  return (
    <div style={{ padding: "clamp(16px, 4vw, 36px)" }} className="animate-fade-up">

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: "var(--accent)", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 5 }}>Storage</div>
          <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(28px, 5vw, 40px)", letterSpacing: ".05em", lineHeight: 1, color: "var(--text)" }}>FILE UPLOADS</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", ...dimText, fontSize: 13 }}>🔍</span>
            <input
              className="dark-input"
              style={{ paddingLeft: 30, width: 200 }}
              placeholder="Search files, users…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {/* View toggle */}
          <div style={{ display: "flex", border: "1.5px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
            {(["grouped", "flat"] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: "7px 13px", fontSize: 11, fontWeight: 700, fontFamily: "Outfit,sans-serif",
                  cursor: "pointer", border: "none", transition: "all .15s",
                  background: viewMode === mode ? "var(--accent)" : "transparent",
                  color: viewMode === mode ? "#fff" : "var(--text-muted)",
                }}
              >
                {mode === "grouped" ? "⊞ Grouped" : "≡ List"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10, marginBottom: 22 }}>
        {[
          { label: "Total Files",  value: fileUploads.length,    accent: "#C77DFF" },
          { label: "Forms w/ Files", value: new Set(fileUploads.map(e => e.formId)).size, accent: "#00D4FF" },
          { label: "Unique Users", value: new Set(fileUploads.map(e => e.submitterEmail ?? e.submitterName ?? "anon")).size, accent: "#22c55e" },
          { label: "Filtered",     value: filtered.length,       accent: "#f59e0b" },
        ].map(s => (
          <div key={s.label} style={{ ...card, padding: "14px 16px", borderTop: `3px solid ${s.accent}` }}>
            <div style={{ fontSize: 28, fontFamily: "'Bebas Neue',sans-serif", color: s.accent, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Category tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {[{ id: "all", label: "All Files", icon: "📂" }, ...FORM_CATEGORIES].map(tab => {
          const isActive = activeCat === tab.id;
          const cat      = FORM_CATEGORIES.find(c => c.id === tab.id);
          const color    = cat?.color ?? "#C77DFF";
          const count    = catCount(tab.id);
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCat(tab.id)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: "Outfit,sans-serif", transition: "all .15s",
                background: isActive ? `${color}18` : "transparent",
                color: isActive ? color : "var(--text-muted)",
                border: `1.5px solid ${isActive ? `${color}40` : "var(--border)"}`,
              }}
            >
              <span>{"icon" in tab ? tab.icon : cat?.icon}</span>
              {tab.label}
              <span style={{ background: isActive ? `${color}25` : "var(--bg-sub)", color: isActive ? color : "var(--text-dim)", borderRadius: 10, padding: "1px 7px", fontSize: 10 }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{ ...card, padding: "60px 0", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📂</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>No files found</div>
          <div style={{ fontSize: 13, ...dimText }}>
            {search ? `No results for "${search}"` : "No files have been uploaded through your forms yet"}
          </div>
        </div>
      )}

      {/* ── GROUPED VIEW ── */}
      {filtered.length > 0 && viewMode === "grouped" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {groupedByForm.map(({ formId, entries }) => {
            const form   = forms.find(f => f.id === formId);
            const cat    = FORM_CATEGORIES.find(c => c.id === form?.category);
            const isOpen = expandedForms[formId] !== false;

            return (
              <div key={formId} style={{ ...card, overflow: "hidden" }}>
                {/* Group header */}
                <button
                  onClick={() => toggleForm(formId)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 12,
                    padding: "14px 18px", background: cat ? `${cat.color}0c` : "var(--bg-sub)",
                    border: "none", borderBottom: isOpen ? `1.5px solid ${cat?.color ?? "var(--border)"}20` : "none",
                    cursor: "pointer", fontFamily: "Outfit,sans-serif", textAlign: "left",
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: cat?.bg ?? "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                    {cat?.icon ?? "📄"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{form?.name ?? entries[0].formName}</div>
                    <div style={{ fontSize: 11, color: cat?.color ?? "var(--text-dim)", fontWeight: 600 }}>
                      {cat?.label ?? "Form"} · {entries.length} file{entries.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <Link
                    href={`/forms/${formId}/responses`}
                    onClick={e => e.stopPropagation()}
                    style={{ fontSize: 11, fontWeight: 700, color: cat?.color ?? "var(--accent)", textDecoration: "none", padding: "4px 10px", border: `1px solid ${cat?.color ?? "var(--accent)"}30`, borderRadius: 7, flexShrink: 0 }}
                  >
                    View Responses →
                  </Link>
                  <span style={{ fontSize: 11, color: "var(--text-dim)", transform: isOpen ? "rotate(90deg)" : "none", display: "inline-block", transition: "transform .2s", flexShrink: 0 }}>▶</span>
                </button>

                {/* File rows */}
                {isOpen && (
                  <div>
                    {entries.map((entry, i) => {
                      const ext       = entry.fileName.split(".").pop()?.toLowerCase() || "";
                      const extColor  = EXT_COLORS[ext] || "#C77DFF";
                      const isLoading = downloadingPath === entry.filePath;
                      const initials  = entry.submitterName
                        ? entry.submitterName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
                        : "?";
                      const avatarColor = entry.submitterEmail
                        ? `hsl(${[...entry.submitterEmail].reduce((n, c) => n + c.charCodeAt(0), 0) % 360},55%,55%)`
                        : (cat?.color ?? "#C77DFF");

                      return (
                        <div
                          key={`${entry.filePath}-${i}`}
                          style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderBottom: i < entries.length - 1 ? "1px solid var(--border)" : "none", transition: "background .1s" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-sub)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          {/* Submitter avatar */}
                          <div
                            title={[entry.submitterName, entry.submitterEmail].filter(Boolean).join(" · ") || "Anonymous"}
                            style={{ width: 34, height: 34, borderRadius: "50%", background: `${avatarColor}20`, border: `1.5px solid ${avatarColor}50`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                          >
                            <span style={{ fontSize: 11, fontWeight: 800, color: avatarColor }}>{initials}</span>
                          </div>

                          {/* Submitter info */}
                          <div style={{ minWidth: 140, maxWidth: 180, flexShrink: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {entry.submitterName ?? "Anonymous"}
                            </div>
                            {entry.submitterEmail && (
                              <div style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {entry.submitterEmail}
                              </div>
                            )}
                          </div>

                          {/* Ext badge */}
                          <div style={{ width: 38, height: 38, borderRadius: 9, background: `${extColor}12`, border: `1.5px solid ${extColor}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ fontSize: 9, fontWeight: 800, color: extColor, textTransform: "uppercase" }}>{ext || "?"}</span>
                          </div>

                          {/* File name + meta */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {entry.fileName}
                            </div>
                            <div style={{ fontSize: 11, ...dimText }}>
                              {entry.fieldLabel} · {new Date(entry.submittedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                            </div>
                          </div>

                          {/* Download */}
                          <button
                            onClick={() => handleDownload(entry.filePath, entry.fileName)}
                            disabled={isLoading}
                            title={`Download ${entry.fileName}`}
                            style={{
                              display: "flex", alignItems: "center", gap: 6,
                              background: isLoading ? "transparent" : "#00D4FF12",
                              color: isLoading ? "var(--text-dim)" : "#00D4FF",
                              border: `1.5px solid ${isLoading ? "var(--border)" : "#00D4FF30"}`,
                              borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700,
                              cursor: isLoading ? "not-allowed" : "pointer", fontFamily: "Outfit,sans-serif",
                              flexShrink: 0, transition: "all .15s",
                            }}
                          >
                            {isLoading ? "⏳" : "↓ Download"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── FLAT LIST VIEW ── */}
      {filtered.length > 0 && viewMode === "flat" && (
        <div style={{ ...card, overflow: "hidden" }}>
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "34px 1fr 1fr 1fr 1fr 100px", gap: 0, padding: "10px 18px", background: "var(--bg-sub)", borderBottom: "1.5px solid var(--border)" }}>
            {["", "Submitted by", "File", "Form", "Date", ""].map((h, i) => (
              <div key={i} style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", ...dimText, paddingRight: 8 }}>{h}</div>
            ))}
          </div>
          {filtered.map((entry, i) => {
            const form      = forms.find(f => f.id === entry.formId);
            const cat       = FORM_CATEGORIES.find(c => c.id === form?.category);
            const ext       = entry.fileName.split(".").pop()?.toLowerCase() || "";
            const extColor  = EXT_COLORS[ext] || "#C77DFF";
            const isLoading = downloadingPath === entry.filePath;
            const initials  = entry.submitterName
              ? entry.submitterName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
              : "?";
            const avatarColor = entry.submitterEmail
              ? `hsl(${[...entry.submitterEmail].reduce((n, c) => n + c.charCodeAt(0), 0) % 360},55%,55%)`
              : (cat?.color ?? "#C77DFF");

            return (
              <div
                key={`${entry.filePath}-${i}`}
                style={{ display: "grid", gridTemplateColumns: "34px 1fr 1fr 1fr 1fr 100px", gap: 0, padding: "10px 18px", borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none", alignItems: "center", transition: "background .1s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-sub)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                {/* Avatar */}
                <div title={[entry.submitterName, entry.submitterEmail].filter(Boolean).join(" · ") || "Anonymous"} style={{ width: 28, height: 28, borderRadius: "50%", background: `${avatarColor}20`, border: `1.5px solid ${avatarColor}50`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: avatarColor }}>{initials}</span>
                </div>
                {/* Submitter */}
                <div style={{ paddingRight: 8, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.submitterName ?? "Anonymous"}</div>
                  {entry.submitterEmail && <div style={{ fontSize: 10, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.submitterEmail}</div>}
                </div>
                {/* File */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, paddingRight: 8, minWidth: 0 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 5, background: `${extColor}12`, border: `1px solid ${extColor}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 7, fontWeight: 800, color: extColor, textTransform: "uppercase" }}>{ext || "?"}</span>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.fileName}</span>
                </div>
                {/* Form */}
                <div style={{ paddingRight: 8, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    {cat && <span style={{ fontSize: 12 }}>{cat.icon}</span>}
                    <span style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.formName}</span>
                  </div>
                  <div style={{ fontSize: 10, ...dimText }}>{entry.fieldLabel}</div>
                </div>
                {/* Date */}
                <div style={{ fontSize: 11, ...dimText }}>
                  {new Date(entry.submittedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </div>
                {/* Download */}
                <button
                  onClick={() => handleDownload(entry.filePath, entry.fileName)}
                  disabled={isLoading}
                  style={{
                    background: isLoading ? "transparent" : "#00D4FF12",
                    color: isLoading ? "var(--text-dim)" : "#00D4FF",
                    border: `1.5px solid ${isLoading ? "var(--border)" : "#00D4FF30"}`,
                    borderRadius: 7, padding: "5px 12px", fontSize: 11, fontWeight: 700,
                    cursor: isLoading ? "not-allowed" : "pointer", fontFamily: "Outfit,sans-serif",
                    transition: "all .15s",
                  }}
                >
                  {isLoading ? "⏳" : "↓"}
                </button>
              </div>
            );
          })}
          <div style={{ padding: "8px 18px", background: "var(--bg-sub)", borderTop: "1.5px solid var(--border)", fontSize: 11, ...dimText }}>
            {filtered.length} file{filtered.length !== 1 ? "s" : ""}{search && ` matching "${search}"`}
          </div>
        </div>
      )}
    </div>
  );
}
