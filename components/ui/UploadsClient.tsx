// components/ui/UploadsClient.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { FORM_CATEGORIES } from "@/lib/constants";
import { submitResponse } from "@/lib/actions/responses";
import type { Form } from "@/types";
import type { FileUploadEntry } from "@/app/(app)/dashboard/page";

const EXT_COLORS: Record<string, string> = {
  pdf: "#f87171", jpg: "#34d399", jpeg: "#34d399", png: "#34d399",
  gif: "#34d399", webp: "#34d399", doc: "#60a5fa", docx: "#60a5fa",
  xls: "#4ade80", xlsx: "#4ade80", zip: "#fb923c", txt: "#a78bfa",
  mp4: "#f472b6", mov: "#f472b6", mp3: "#e879f9",
};

type SortKey = "newest" | "oldest" | "name" | "form";

export default function UploadsClient({
  forms,
  fileUploads,
}: {
  forms: Form[];
  fileUploads: FileUploadEntry[];
}) {
  // ── View / filter state ──
  const [activeCat,     setActiveCat]     = useState("all");
  const [search,        setSearch]        = useState("");
  const [sortBy,        setSortBy]        = useState<SortKey>("newest");
  const [dateFrom,      setDateFrom]      = useState("");
  const [dateTo,        setDateTo]        = useState("");
  const [viewMode,      setViewMode]      = useState<"grouped" | "flat">("grouped");
  const [expandedForms, setExpandedForms] = useState<Record<string, boolean>>({});

  // ── Selection state ──
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // ── Processing state ──
  const [downloadingPath, setDownloadingPath] = useState<string | null>(null);
  const [deletingPaths,   setDeletingPaths]   = useState<Set<string>>(new Set());
  const [confirmDelete,   setConfirmDelete]   = useState<FileUploadEntry[] | null>(null);

  // ── Local uploads list (allows optimistic removal after delete) ──
  const [uploads, setUploads] = useState<FileUploadEntry[]>(fileUploads);

  // ── Admin upload modal ──
  const [showUpload,   setShowUpload]   = useState(false);
  const [upFormId,     setUpFormId]     = useState("");
  const [upFieldLabel, setUpFieldLabel] = useState("");
  const [upFieldValues, setUpFieldValues] = useState<Record<string, string>>({});
  const [upFile,       setUpFile]       = useState<File | null>(null);
  const [uploading,    setUploading]    = useState(false);
  const [uploadError,  setUploadError]  = useState("");

  const toggleForm = (id: string) =>
    setExpandedForms(prev => ({ ...prev, [id]: prev[id] !== false ? false : true }));

  // ── Download ──
  const handleDownload = async (filePath: string) => {
    setDownloadingPath(filePath);
    const win = window.open("", "_blank");
    try {
      const res  = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`);
      const data = await res.json();
      if (data.url && win) { win.location.href = data.url; }
      else { win?.close(); alert(`Could not retrieve file: ${data.error ?? "File not found"}`); }
    } catch { win?.close(); alert("Download failed. Please try again."); }
    setDownloadingPath(null);
  };

  // ── Delete ──
  const doDelete = async (entries: FileUploadEntry[]) => {
    setConfirmDelete(null);
    for (const entry of entries) {
      setDeletingPaths(prev => new Set([...prev, entry.filePath]));
      try {
        const res = await fetch("/api/file", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: entry.filePath, responseId: entry.responseId, fieldLabel: entry.fieldLabel }),
        });
        const data = await res.json();
        if (data.success) {
          setUploads(prev => prev.filter(u => u.filePath !== entry.filePath));
          setSelected(prev => { const n = new Set(prev); n.delete(entry.filePath); return n; });
        } else {
          alert(`Delete failed: ${data.error}`);
        }
      } catch { alert("Delete failed. Please try again."); }
      setDeletingPaths(prev => { const n = new Set(prev); n.delete(entry.filePath); return n; });
    }
  };

  // ── Admin upload ──
  const selectedForm = forms.find(f => f.id === upFormId);
  const fileFields   = selectedForm?.fields.filter(f => f.type === "file") ?? [];
  const infoFields   = selectedForm?.fields.filter(f =>
    !["file", "section"].includes(f.type)
  ).slice(0, 5) ?? [];

  const resetUploadModal = () => {
    setShowUpload(false); setUpFormId(""); setUpFieldLabel("");
    setUpFieldValues({}); setUpFile(null); setUploadError("");
  };

  const handleAdminUpload = async () => {
    if (!upFile || !upFormId || !upFieldLabel) {
      setUploadError("Please select a form, field, and file.");
      return;
    }
    setUploading(true); setUploadError("");
    try {
      // 1. Upload file to storage
      const fd = new FormData();
      fd.append("file", upFile); fd.append("formId", upFormId);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      const uploadData = await uploadRes.json();
      if (!uploadData.path) throw new Error(uploadData.error || "Upload failed");

      // 2. Build response data aligned to the form's field labels
      const responseData: Record<string, string> = { ...upFieldValues };
      responseData[upFieldLabel] = uploadData.path;
      responseData[`${upFieldLabel} (filename)`] = upFile.name;

      // 3. Submit response (creates a new response record tied to this form)
      await submitResponse(upFormId, responseData);

      resetUploadModal();
      // Reload to show new upload
      window.location.reload();
    } catch (err: any) {
      setUploadError(err.message ?? "Upload failed");
    }
    setUploading(false);
  };

  // ── Filter + sort ──
  const filtered = uploads
    .filter(e => {
      if (activeCat !== "all" && forms.find(f => f.id === e.formId)?.category !== activeCat) return false;
      if (search && ![e.fileName, e.formName, e.submitterName ?? "", e.submitterEmail ?? "", e.fieldLabel]
        .join(" ").toLowerCase().includes(search.toLowerCase())) return false;
      if (dateFrom && new Date(e.submittedAt) < new Date(dateFrom)) return false;
      if (dateTo && new Date(e.submittedAt) > new Date(dateTo + "T23:59:59")) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      if (sortBy === "oldest") return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      if (sortBy === "name")   return a.fileName.localeCompare(b.fileName);
      if (sortBy === "form")   return a.formName.localeCompare(b.formName);
      return 0;
    });

  // Group by form
  const groupedByForm: { formId: string; entries: FileUploadEntry[] }[] = [];
  const seen = new Set<string>();
  for (const entry of filtered) {
    if (!seen.has(entry.formId)) { seen.add(entry.formId); groupedByForm.push({ formId: entry.formId, entries: [] }); }
    groupedByForm.find(g => g.formId === entry.formId)!.entries.push(entry);
  }

  // ── Selection helpers (declared after filtered) ──
  const allSelected = filtered.length > 0 && filtered.every(e => selected.has(e.filePath));
  const toggleAll   = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map(e => e.filePath)));
  };
  const toggleOne = (path: string) =>
    setSelected(prev => { const n = new Set(prev); n.has(path) ? n.delete(path) : n.add(path); return n; });

  const catCount = (id: string) =>
    id === "all" ? uploads.length
    : uploads.filter(e => forms.find(f => f.id === e.formId)?.category === id).length;

  const card: React.CSSProperties      = { background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 14 };
  const dimText: React.CSSProperties   = { color: "var(--text-dim)" };
  const selectedEntries = filtered.filter(e => selected.has(e.filePath));

  // ── Avatar helper ──
  const avatar = (entry: FileUploadEntry, cat?: typeof FORM_CATEGORIES[0]) => {
    const initials = entry.submitterName
      ? entry.submitterName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";
    const color = entry.submitterEmail
      ? `hsl(${[...entry.submitterEmail].reduce((n, c) => n + c.charCodeAt(0), 0) % 360},55%,55%)`
      : (cat?.color ?? "#C77DFF");
    return { initials, color };
  };

  return (
    <div style={{ padding: "clamp(16px, 4vw, 36px)" }} className="animate-fade-up">

      {/* ── DELETE CONFIRM MODAL ── */}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ ...card, padding: 28, maxWidth: 420, width: "100%" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
              Delete {confirmDelete.length === 1 ? "File" : `${confirmDelete.length} Files`}?
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20, lineHeight: 1.5 }}>
              This permanently removes the {confirmDelete.length === 1 ? "file" : "files"} from storage and clears the field from the response. This cannot be undone.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmDelete(null)} style={{ background: "transparent", color: "var(--text-muted)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif" }}>
                Cancel
              </button>
              <button onClick={() => doDelete(confirmDelete)} style={{ background: "#ef444420", color: "#ef4444", border: "1.5px solid #ef444430", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif" }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADMIN UPLOAD MODAL ── */}
      {showUpload && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ ...card, padding: 28, maxWidth: 520, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>Upload File to Form</div>
              <button onClick={resetUploadModal} style={{ background: "transparent", border: "none", color: "var(--text-dim)", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>

            {/* Form selector */}
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".07em" }}>Select Form *</label>
            <select
              className="dark-input"
              style={{ marginTop: 6, marginBottom: 16, width: "100%" }}
              value={upFormId}
              onChange={e => { setUpFormId(e.target.value); setUpFieldLabel(""); setUpFieldValues({}); }}
            >
              <option value="">— Choose a form —</option>
              {forms.filter(f => f.fields.some(field => field.type === "file")).map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>

            {/* File field selector */}
            {fileFields.length > 0 && (
              <>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".07em" }}>Upload to Field *</label>
                <select
                  className="dark-input"
                  style={{ marginTop: 6, marginBottom: 16, width: "100%" }}
                  value={upFieldLabel}
                  onChange={e => setUpFieldLabel(e.target.value)}
                >
                  <option value="">— Choose file field —</option>
                  {fileFields.map(f => <option key={f.id} value={f.label}>{f.label}</option>)}
                </select>
              </>
            )}

            {/* Submitter info fields — aligned to form field labels */}
            {selectedForm && infoFields.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>Submitter Info (aligns to form fields)</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {infoFields.map(f => (
                    <div key={f.id}>
                      <label style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 4, display: "block" }}>{f.label}{f.required ? " *" : ""}</label>
                      <input
                        className="dark-input"
                        placeholder={f.placeholder || f.label}
                        type={f.type === "email" ? "email" : f.type === "phone" ? "tel" : "text"}
                        value={upFieldValues[f.label] ?? ""}
                        onChange={e => setUpFieldValues(prev => ({ ...prev, [f.label]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* File input */}
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".07em" }}>File *</label>
            <div
              style={{ marginTop: 6, marginBottom: 16, border: "2px dashed var(--border-lt)", borderRadius: 10, padding: "20px", textAlign: "center", cursor: "pointer", background: upFile ? "#22c55e08" : "var(--bg-sub)" }}
              onClick={() => document.getElementById("admin-file-input")?.click()}
            >
              <input id="admin-file-input" type="file" style={{ display: "none" }} onChange={e => setUpFile(e.target.files?.[0] ?? null)} />
              {upFile
                ? <div style={{ fontSize: 13, color: "#22c55e", fontWeight: 600 }}>✓ {upFile.name} ({(upFile.size / 1024).toFixed(0)} KB)</div>
                : <div style={{ fontSize: 13, color: "var(--text-dim)" }}>Click to choose file (max 10MB)</div>
              }
            </div>

            {uploadError && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 12 }}>{uploadError}</div>}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={resetUploadModal} style={{ background: "transparent", color: "var(--text-muted)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif" }}>
                Cancel
              </button>
              <button
                onClick={handleAdminUpload}
                disabled={uploading || !upFile || !upFormId || !upFieldLabel}
                style={{
                  background: uploading || !upFile || !upFormId || !upFieldLabel ? "var(--bg-sub)" : "linear-gradient(135deg,#FF6B35,#FF9A5C)",
                  color: uploading || !upFile || !upFormId || !upFieldLabel ? "var(--text-dim)" : "#fff",
                  border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 700,
                  cursor: uploading || !upFile || !upFormId || !upFieldLabel ? "not-allowed" : "pointer",
                  fontFamily: "Outfit,sans-serif",
                }}
              >
                {uploading ? "Uploading…" : "Upload & Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BULK ACTION BAR ── */}
      {selected.size > 0 && (
        <div style={{ position: "sticky", top: 0, zIndex: 50, background: "var(--bg-card)", border: "1.5px solid var(--accent)", borderRadius: 12, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", boxShadow: "0 4px 20px rgba(255,107,53,.15)" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>{selected.size} selected</span>
          <div style={{ flex: 1 }} />
          <button
            onClick={async () => {
              for (const path of selectedEntries.map(e => e.filePath)) await handleDownload(path);
            }}
            style={{ display: "flex", alignItems: "center", gap: 5, background: "#00D4FF12", color: "#00D4FF", border: "1.5px solid #00D4FF30", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif" }}
          >
            ↓ Download All
          </button>
          <button
            onClick={() => setConfirmDelete(selectedEntries)}
            style={{ display: "flex", alignItems: "center", gap: 5, background: "#ef444412", color: "#ef4444", border: "1.5px solid #ef444430", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif" }}
          >
            🗑 Delete Selected
          </button>
          <button
            onClick={() => setSelected(new Set())}
            style={{ background: "transparent", color: "var(--text-dim)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif" }}
          >
            ✕ Clear
          </button>
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: "var(--accent)", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 5 }}>Storage</div>
          <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(28px, 5vw, 40px)", letterSpacing: ".05em", lineHeight: 1, color: "var(--text)" }}>FILE UPLOADS</h1>
        </div>
        <div className="uploads-header-controls" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {/* Upload btn */}
          <button
            onClick={() => setShowUpload(true)}
            style={{ background: "linear-gradient(135deg,#FF6B35,#FF9A5C)", color: "#fff", border: "none", borderRadius: 9, padding: "9px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif", whiteSpace: "nowrap" }}
          >
            + Upload File
          </button>
          {/* Search */}
          <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", ...dimText, fontSize: 13 }}>🔍</span>
            <input className="dark-input" style={{ paddingLeft: 30, width: "100%" }} placeholder="Search files, users…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {/* View toggle */}
          <div style={{ display: "flex", border: "1.5px solid var(--border)", borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
            {(["grouped", "flat"] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{ padding: "7px 13px", fontSize: 11, fontWeight: 700, fontFamily: "Outfit,sans-serif", cursor: "pointer", border: "none", transition: "all .15s", background: viewMode === mode ? "var(--accent)" : "transparent", color: viewMode === mode ? "#fff" : "var(--text-muted)" }}>
                {mode === "grouped" ? "⊞ Grouped" : "≡ List"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10, marginBottom: 22 }}>
        {[
          { label: "Total Files",    value: uploads.length,    accent: "#C77DFF" },
          { label: "Forms w/ Files", value: new Set(uploads.map(e => e.formId)).size, accent: "#00D4FF" },
          { label: "Unique Users",   value: new Set(uploads.map(e => e.submitterEmail ?? e.submitterName ?? "anon")).size, accent: "#22c55e" },
          { label: "Filtered",       value: filtered.length,   accent: "#f59e0b" },
        ].map(s => (
          <div key={s.label} style={{ ...card, padding: "14px 16px", borderTop: `3px solid ${s.accent}` }}>
            <div style={{ fontSize: 28, fontFamily: "'Bebas Neue',sans-serif", color: s.accent, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── FILTER BAR ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {/* Category tabs */}
        {[{ id: "all", label: "All Files", icon: "📂" }, ...FORM_CATEGORIES].map(tab => {
          const isActive = activeCat === tab.id;
          const cat      = FORM_CATEGORIES.find(c => c.id === tab.id);
          const color    = cat?.color ?? "#C77DFF";
          return (
            <button key={tab.id} onClick={() => setActiveCat(tab.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif", transition: "all .15s", background: isActive ? `${color}18` : "transparent", color: isActive ? color : "var(--text-muted)", border: `1.5px solid ${isActive ? `${color}40` : "var(--border)"}` }}>
              <span>{"icon" in tab ? tab.icon : cat?.icon}</span>
              {tab.label}
              <span style={{ background: isActive ? `${color}25` : "var(--bg-sub)", color: isActive ? color : "var(--text-dim)", borderRadius: 10, padding: "1px 7px", fontSize: 10 }}>{catCount(tab.id)}</span>
            </button>
          );
        })}

        {/* Divider */}
        <div style={{ flex: 1 }} />

        {/* Date from/to */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: "var(--text-dim)", whiteSpace: "nowrap" }}>From</span>
          <input className="dark-input" type="date" style={{ width: 140, padding: "6px 10px" }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <span style={{ fontSize: 11, color: "var(--text-dim)" }}>To</span>
          <input className="dark-input" type="date" style={{ width: 140, padding: "6px 10px" }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(""); setDateTo(""); }} style={{ fontSize: 11, color: "#ef4444", background: "transparent", border: "none", cursor: "pointer", padding: "4px 6px", fontFamily: "Outfit,sans-serif" }}>✕ Clear</button>
          )}
        </div>

        {/* Sort */}
        <select className="dark-input" style={{ width: 150, padding: "6px 10px", fontSize: 12 }} value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)}>
          <option value="newest">↓ Newest first</option>
          <option value="oldest">↑ Oldest first</option>
          <option value="name">A–Z by file name</option>
          <option value="form">A–Z by form</option>
        </select>
      </div>

      {/* ── EMPTY STATE ── */}
      {filtered.length === 0 && (
        <div style={{ ...card, padding: "60px 0", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📂</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>No files found</div>
          <div style={{ fontSize: 13, ...dimText }}>{search || dateFrom || dateTo ? "Try adjusting your filters" : "No files have been uploaded yet"}</div>
        </div>
      )}

      {/* ── GROUPED VIEW ── */}
      {filtered.length > 0 && viewMode === "grouped" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Select all row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 4 }}>
            <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ width: 15, height: 15, accentColor: "var(--accent)", cursor: "pointer" }} />
            <span style={{ fontSize: 11, color: "var(--text-dim)" }}>
              {allSelected ? "Deselect all" : `Select all ${filtered.length} files`}
            </span>
          </div>

          {groupedByForm.map(({ formId, entries }) => {
            const form   = forms.find(f => f.id === formId);
            const cat    = FORM_CATEGORIES.find(c => c.id === form?.category);
            const isOpen = expandedForms[formId] !== false;

            return (
              <div key={formId} style={{ ...card, overflow: "hidden" }}>
                {/* Group header */}
                <button
                  onClick={() => toggleForm(formId)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: cat ? `${cat.color}0c` : "var(--bg-sub)", border: "none", borderBottom: isOpen ? `1.5px solid ${cat?.color ?? "var(--border)"}20` : "none", cursor: "pointer", fontFamily: "Outfit,sans-serif", textAlign: "left" }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: cat?.bg ?? "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{cat?.icon ?? "📄"}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{form?.name ?? entries[0].formName}</div>
                    <div style={{ fontSize: 11, color: cat?.color ?? "var(--text-dim)", fontWeight: 600 }}>{cat?.label ?? "Form"} · {entries.length} file{entries.length !== 1 ? "s" : ""}</div>
                  </div>
                  <Link href={`/forms/${formId}/responses`} onClick={e => e.stopPropagation()} style={{ fontSize: 11, fontWeight: 700, color: cat?.color ?? "var(--accent)", textDecoration: "none", padding: "4px 10px", border: `1px solid ${cat?.color ?? "var(--accent)"}30`, borderRadius: 7, flexShrink: 0 }}>
                    View Responses →
                  </Link>
                  <span style={{ fontSize: 11, color: "var(--text-dim)", transform: isOpen ? "rotate(90deg)" : "none", display: "inline-block", transition: "transform .2s", flexShrink: 0 }}>▶</span>
                </button>

                {/* File rows */}
                {isOpen && entries.map((entry, i) => {
                  const ext       = entry.fileName.split(".").pop()?.toLowerCase() || "";
                  const extColor  = EXT_COLORS[ext] || "#C77DFF";
                  const isLoading = downloadingPath === entry.filePath;
                  const isDel     = deletingPaths.has(entry.filePath);
                  const isChecked = selected.has(entry.filePath);
                  const { initials, color: avatarColor } = avatar(entry, cat);

                  return (
                    <div
                      key={`${entry.filePath}-${i}`}
                      className="upload-row"
                      style={{ borderBottom: i < entries.length - 1 ? "1px solid var(--border)" : "none", background: isChecked ? "var(--accent)06" : undefined }}
                      onMouseEnter={e => { if (!isChecked) e.currentTarget.style.background = "var(--bg-sub)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = isChecked ? "var(--accent)06" : "transparent"; }}
                    >
                      {/* Checkbox */}
                      <input type="checkbox" checked={isChecked} onChange={() => toggleOne(entry.filePath)} style={{ width: 15, height: 15, accentColor: "var(--accent)", cursor: "pointer", flexShrink: 0 }} />

                      {/* Avatar */}
                      <div title={[entry.submitterName, entry.submitterEmail].filter(Boolean).join(" · ") || "Anonymous"} style={{ width: 36, height: 36, borderRadius: "50%", background: `${avatarColor}20`, border: `1.5px solid ${avatarColor}50`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: avatarColor }}>{initials}</span>
                      </div>

                      {/* Merged info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>{entry.submitterName ?? "Anonymous"}</span>
                          <div style={{ width: 32, height: 22, borderRadius: 6, background: `${extColor}12`, border: `1.5px solid ${extColor}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ fontSize: 8, fontWeight: 800, color: extColor, textTransform: "uppercase" }}>{ext || "?"}</span>
                          </div>
                        </div>
                        {entry.submitterEmail && <div style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>{entry.submitterEmail}</div>}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                          <span style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{entry.fileName}</span>
                          <span style={{ fontSize: 10, ...dimText, whiteSpace: "nowrap", flexShrink: 0 }}>{new Date(entry.submittedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button onClick={() => handleDownload(entry.filePath)} disabled={isLoading} title="Download" style={{ background: isLoading ? "transparent" : "#00D4FF12", color: isLoading ? "var(--text-dim)" : "#00D4FF", border: `1.5px solid ${isLoading ? "var(--border)" : "#00D4FF30"}`, borderRadius: 7, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: isLoading ? "not-allowed" : "pointer", fontFamily: "Outfit,sans-serif", transition: "all .15s" }}>
                          {isLoading ? "⏳" : "↓"}
                        </button>
                        <button onClick={() => setConfirmDelete([entry])} disabled={isDel} title="Delete" style={{ background: isDel ? "transparent" : "#ef444412", color: isDel ? "var(--text-dim)" : "#ef4444", border: `1.5px solid ${isDel ? "var(--border)" : "#ef444430"}`, borderRadius: 7, padding: "6px 10px", fontSize: 12, fontWeight: 700, cursor: isDel ? "not-allowed" : "pointer", fontFamily: "Outfit,sans-serif", transition: "all .15s" }}>
                          {isDel ? "…" : "🗑"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* ── FLAT LIST VIEW ── */}
      {filtered.length > 0 && viewMode === "flat" && (
        <div className="upload-flat-scroll" style={{ ...card, overflow: "hidden" }}>
          {/* Header row */}
          <div style={{ display: "grid", gridTemplateColumns: "20px 34px 1fr 1fr 1fr 1fr 110px", gap: 0, padding: "10px 18px", background: "var(--bg-sub)", borderBottom: "1.5px solid var(--border)", minWidth: 600, alignItems: "center" }}>
            <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ width: 14, height: 14, accentColor: "var(--accent)", cursor: "pointer" }} />
            {["", "Submitted by", "File", "Form", "Date", "Actions"].map((h, i) => (
              <div key={i} style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "var(--text-dim)", paddingRight: 8 }}>{h}</div>
            ))}
          </div>

          {filtered.map((entry, i) => {
            const form        = forms.find(f => f.id === entry.formId);
            const cat         = FORM_CATEGORIES.find(c => c.id === form?.category);
            const ext         = entry.fileName.split(".").pop()?.toLowerCase() || "";
            const extColor    = EXT_COLORS[ext] || "#C77DFF";
            const isLoading   = downloadingPath === entry.filePath;
            const isDel       = deletingPaths.has(entry.filePath);
            const isChecked   = selected.has(entry.filePath);
            const { initials, color: avatarColor } = avatar(entry, cat);

            return (
              <div key={`${entry.filePath}-${i}`} style={{ display: "grid", gridTemplateColumns: "20px 34px 1fr 1fr 1fr 1fr 110px", gap: 0, padding: "10px 18px", borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none", alignItems: "center", transition: "background .1s", minWidth: 600, background: isChecked ? "var(--accent)06" : undefined }}
                onMouseEnter={e => { if (!isChecked) e.currentTarget.style.background = "var(--bg-sub)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = isChecked ? "var(--accent)06" : "transparent"; }}
              >
                <input type="checkbox" checked={isChecked} onChange={() => toggleOne(entry.filePath)} style={{ width: 14, height: 14, accentColor: "var(--accent)", cursor: "pointer" }} />
                <div title={[entry.submitterName, entry.submitterEmail].filter(Boolean).join(" · ") || "Anonymous"} style={{ width: 28, height: 28, borderRadius: "50%", background: `${avatarColor}20`, border: `1.5px solid ${avatarColor}50`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: avatarColor }}>{initials}</span>
                </div>
                <div style={{ paddingRight: 8, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.submitterName ?? "Anonymous"}</div>
                  {entry.submitterEmail && <div style={{ fontSize: 10, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.submitterEmail}</div>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, paddingRight: 8, minWidth: 0 }}>
                  <div style={{ width: 24, height: 16, borderRadius: 4, background: `${extColor}12`, border: `1px solid ${extColor}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 7, fontWeight: 800, color: extColor, textTransform: "uppercase" }}>{ext || "?"}</span>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.fileName}</span>
                </div>
                <div style={{ paddingRight: 8, minWidth: 0 }}>
                  {cat && <span style={{ fontSize: 11 }}>{cat.icon} </span>}
                  <span style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.formName}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-dim)", paddingRight: 8 }}>
                  {new Date(entry.submittedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </div>
                <div style={{ display: "flex", gap: 5 }}>
                  <button onClick={() => handleDownload(entry.filePath)} disabled={isLoading} style={{ background: isLoading ? "transparent" : "#00D4FF12", color: isLoading ? "var(--text-dim)" : "#00D4FF", border: `1.5px solid ${isLoading ? "var(--border)" : "#00D4FF30"}`, borderRadius: 6, padding: "4px 9px", fontSize: 11, fontWeight: 700, cursor: isLoading ? "not-allowed" : "pointer", fontFamily: "Outfit,sans-serif" }}>
                    {isLoading ? "⏳" : "↓"}
                  </button>
                  <button onClick={() => setConfirmDelete([entry])} disabled={isDel} style={{ background: isDel ? "transparent" : "#ef444412", color: isDel ? "var(--text-dim)" : "#ef4444", border: `1.5px solid ${isDel ? "var(--border)" : "#ef444430"}`, borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 700, cursor: isDel ? "not-allowed" : "pointer", fontFamily: "Outfit,sans-serif" }}>
                    {isDel ? "…" : "🗑"}
                  </button>
                </div>
              </div>
            );
          })}

          <div style={{ padding: "8px 18px", background: "var(--bg-sub)", borderTop: "1.5px solid var(--border)", fontSize: 11, color: "var(--text-dim)" }}>
            {filtered.length} file{filtered.length !== 1 ? "s" : ""}{search && ` matching "${search}"`}{selected.size > 0 && ` · ${selected.size} selected`}
          </div>
        </div>
      )}
    </div>
  );
}
