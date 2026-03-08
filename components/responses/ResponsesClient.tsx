// components/responses/ResponsesClient.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { FORM_CATEGORIES } from "@/lib/constants";
import { generateCSV, downloadCSV } from "@/lib/csv";
import ImportModal from "@/components/import/ImportModal";
import type { Form, Response } from "@/types";

export default function ResponsesClient({ form, responses }: { form: Form; responses: Response[] }) {
  const [sel,      setSel]      = useState<Response | null>(null);
  const [search,   setSearch]   = useState("");
  const [sortCol,  setSortCol]  = useState("submitted_at");
  const [showImport, setShowImport] = useState(false);
  const [sortDir,  setSortDir]  = useState<"asc"|"desc">("desc");

  const cat        = FORM_CATEGORIES.find(c => c.id === form.category)!;
  const dataFields = form.fields.filter(f => f.type !== "section");

  const filtered = responses.filter(r => {
    if (!search) return true;
    return Object.values(r.data).join(" ").toLowerCase().includes(search.toLowerCase());
  });

  const sorted = [...filtered].sort((a, b) => {
    const va = sortCol === "submitted_at" ? new Date(a.submitted_at).getTime() : String(a.data[sortCol] ?? "");
    const vb = sortCol === "submitted_at" ? new Date(b.submitted_at).getTime() : String(b.data[sortCol] ?? "");
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1  : -1;
    return 0;
  });

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };
  const sortIcon = (col: string) => sortCol === col ? (sortDir === "asc" ? "↑" : "↓") : "↕";

  const handleExport = () => {
    const csv = generateCSV(form, sorted);
    downloadCSV(csv, `${form.name.replace(/\s+/g, "_")}_responses.csv`);
  };

  const todayCount = responses.filter(r => new Date(r.submitted_at).toDateString() === new Date().toDateString()).length;
  const weekCount  = responses.filter(r => new Date(r.submitted_at) > new Date(Date.now() - 7 * 86400000)).length;

  const inp: React.CSSProperties = { background:"#0e0e16", border:"1.5px solid #1e1e30", borderRadius:9, color:"#F0EFF8", fontFamily:"Outfit,sans-serif", fontSize:13, padding:"8px 12px", outline:"none" };

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden" }}>
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Header */}
        <div style={{ padding:"16px 22px", borderBottom:"1.5px solid #111120", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, background:"#08080f" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <Link href="/forms" style={{ background:"transparent", color:"#777", border:"1.5px solid #1e1e30", borderRadius:8, padding:"6px 14px", fontSize:12, fontWeight:700, textDecoration:"none" }}>← Back</Link>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:16 }}>{cat.icon}</span>
                <h2 style={{ fontSize:17, fontWeight:800, color:"#F0EFF8" }}>{form.name}</h2>
                <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 9px", borderRadius:20, fontSize:11, fontWeight:700, background:cat.bg, color:cat.color, border:`1px solid ${cat.color}25` }}>{cat.label}</span>
              </div>
              <div style={{ fontSize:11, color:"#444", marginTop:2 }}>{form.fields.length} fields · {responses.length} total responses</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#444", fontSize:13 }}>🔍</span>
              <input style={{ ...inp, paddingLeft:30, width:200 }} placeholder="Search responses…" value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
            <button onClick={handleExport} style={{ background:"linear-gradient(135deg,#FF6B35,#FF9A5C)", color:"#fff", border:"none", borderRadius:9, padding:"8px 16px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"Outfit,sans-serif", display:"flex", alignItems:"center", gap:5 }}>
              ↓ Export CSV
            </button>
            <button onClick={() => setShowImport(true)} style={{ background:"transparent", color:"#C77DFF", border:"1.5px solid #C77DFF30", borderRadius:9, padding:"8px 16px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"Outfit,sans-serif", display:"flex", alignItems:"center", gap:5 }}>
              ↑ Import
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ display:"flex", borderBottom:"1.5px solid #111120", flexShrink:0 }}>
          {[{label:"Total",value:responses.length,color:cat.color},{label:"This Week",value:weekCount,color:"#22c55e"},{label:"Today",value:todayCount,color:"#f59e0b"},{label:"Fields",value:dataFields.length,color:"#a78bfa"},{label:"Filtered",value:filtered.length,color:"#64748b"}].map(s=>(
            <div key={s.label} style={{ flex:1, padding:"10px 16px", background:"#0a0a12", borderRight:"1.5px solid #111120" }}>
              <div style={{ fontSize:20, fontFamily:"'Bebas Neue',sans-serif", color:s.color, lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:10, color:"#444", fontWeight:700, letterSpacing:".05em", textTransform:"uppercase" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Spreadsheet */}
        {responses.length === 0
          ? <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12, color:"#333" }}>
              <div style={{ fontSize:44 }}>📭</div>
              <div style={{ fontSize:16, fontWeight:700, color:"#555" }}>No responses yet</div>
              <div style={{ fontSize:13, color:"#333" }}>Responses will appear here as a spreadsheet</div>
            </div>
          : <div style={{ flex:1, overflowY:"auto", overflowX:"auto" }}>
              <table className="ss-table">
                <thead>
                  <tr>
                    <th className="ss-row-num" style={{ position:"sticky", left:0, zIndex:3 }}>#</th>
                    <th style={{ cursor:"pointer", minWidth:160, position:"sticky", left:36, zIndex:3, background:"#0a0a12" }} onClick={()=>toggleSort("submitted_at")}>
                      <span style={{ color:sortCol==="submitted_at"?cat.color:"inherit" }}>SUBMITTED {sortIcon("submitted_at")}</span>
                    </th>
                    {dataFields.map(f => (
                      <th key={f.id} style={{ cursor:"pointer", minWidth:140 }} onClick={()=>toggleSort(f.label)}>
                        <span style={{ color:sortCol===f.label?cat.color:"inherit" }}>{f.label.toUpperCase()} {sortIcon(f.label)}</span>
                      </th>
                    ))}
                    <th style={{ width:70 }}>VIEW</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r, i) => (
                    <tr key={r.id} className={sel?.id === r.id ? "selected" : ""} onClick={()=>setSel(sel?.id===r.id?null:r)} style={{ cursor:"pointer" }}>
                      <td className="ss-row-num" style={{ position:"sticky", left:0, background:"#0a0a12", borderRight:"1px solid #1a1a28" }}>{i+1}</td>
                      <td style={{ position:"sticky", left:36, background:sel?.id===r.id?"rgba(255,107,53,.07)":"#060608", borderRight:"1px solid #1a1a28", color:"#888", fontSize:12, minWidth:160 }}>
                        {new Date(r.submitted_at).toLocaleString()}
                      </td>
                      {dataFields.map(f => {
                        const v = r.data[f.label];
                        const display = Array.isArray(v) ? v.join(", ") : (v || "");
                        const isFilePath = f.type === "file" && typeof display === "string" && display.length > 0 && !display.startsWith("http");
                        const isUrl = typeof display === "string" && (display.startsWith("http://") || display.startsWith("https://"));
                        return (
                          <td key={f.id} style={{ minWidth:140 }}>
                            {f.type==="rating"  ? <span style={{ color:cat.color }}>{"★".repeat(Number(v)||0)}</span>
                            :f.type==="scale"   ? <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:cat.color }}>{v||"—"}<span style={{ fontSize:10, color:"#555" }}>/10</span></span>
                            :isFilePath ? <button onClick={async(e)=>{e.stopPropagation();try{const res=await fetch(`/api/file?path=${encodeURIComponent(display)}`);const data=await res.json();if(data.url)window.open(data.url,"_blank");}catch{}}} style={{ background:"transparent", color:"#00D4FF", border:"1.5px solid #00D4FF30", borderRadius:6, padding:"3px 9px", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"Outfit,sans-serif" }}>📎 {r.data[f.label + " (filename)"] || "Download"}</button>
                            :isUrl ? <a href={display} target="_blank" rel="noopener noreferrer" style={{ color:"#00D4FF", textDecoration:"none", fontSize:12 }} onClick={e=>e.stopPropagation()}>📎 {r.data[f.label + " (filename)"] || "View file"}</a>
                            :<span style={{ color:display?"#ddd":"#333" }}>{display || "—"}</span>}
                          </td>
                        );
                      })}
                      <td onClick={e=>e.stopPropagation()}>
                        <button className="btn btn-ghost btn-sm" style={{ background:"transparent", color:sel?.id===r.id?cat.color:"#555", border:`1.5px solid ${sel?.id===r.id?cat.color:"#1a1a2c"}`, borderRadius:7, padding:"4px 9px", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"Outfit,sans-serif" }} onClick={()=>setSel(sel?.id===r.id?null:r)}>
                          {sel?.id===r.id?"✕":"→"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding:"8px 16px", background:"#080810", borderTop:"1.5px solid #111120", fontSize:11, color:"#333", display:"flex", gap:16 }}>
                <span>{sorted.length} of {responses.length} responses</span>
                {search && <span style={{ color:"#FF6B35" }}>Filtered by: "{search}"</span>}
              </div>
            </div>
        }
      </div>

      {/* Detail panel */}
      {sel && (
        <div style={{ width:340, background:"#08080f", borderLeft:"1.5px solid #111120", display:"flex", flexDirection:"column", overflow:"hidden", flexShrink:0 }}>
          <div style={{ padding:"13px 16px", borderBottom:"1.5px solid #111120", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
            <div style={{ fontSize:12, fontWeight:700, letterSpacing:".06em", textTransform:"uppercase", color:"#555" }}>Response Detail</div>
            <button onClick={()=>setSel(null)} style={{ background:"rgba(255,59,59,.08)", color:"#FF6B6B", border:"1.5px solid rgba(255,59,59,.2)", borderRadius:7, padding:"3px 9px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"Outfit,sans-serif" }}>✕</button>
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:16 }}>
            <div style={{ fontSize:10, color:"#444", marginBottom:12, paddingBottom:10, borderBottom:"1px solid #111120" }}>
              Submitted {new Date(sel.submitted_at).toLocaleString()}
            </div>
            {dataFields.map(f => (
              <div key={f.id} style={{ marginBottom:14, paddingBottom:14, borderBottom:"1px solid #0e0e18" }}>
                <div style={{ fontSize:10, fontWeight:800, color:"#444", letterSpacing:".07em", textTransform:"uppercase", marginBottom:5 }}>{f.label}</div>
                <div style={{ fontSize:13, color:"#e0e0f0", lineHeight:1.6, wordBreak:"break-word" }}>
                  {f.type==="rating"
                    ? <span>{"★".repeat(Number(sel.data[f.label])||0)}<span style={{color:"#2a2a3a"}}>{"★".repeat(5-(Number(sel.data[f.label])||0))}</span><span style={{fontSize:11,color:cat.color,marginLeft:6}}>{sel.data[f.label]}/5</span></span>
                    : f.type==="scale"
                    ? <span style={{ fontSize:28, fontFamily:"'Bebas Neue',sans-serif", color:cat.color }}>{sel.data[f.label]||"—"}<span style={{ fontSize:12, color:"#555", fontFamily:"Outfit,sans-serif" }}>/10</span></span>
                    : f.type==="file" && sel.data[f.label] && typeof sel.data[f.label] === "string" && !String(sel.data[f.label]).startsWith("http")
                    ? <button onClick={async()=>{try{const res=await fetch(`/api/file?path=${encodeURIComponent(String(sel.data[f.label]))}`);const data=await res.json();if(data.url)window.open(data.url,"_blank");}catch{}}} style={{ background:"transparent", color:"#00D4FF", border:"1.5px solid #00D4FF30", borderRadius:8, padding:"6px 14px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"Outfit,sans-serif" }}>📎 {sel.data[f.label + " (filename)"] || "Download File"}</button>
                    : Array.isArray(sel.data[f.label])
                    ? <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>{(sel.data[f.label] as string[]).map((v:string) => <span key={v} style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 9px", borderRadius:20, fontSize:11, fontWeight:700, background:cat.bg, color:cat.color, border:`1px solid ${cat.color}25` }}>{v}</span>)}</div>
                    : sel.data[f.label] || <span style={{ color:"#2a2a3a", fontStyle:"italic" }}>No answer</span>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <ImportModal form={form} onClose={() => setShowImport(false)} />
      )}
    </div>
  );
}
