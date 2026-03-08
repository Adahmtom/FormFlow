// components/import/ImportModal.tsx
"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { importResponses } from "@/lib/actions/import";
import type { Form } from "@/types";

type Step = "upload" | "map" | "preview" | "importing" | "done";

interface ParsedData {
  headers: string[];
  rows: Record<string, string>[];
  fileName: string;
  rowCount: number;
}

type ColumnMap = Record<string, string>;

const STEPS: { id: Step; label: string; num: number }[] = [
  { id: "upload", label: "Upload", num: 1 },
  { id: "map", label: "Map Columns", num: 2 },
  { id: "preview", label: "Review", num: 3 },
];

export default function ImportModal({
  form,
  onClose,
}: {
  form: Form;
  onClose: () => void;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep]           = useState<Step>("upload");
  const [parsed, setParsed]       = useState<ParsedData | null>(null);
  const [colMap, setColMap]       = useState<ColumnMap>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult]       = useState<{ imported: number; errors: string[] } | null>(null);
  const [error, setError]         = useState("");
  const [dragOver, setDragOver]   = useState(false);

  const formFieldLabels = form.fields
    .filter(f => f.type !== "section")
    .map(f => f.label);

  // ── Parse CSV ──
  const parseCSV = useCallback((text: string, fileName: string) => {
    import("papaparse").then(Papa => {
      const result = Papa.default.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h: string) => h.trim(),
      });
      if (result.errors.length > 0 && result.data.length === 0) {
        setError("Failed to parse CSV: " + result.errors[0]?.message);
        return;
      }
      const headers = result.meta.fields || [];
      const rows = result.data as Record<string, string>[];
      setParsed({ headers, rows, fileName, rowCount: rows.length });
      autoMap(headers);
      setStep("map");
    });
  }, []);

  // ── Parse Excel ──
  const parseExcel = useCallback((buffer: ArrayBuffer, fileName: string) => {
    import("xlsx").then(XLSX => {
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheet];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: "" });
      if (jsonData.length === 0) {
        setError("The spreadsheet appears to be empty.");
        return;
      }
      const headers = Object.keys(jsonData[0] || {}).map(h => String(h).trim());
      const rows = jsonData.map(row => {
        const clean: Record<string, string> = {};
        for (const [key, val] of Object.entries(row)) {
          clean[key.trim()] = String(val ?? "");
        }
        return clean;
      });
      setParsed({ headers, rows, fileName, rowCount: rows.length });
      autoMap(headers);
      setStep("map");
    });
  }, []);

  // ── Auto-map columns ──
  const autoMap = (headers: string[]) => {
    const map: ColumnMap = {};
    for (const header of headers) {
      const h = header.toLowerCase().trim();
      const exact = formFieldLabels.find(l => l.toLowerCase() === h);
      if (exact) { map[header] = exact; continue; }
      const contains = formFieldLabels.find(l =>
        h.includes(l.toLowerCase()) || l.toLowerCase().includes(h)
      );
      if (contains) { map[header] = contains; continue; }
      const keywords: Record<string, string[]> = {
        "name": ["name", "full name", "full_name", "fullname"],
        "email": ["email", "e-mail", "email address"],
        "phone": ["phone", "telephone", "tel", "mobile"],
        "company": ["company", "organization", "org"],
        "message": ["message", "comments", "notes", "feedback"],
      };
      for (const [, kws] of Object.entries(keywords)) {
        if (kws.some(kw => h.includes(kw))) {
          const match = formFieldLabels.find(l => kws.some(kw => l.toLowerCase().includes(kw)));
          if (match) { map[header] = match; break; }
        }
      }
    }
    setColMap(map);
  };

  // ── Handle file ──
  const handleFile = (file: File) => {
    setError("");
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "csv" || ext === "tsv") {
      const reader = new FileReader();
      reader.onload = (e) => parseCSV(e.target?.result as string, file.name);
      reader.readAsText(file);
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (e) => parseExcel(e.target?.result as ArrayBuffer, file.name);
      reader.readAsArrayBuffer(file);
    } else {
      setError("Unsupported file type. Please upload a .csv, .xlsx, or .xls file.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // ── Build mapped rows ──
  const buildMappedRows = (): Record<string, string | string[]>[] => {
    if (!parsed) return [];
    return parsed.rows.map(row => {
      const mapped: Record<string, string | string[]> = {};
      for (const [csvHeader, formLabel] of Object.entries(colMap)) {
        if (formLabel && row[csvHeader] !== undefined) {
          const field = form.fields.find(f => f.label === formLabel);
          if (field?.type === "checkbox") {
            mapped[formLabel] = row[csvHeader].split(";").map(s => s.trim()).filter(Boolean);
          } else {
            mapped[formLabel] = row[csvHeader];
          }
        }
      }
      return mapped;
    });
  };

  // ── Execute import ──
  const handleImport = async () => {
    setImporting(true);
    setStep("importing");
    try {
      const mappedRows = buildMappedRows();
      const res = await importResponses(form.id, mappedRows);
      setResult({ imported: res.imported, errors: res.errors });
      setStep("done");
    } catch (err: any) {
      setResult({ imported: 0, errors: [err.message] });
      setStep("done");
    } finally {
      setImporting(false);
    }
  };

  const mappedCount = Object.values(colMap).filter(Boolean).length;
  const previewRows = parsed ? buildMappedRows().slice(0, 5) : [];
  const currentStepNum = STEPS.find(s => s.id === step)?.num ?? 0;

  const inp: React.CSSProperties = { width: "100%", background: "#0e0e16", border: "1.5px solid #1e1e30", borderRadius: 9, color: "#F0EFF8", fontFamily: "Outfit,sans-serif", fontSize: 13, padding: "9px 12px", outline: "none" };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#0d0d16",
        border: "1.5px solid #1e1e30",
        borderRadius: 18,
        width: "100%",
        maxWidth: step === "map" || step === "preview" ? 820 : 560,
        maxHeight: "85vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "max-width .3s ease",
      }}>

        {/* ── Header with Step Indicator ── */}
        <div style={{ padding: "20px 24px 0", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>Import Responses</div>
              <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>into <span style={{ color: "#FF9A5C", fontWeight: 600 }}>{form.name}</span> · {formFieldLabels.length} fields</div>
            </div>
            <button onClick={onClose} style={{ background: "#1e1e30", border: "none", color: "#777", fontSize: 16, cursor: "pointer", width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>

          {/* Step indicator */}
          {!["importing", "done"].includes(step) && (
            <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 16, paddingBottom: 16, borderBottom: "1.5px solid #111120" }}>
              {STEPS.map((s, i) => {
                const isActive = s.id === step;
                const isDone = currentStepNum > s.num;
                const color = isActive ? "#FF6B35" : isDone ? "#22c55e" : "#2a2a40";
                return (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: isActive ? "#FF6B35" : isDone ? "#22c55e" : "transparent",
                        border: `2px solid ${color}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 800,
                        color: isActive || isDone ? "#fff" : "#444",
                        transition: "all .3s",
                      }}>
                        {isDone ? "✓" : s.num}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: isActive ? "#FF6B35" : isDone ? "#22c55e" : "#444", whiteSpace: "nowrap" }}>{s.label}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div style={{ flex: 1, height: 2, background: isDone ? "#22c55e50" : "#1e1e30", margin: "0 12px", borderRadius: 1 }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Scrollable Body ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 20px" }}>

          {/* STEP 1: Upload */}
          {step === "upload" && (
            <div>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2.5px dashed ${dragOver ? "#FF6B35" : "#252538"}`,
                  borderRadius: 14,
                  padding: "40px 24px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all .2s",
                  background: dragOver ? "#FF6B3508" : "#0a0a12",
                }}
                onMouseEnter={e => { if (!dragOver) (e.currentTarget as HTMLElement).style.borderColor = "#FF6B3560"; }}
                onMouseLeave={e => { if (!dragOver) (e.currentTarget as HTMLElement).style.borderColor = "#252538"; }}
              >
                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.tsv" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} style={{ display: "none" }} />
                <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: "#F0EFF8" }}>Drop your file here or click to browse</div>
                <div style={{ fontSize: 12, color: "#555" }}>Supports <span style={{ color: "#FF9A5C" }}>CSV</span>, <span style={{ color: "#FF9A5C" }}>TSV</span>, <span style={{ color: "#FF9A5C" }}>XLSX</span>, and <span style={{ color: "#FF9A5C" }}>XLS</span></div>
              </div>

              {/* Tips + Fields in 2-col layout */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
                <div style={{ background: "#0a0a12", border: "1.5px solid #171726", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#FF6B35", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 8 }}>Tips</div>
                  <div style={{ fontSize: 11, color: "#555", lineHeight: 1.8 }}>
                    • First row = column headers<br />
                    • Matching names auto-map<br />
                    • Multi-choice: use semicolons (;)<br />
                    • Manual mapping available
                  </div>
                </div>
                <div style={{ background: "#0a0a12", border: "1.5px solid #171726", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#C77DFF", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 8 }}>Your Form Fields</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {formFieldLabels.map((l, i) => (
                      <span key={`${l}-${i}`} style={{ display: "inline-block", padding: "3px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600, background: "#C77DFF12", color: "#C77DFF", border: "1px solid #C77DFF20" }}>{l}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Column Mapping */}
          {step === "map" && parsed && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, padding: "10px 14px", background: "#0a0a12", border: "1.5px solid #171726", borderRadius: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>📎</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{parsed.fileName}</div>
                    <div style={{ fontSize: 11, color: "#555" }}>{parsed.rowCount} rows · {parsed.headers.length} columns</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: mappedCount > 0 ? "#22c55e15" : "#f59e0b15", color: mappedCount > 0 ? "#22c55e" : "#f59e0b", border: `1px solid ${mappedCount > 0 ? "#22c55e" : "#f59e0b"}25` }}>
                    {mappedCount}/{parsed.headers.length} mapped
                  </div>
                  <button onClick={() => { setParsed(null); setStep("upload"); setError(""); }} style={{ background: "transparent", color: "#666", border: "1.5px solid #1e1e30", borderRadius: 7, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif" }}>Change</button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {/* Column header labels */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 40px 1fr", gap: 8, padding: "0 12px", marginBottom: 2 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#444", letterSpacing: ".06em", textTransform: "uppercase" }}>File Column</div>
                  <div />
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#444", letterSpacing: ".06em", textTransform: "uppercase" }}>Form Field</div>
                </div>

                {parsed.headers.map(header => {
                  const mapped = colMap[header];
                  const sampleVals = parsed.rows.slice(0, 2).map(r => r[header]).filter(Boolean);
                  return (
                    <div key={header} style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 40px 1fr",
                      gap: 8,
                      alignItems: "center",
                      padding: "10px 12px",
                      background: mapped ? "#22c55e06" : "#0a0a12",
                      border: `1.5px solid ${mapped ? "#22c55e20" : "#171726"}`,
                      borderRadius: 10,
                      transition: "all .2s",
                    }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#F0EFF8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{header}</div>
                        {sampleVals.length > 0 && (
                          <div style={{ fontSize: 10, color: "#3a3a55", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {sampleVals.join(" · ")}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: "center", fontSize: 16, color: mapped ? "#22c55e" : "#252538" }}>→</div>
                      <select
                        style={{ ...inp, fontSize: 12, color: mapped ? "#22c55e" : "#555", background: mapped ? "#22c55e08" : "#0e0e16" }}
                        value={mapped || ""}
                        onChange={e => setColMap(prev => ({ ...prev, [header]: e.target.value }))}
                      >
                        <option value="">— Skip —</option>
                        {formFieldLabels.map((label, i) => (
                          <option key={`${label}-${i}`} value={label}>{label}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>

              {mappedCount === 0 && (
                <div style={{ marginTop: 10, fontSize: 12, color: "#f59e0b", background: "rgba(245,158,11,.06)", border: "1px solid rgba(245,158,11,.15)", borderRadius: 8, padding: "10px 14px" }}>
                  Map at least one column to continue.
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Preview */}
          {step === "preview" && parsed && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, padding: "12px 16px", background: "#22c55e08", border: "1.5px solid #22c55e20", borderRadius: 10 }}>
                <div style={{ fontSize: 28, fontFamily: "'Bebas Neue',sans-serif", color: "#22c55e", lineHeight: 1 }}>{parsed.rowCount}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#F0EFF8" }}>responses ready to import</div>
                  <div style={{ fontSize: 11, color: "#555" }}>{mappedCount} columns mapped · into "{form.name}"</div>
                </div>
              </div>

              <div style={{ fontSize: 10, fontWeight: 700, color: "#444", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 8 }}>Preview (first 5 rows)</div>
              <div style={{ overflowX: "auto", borderRadius: 10, border: "1.5px solid #171726" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#0a0a12" }}>
                      <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#333", borderBottom: "1.5px solid #111120", width: 36 }}>#</th>
                      {formFieldLabels.filter(l => Object.values(colMap).includes(l)).map((l, i) => (
                        <th key={`${l}-${i}`} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#22c55e", borderBottom: "1.5px solid #111120", whiteSpace: "nowrap" }}>{l}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #0f0f1a" }}>
                        <td style={{ padding: "7px 12px", color: "#333", fontWeight: 700, fontSize: 11 }}>{i + 1}</td>
                        {formFieldLabels.filter(l => Object.values(colMap).includes(l)).map((l, j) => (
                          <td key={`${l}-${j}`} style={{ padding: "7px 12px", color: "#ccc", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {Array.isArray(row[l]) ? (row[l] as string[]).join(", ") : (row[l] || <span style={{ color: "#252538" }}>—</span>)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsed.rowCount > 5 && (
                <div style={{ fontSize: 11, color: "#333", marginTop: 6, textAlign: "center" }}>+ {parsed.rowCount - 5} more rows</div>
              )}
            </div>
          )}

          {/* IMPORTING */}
          {step === "importing" && (
            <div style={{ textAlign: "center", padding: "50px 0" }}>
              <div style={{ fontSize: 44, marginBottom: 16, animation: "pulse 1.5s infinite" }}>⏳</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Importing responses…</div>
              <div style={{ fontSize: 13, color: "#555" }}>This may take a moment for large files</div>
            </div>
          )}

          {/* DONE */}
          {step === "done" && result && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              {result.imported > 0 ? (
                <>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#22c55e18", border: "3px solid #22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 16px", color: "#22c55e" }}>✓</div>
                  <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Import Complete</div>
                  <div style={{ fontSize: 32, fontFamily: "'Bebas Neue',sans-serif", color: "#22c55e", lineHeight: 1 }}>{result.imported}</div>
                  <div style={{ fontSize: 13, color: "#555", marginTop: 2 }}>responses imported into {form.name}</div>
                </>
              ) : (
                <>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#ef444418", border: "3px solid #ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 16px", color: "#ef4444" }}>✕</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#ef4444" }}>Import Failed</div>
                </>
              )}
              {result.errors.length > 0 && (
                <div style={{ marginTop: 16, textAlign: "left", background: "rgba(248,113,113,.05)", border: "1px solid rgba(248,113,113,.15)", borderRadius: 10, padding: 14, maxHeight: 120, overflowY: "auto" }}>
                  {result.errors.map((err, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#fca5a5", marginBottom: 3 }}>• {err}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{ marginTop: 12, fontSize: 13, color: "#f87171", background: "rgba(248,113,113,.06)", border: "1px solid rgba(248,113,113,.15)", borderRadius: 8, padding: "10px 14px" }}>{error}</div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: "14px 24px", borderTop: "1.5px solid #111120", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {step === "upload" && (
            <button onClick={onClose} style={{ background: "transparent", color: "#666", border: "1.5px solid #1e1e30", borderRadius: 9, padding: "9px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif" }}>Cancel</button>
          )}
          {step === "map" && (
            <>
              <button onClick={() => { setParsed(null); setStep("upload"); }} style={{ background: "transparent", color: "#666", border: "1.5px solid #1e1e30", borderRadius: 9, padding: "9px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif" }}>← Back</button>
              <button
                onClick={() => setStep("preview")}
                disabled={mappedCount === 0}
                style={{ background: mappedCount > 0 ? "linear-gradient(135deg,#FF6B35,#FF9A5C)" : "#1e1e30", color: mappedCount > 0 ? "#fff" : "#444", border: "none", borderRadius: 9, padding: "9px 22px", fontSize: 12, fontWeight: 700, cursor: mappedCount > 0 ? "pointer" : "not-allowed", fontFamily: "Outfit,sans-serif" }}
              >Review Import →</button>
            </>
          )}
          {step === "preview" && (
            <>
              <button onClick={() => setStep("map")} style={{ background: "transparent", color: "#666", border: "1.5px solid #1e1e30", borderRadius: 9, padding: "9px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif" }}>← Back</button>
              <button
                onClick={handleImport}
                style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff", border: "none", borderRadius: 9, padding: "9px 22px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif" }}
              >Import {parsed?.rowCount} Responses</button>
            </>
          )}
          {step === "done" && (
            <>
              <button onClick={onClose} style={{ background: "transparent", color: "#666", border: "1.5px solid #1e1e30", borderRadius: 9, padding: "9px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif" }}>Close</button>
              <button onClick={() => { router.push(`/forms/${form.id}/responses`); router.refresh(); onClose(); }} style={{ background: "linear-gradient(135deg,#FF6B35,#FF9A5C)", color: "#fff", border: "none", borderRadius: 9, padding: "9px 22px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif" }}>View Responses →</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
