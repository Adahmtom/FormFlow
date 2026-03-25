// components/responses/ResponsesClient.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { FORM_CATEGORIES } from "@/lib/constants";
import { generateCSV, downloadCSV } from "@/lib/csv";
import ImportModal from "@/components/import/ImportModal";
import { deleteResponses } from "@/lib/actions/responses";
import type { Form, Response } from "@/types";

export default function ResponsesClient({ form, responses }: { form: Form; responses: Response[] }) {
  const [sel,         setSel]         = useState<Response | null>(null);
  const [search,      setSearch]      = useState("");
  const [sortCol,     setSortCol]     = useState("submitted_at");
  const [sortDir,     setSortDir]     = useState<"asc" | "desc">("desc");
  const [showImport,  setShowImport]  = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // ── Filter state ──
  const [dateFrom,    setDateFrom]    = useState("");
  const [dateTo,      setDateTo]      = useState("");
  const [ffField,     setFfField]     = useState("");
  const [ffValue,     setFfValue]     = useState("");

  // ── Multi-select / delete state ──
  const [selected,       setSelected]       = useState<Set<string>>(new Set());
  const [confirmDelete,  setConfirmDelete]  = useState<string[] | null>(null);
  const [deleting,       setDeleting]       = useState(false);
  const [localResponses, setLocalResponses] = useState<Response[]>(responses);

  const cat        = FORM_CATEGORIES.find(c => c.id === form.category)!;
  const dataFields = form.fields.filter(f => f.type !== "section");

  // ── Filter + sort ──
  const filtered = localResponses.filter(r => {
    if (search && !Object.values(r.data).join(" ").toLowerCase().includes(search.toLowerCase())) return false;
    if (dateFrom && new Date(r.submitted_at) < new Date(dateFrom)) return false;
    if (dateTo   && new Date(r.submitted_at) > new Date(dateTo + "T23:59:59")) return false;
    if (ffField && ffValue) {
      const v = r.data[ffField];
      const str = Array.isArray(v) ? v.join(" ") : String(v ?? "");
      if (!str.toLowerCase().includes(ffValue.toLowerCase())) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const va = sortCol === "submitted_at" ? new Date(a.submitted_at).getTime() : String(a.data[sortCol] ?? "");
    const vb = sortCol === "submitted_at" ? new Date(b.submitted_at).getTime() : String(b.data[sortCol] ?? "");
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ?  1 : -1;
    return 0;
  });

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };
  const sortIcon = (col: string) => sortCol === col ? (sortDir === "asc" ? "↑" : "↓") : "↕";

  // ── Selection helpers ──
  const allSelected = sorted.length > 0 && sorted.every(r => selected.has(r.id));
  const toggleAll   = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(sorted.map(r => r.id)));
  };
  const toggleOne = (id: string) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // ── Delete ──
  const doDelete = async (ids: string[]) => {
    setConfirmDelete(null);
    setDeleting(true);
    try {
      await deleteResponses(ids);
      setLocalResponses(prev => prev.filter(r => !ids.includes(r.id)));
      setSelected(prev => { const n = new Set(prev); ids.forEach(id => n.delete(id)); return n; });
      if (sel && ids.includes(sel.id)) setSel(null);
    } catch { alert("Delete failed. Please try again."); }
    setDeleting(false);
  };

  // ── Export ──
  const handleExport = (rows?: Response[]) => {
    const csv = generateCSV(form, rows ?? sorted);
    downloadCSV(csv, `${form.name.replace(/\s+/g, "_")}_responses.csv`);
  };

  const todayCount = localResponses.filter(r => new Date(r.submitted_at).toDateString() === new Date().toDateString()).length;
  const weekCount  = localResponses.filter(r => new Date(r.submitted_at) > new Date(Date.now() - 7 * 86400000)).length;
  const activeFilters = [search, dateFrom, dateTo, (ffField && ffValue)].filter(Boolean).length;
  const selectedRows  = sorted.filter(r => selected.has(r.id));

  const inp: React.CSSProperties = { background: "var(--input-bg)", border: "1.5px solid var(--border-lt)", borderRadius: 9, color: "var(--text)", fontFamily: "Outfit,sans-serif", fontSize: 13, padding: "8px 12px", outline: "none" };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* ── DELETE CONFIRM MODAL ── */}
        {confirmDelete && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div style={{ background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 14, padding: 28, maxWidth: 420, width: "100%" }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                Delete {confirmDelete.length === 1 ? "Response" : `${confirmDelete.length} Responses`}?
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 22, lineHeight: 1.5 }}>
                This permanently removes {confirmDelete.length === 1 ? "this response" : "these responses"} and all associated data. This cannot be undone.
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => setConfirmDelete(null)} style={{ background: "transparent", color: "var(--text-muted)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif" }}>Cancel</button>
                <button onClick={() => doDelete(confirmDelete)} disabled={deleting} style={{ background: "#ef444420", color: "#ef4444", border: "1.5px solid #ef444430", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif" }}>
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── HEADER ── */}
        <div style={{ padding: "12px 18px", borderBottom: "1.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, background: "var(--bg-sub)", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/forms" style={{ background: "transparent", color: "var(--text-muted)", border: "1.5px solid var(--border-lt)", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>← Back</Link>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>{cat.icon}</span>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--text)" }}>{form.name}</h2>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: cat.bg, color: cat.color, border: `1px solid ${cat.color}25` }}>{cat.label}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>{form.fields.length} fields · {localResponses.length} total responses</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {/* Search */}
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)", fontSize: 13 }}>🔍</span>
              <input style={{ ...inp, paddingLeft: 30, width: 180 }} placeholder="Search responses…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(f => !f)}
              style={{ background: showFilters || activeFilters > 0 ? `${cat.color}18` : "transparent", color: showFilters || activeFilters > 0 ? cat.color : "var(--text-muted)", border: `1.5px solid ${showFilters || activeFilters > 0 ? `${cat.color}40` : "var(--border-lt)"}`, borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif", display: "flex", alignItems: "center", gap: 5 }}
            >
              ⚙ Filters{activeFilters > 0 && <span style={{ background: cat.color, color: "#fff", borderRadius: 10, padding: "0 5px", fontSize: 10 }}>{activeFilters}</span>}
            </button>
            <button onClick={() => handleExport()} style={{ background: "linear-gradient(135deg,#FF6B35,#FF9A5C)", color: "#fff", border: "none", borderRadius: 9, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif" }}>
              ↓ Export CSV
            </button>
            <button onClick={() => setShowImport(true)} style={{ background: "transparent", color: "#C77DFF", border: "1.5px solid #C77DFF30", borderRadius: 9, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif" }}>
              ↑ Import
            </button>
          </div>
        </div>

        {/* ── FILTER BAR ── */}
        {showFilters && (
          <div style={{ padding: "10px 18px", background: "var(--bg-deep)", borderBottom: "1.5px solid var(--border)", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: "var(--text-dim)", whiteSpace: "nowrap" }}>From</span>
              <input style={{ ...inp, padding: "6px 10px", width: 140 }} type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              <span style={{ fontSize: 11, color: "var(--text-dim)" }}>To</span>
              <input style={{ ...inp, padding: "6px 10px", width: 140 }} type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <select style={{ ...inp, padding: "6px 10px", width: 160 }} value={ffField} onChange={e => { setFfField(e.target.value); setFfValue(""); }}>
                <option value="">Filter by field…</option>
                {dataFields.map(f => <option key={f.id} value={f.label}>{f.label}</option>)}
              </select>
              {ffField && (
                <input style={{ ...inp, padding: "6px 10px", width: 150 }} placeholder={`Value for "${ffField}"…`} value={ffValue} onChange={e => setFfValue(e.target.value)} />
              )}
            </div>
            {(dateFrom || dateTo || ffField || ffValue) && (
              <button onClick={() => { setDateFrom(""); setDateTo(""); setFfField(""); setFfValue(""); }} style={{ fontSize: 11, color: "#ef4444", background: "transparent", border: "none", cursor: "pointer", fontFamily: "Outfit,sans-serif", fontWeight: 700 }}>✕ Clear filters</button>
            )}
          </div>
        )}

        {/* ── STATS BAR ── */}
        <div style={{ display: "flex", borderBottom: "1.5px solid var(--border)", flexShrink: 0 }}>
          {[
            { label: "Total",     value: localResponses.length, color: cat.color },
            { label: "This Week", value: weekCount,             color: "#22c55e" },
            { label: "Today",     value: todayCount,            color: "#f59e0b" },
            { label: "Fields",    value: dataFields.length,     color: "#a78bfa" },
            { label: "Filtered",  value: filtered.length,       color: "#64748b" },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, padding: "10px 16px", background: "var(--bg-deep)", borderRight: "1.5px solid var(--border)" }}>
              <div style={{ fontSize: 20, fontFamily: "'Bebas Neue',sans-serif", color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "var(--text-dim)", fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── BULK ACTION BAR ── */}
        {selected.size > 0 && (
          <div style={{ padding: "8px 18px", background: `${cat.color}0a`, borderBottom: `1.5px solid ${cat.color}30`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: cat.color }}>{selected.size} selected</span>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => handleExport(selectedRows)}
              style={{ background: "#22c55e12", color: "#22c55e", border: "1.5px solid #22c55e30", borderRadius: 7, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif" }}
            >
              ↓ Export Selected
            </button>
            <button
              onClick={() => setConfirmDelete([...selected])}
              disabled={deleting}
              style={{ background: "#ef444412", color: "#ef4444", border: "1.5px solid #ef444430", borderRadius: 7, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif" }}
            >
              🗑 Delete Selected
            </button>
            <button
              onClick={() => setSelected(new Set())}
              style={{ background: "transparent", color: "var(--text-dim)", border: "1.5px solid var(--border)", borderRadius: 7, padding: "5px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif" }}
            >
              ✕ Clear
            </button>
          </div>
        )}

        {/* ── SPREADSHEET ── */}
        {localResponses.length === 0
          ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "var(--text-dim)" }}>
              <div style={{ fontSize: 44 }}>📭</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-muted)" }}>No responses yet</div>
              <div style={{ fontSize: 13 }}>Responses will appear here as a spreadsheet</div>
            </div>
          )
          : (
            <div style={{ flex: 1, overflowY: "auto", overflowX: "auto" }}>
              <table className="ss-table">
                <thead>
                  <tr>
                    {/* Select-all checkbox */}
                    <th className="ss-row-num" style={{ position: "sticky", left: 0, zIndex: 3, width: 36 }}>
                      <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ width: 13, height: 13, accentColor: cat.color, cursor: "pointer" }} />
                    </th>
                    <th className="ss-row-num" style={{ position: "sticky", left: 36, zIndex: 3 }}>#</th>
                    <th style={{ cursor: "pointer", minWidth: 160, position: "sticky", left: 72, zIndex: 3, background: "var(--bg-deep)" }} onClick={() => toggleSort("submitted_at")}>
                      <span style={{ color: sortCol === "submitted_at" ? cat.color : "inherit" }}>SUBMITTED {sortIcon("submitted_at")}</span>
                    </th>
                    {dataFields.map(f => (
                      <th key={f.id} style={{ cursor: "pointer", minWidth: 140 }} onClick={() => toggleSort(f.label)}>
                        <span style={{ color: sortCol === f.label ? cat.color : "inherit" }}>{f.label.toUpperCase()} {sortIcon(f.label)}</span>
                      </th>
                    ))}
                    <th style={{ width: 90 }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r, i) => {
                    const isChecked = selected.has(r.id);
                    return (
                      <tr key={r.id} className={sel?.id === r.id ? "selected" : ""} style={{ cursor: "pointer", background: isChecked ? `${cat.color}08` : undefined }}>
                        {/* Checkbox */}
                        <td className="ss-row-num" style={{ position: "sticky", left: 0, background: isChecked ? `${cat.color}08` : "var(--bg-deep)", borderRight: "1px solid var(--border)" }} onClick={e => { e.stopPropagation(); toggleOne(r.id); }}>
                          <input type="checkbox" checked={isChecked} onChange={() => toggleOne(r.id)} style={{ width: 13, height: 13, accentColor: cat.color, cursor: "pointer" }} />
                        </td>
                        {/* Row number */}
                        <td className="ss-row-num" style={{ position: "sticky", left: 36, background: "var(--bg-deep)", borderRight: "1px solid var(--border)" }} onClick={() => setSel(sel?.id === r.id ? null : r)}>{i + 1}</td>
                        {/* Submitted at */}
                        <td style={{ position: "sticky", left: 72, background: sel?.id === r.id ? "rgba(255,107,53,.07)" : "var(--bg)", borderRight: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 12, minWidth: 160 }} onClick={() => setSel(sel?.id === r.id ? null : r)}>
                          {new Date(r.submitted_at).toLocaleString()}
                        </td>
                        {/* Data fields */}
                        {dataFields.map(f => {
                          const v = r.data[f.label];
                          const display = Array.isArray(v) ? v.join(", ") : (v || "");
                          const isFilePath = f.type === "file" && typeof display === "string" && display.length > 0 && !display.startsWith("http") && display.includes("/");
                          const isUrl = typeof display === "string" && (display.startsWith("http://") || display.startsWith("https://"));
                          return (
                            <td key={f.id} style={{ minWidth: 140 }} onClick={() => setSel(sel?.id === r.id ? null : r)}>
                              {f.type === "rating"
                                ? <span style={{ color: cat.color }}>{"★".repeat(Number(v) || 0)}</span>
                                : f.type === "scale"
                                ? <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: cat.color }}>{v || "—"}<span style={{ fontSize: 10, color: "var(--text-dim)" }}>/10</span></span>
                                : isFilePath
                                ? <button onClick={async e => { e.stopPropagation(); const win = window.open("", "_blank"); try { const res = await fetch(`/api/file?path=${encodeURIComponent(display)}`); const data = await res.json(); if (data.url && win) win.location.href = data.url; else win?.close(); } catch { win?.close(); } }} style={{ background: "transparent", color: "#00D4FF", border: "1.5px solid #00D4FF30", borderRadius: 6, padding: "3px 9px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif" }}>📎 {r.data[f.label + " (filename)"] || "Download"}</button>
                                : isUrl
                                ? <a href={display} target="_blank" rel="noopener noreferrer" style={{ color: "#00D4FF", textDecoration: "none", fontSize: 12 }} onClick={e => e.stopPropagation()}>📎 {r.data[f.label + " (filename)"] || "View file"}</a>
                                : <span style={{ color: display ? "var(--text-muted)" : "var(--text-dim)" }}>{display || "—"}</span>
                              }
                            </td>
                          );
                        })}
                        {/* Actions */}
                        <td onClick={e => e.stopPropagation()}>
                          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                            <button
                              style={{ background: "transparent", color: sel?.id === r.id ? cat.color : "var(--text-dim)", border: `1.5px solid ${sel?.id === r.id ? cat.color : "var(--border-lt)"}`, borderRadius: 7, padding: "4px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif" }}
                              onClick={() => setSel(sel?.id === r.id ? null : r)}
                            >
                              {sel?.id === r.id ? "✕" : "→"}
                            </button>
                            <button
                              onClick={() => setConfirmDelete([r.id])}
                              title="Delete response"
                              style={{ background: "#ef444412", color: "#ef4444", border: "1.5px solid #ef444430", borderRadius: 7, padding: "4px 7px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif" }}
                            >
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ padding: "8px 16px", background: "var(--bg-deep)", borderTop: "1.5px solid var(--border)", fontSize: 11, color: "var(--text-dim)", display: "flex", gap: 16, flexWrap: "wrap" }}>
                <span>{sorted.length} of {localResponses.length} responses</span>
                {search && <span style={{ color: "#FF6B35" }}>Search: "{search}"</span>}
                {(dateFrom || dateTo) && <span style={{ color: cat.color }}>Date filtered</span>}
                {ffField && ffValue && <span style={{ color: cat.color }}>Field: {ffField} = "{ffValue}"</span>}
                {selected.size > 0 && <span style={{ color: cat.color, fontWeight: 700 }}>{selected.size} selected</span>}
              </div>
            </div>
          )
        }
      </div>

      {/* ── DETAIL PANEL ── */}
      {sel && (
        <div style={{ width: 340, background: "var(--bg-sub)", borderLeft: "1.5px solid var(--border)", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>
          <div style={{ padding: "13px 16px", borderBottom: "1.5px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--text-muted)" }}>Response Detail</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setConfirmDelete([sel.id])} style={{ background: "#ef444412", color: "#ef4444", border: "1.5px solid #ef444430", borderRadius: 7, padding: "3px 9px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif" }}>🗑 Delete</button>
              <button onClick={() => setSel(null)} style={{ background: "rgba(255,59,59,.08)", color: "#FF6B6B", border: "1.5px solid rgba(255,59,59,.2)", borderRadius: 7, padding: "3px 9px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif" }}>✕</button>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>
              Submitted {new Date(sel.submitted_at).toLocaleString()}
            </div>
            {dataFields.map(f => (
              <div key={f.id} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-dim)", letterSpacing: ".07em", textTransform: "uppercase", marginBottom: 5 }}>{f.label}</div>
                <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6, wordBreak: "break-word" }}>
                  {f.type === "rating"
                    ? <span>{"★".repeat(Number(sel.data[f.label]) || 0)}<span style={{ color: "var(--text-dim)" }}>{"★".repeat(5 - (Number(sel.data[f.label]) || 0))}</span><span style={{ fontSize: 11, color: cat.color, marginLeft: 6 }}>{sel.data[f.label]}/5</span></span>
                    : f.type === "scale"
                    ? <span style={{ fontSize: 28, fontFamily: "'Bebas Neue',sans-serif", color: cat.color }}>{sel.data[f.label] || "—"}<span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "Outfit,sans-serif" }}>/10</span></span>
                    : f.type === "file" && sel.data[f.label] && typeof sel.data[f.label] === "string" && !String(sel.data[f.label]).startsWith("http") && String(sel.data[f.label]).includes("/")
                    ? <button onClick={async () => { const win = window.open("", "_blank"); try { const res = await fetch(`/api/file?path=${encodeURIComponent(String(sel.data[f.label]))}`); const data = await res.json(); if (data.url && win) win.location.href = data.url; else win?.close(); } catch { win?.close(); } }} style={{ background: "transparent", color: "#00D4FF", border: "1.5px solid #00D4FF30", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif" }}>📎 {sel.data[f.label + " (filename)"] || "Download File"}</button>
                    : Array.isArray(sel.data[f.label])
                    ? <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>{(sel.data[f.label] as string[]).map((v: string) => <span key={v} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: cat.bg, color: cat.color, border: `1px solid ${cat.color}25` }}>{v}</span>)}</div>
                    : sel.data[f.label] || <span style={{ color: "var(--text-dim)", fontStyle: "italic" }}>No answer</span>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && <ImportModal form={form} onClose={() => setShowImport(false)} />}
    </div>
  );
}
