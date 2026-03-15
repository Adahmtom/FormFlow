// components/ui/FormsListClient.tsx
"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteForm } from "@/lib/actions/forms";
import { FORM_CATEGORIES } from "@/lib/constants";
import ImportModal from "@/components/import/ImportModal";
import type { Form } from "@/types";

export default function FormsListClient({ forms, responseMap, initialFilter = "all" }: { forms: Form[]; responseMap: Record<string, number>; initialFilter?: string }) {
  const router = useRouter();
  const [filter, setFilter]   = useState(initialFilter);
  const [isPending, start]    = useTransition();
  const [importForm, setImportForm] = useState<Form | null>(null);

  const visible = filter === "all" ? forms : forms.filter(f => f.category === filter);

  const handleDelete = (id: string) => {
    if (!confirm("Delete this form and all its responses?")) return;
    start(async () => { await deleteForm(id); router.refresh(); });
  };

  return (
    <div style={{ padding:"clamp(16px, 4vw, 36px)" }} className="animate-fade-up">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22, flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontSize:10, color:"#FF6B35", fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", marginBottom:5 }}>Library</div>
          <h1 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"clamp(28px, 5vw, 40px)", letterSpacing:".05em", lineHeight:1 }}>ALL FORMS</h1>
        </div>
        <Link href="/builder" style={{ background:"linear-gradient(135deg,#FF6B35,#FF9A5C)", color:"#fff", border:"none", borderRadius:9, padding:"10px 20px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"Outfit,sans-serif", textDecoration:"none", whiteSpace:"nowrap" }}>+ New Form</Link>
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:6, marginBottom:22, flexWrap:"wrap" }}>
        {[{id:"all",label:"All"},...FORM_CATEGORIES.map(c=>({id:c.id,label:c.label,icon:c.icon}))].map(f => (
          <button key={f.id} onClick={()=>setFilter(f.id)} style={{ background:filter===f.id?"#FF6B35":"#0e0e16", color:filter===f.id?"#fff":"#555", border:`1.5px solid ${filter===f.id?"#FF6B35":"#1a1a2c"}`, borderRadius:7, padding:"6px 14px", fontFamily:"Outfit,sans-serif", fontWeight:700, fontSize:12, cursor:"pointer", transition:"all .2s" }}>
            {"icon" in f && <span style={{ marginRight:4 }}>{(f as any).icon}</span>}{f.label}
          </button>
        ))}
      </div>

      {visible.length === 0
        ? <div style={{ background:"#0d0d16", border:"1.5px solid #171726", borderRadius:14, padding:"60px 0", textAlign:"center" }}>
            <div style={{ fontSize:40, marginBottom:10 }}>◫</div>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:6 }}>No forms here</div>
            <Link href="/builder" style={{ display:"inline-block", marginTop:14, background:"linear-gradient(135deg,#FF6B35,#FF9A5C)", color:"#fff", borderRadius:9, padding:"10px 20px", fontSize:13, fontWeight:700, textDecoration:"none" }}>+ Create Form</Link>
          </div>
        : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(min(280px,100%),1fr))", gap:14 }}>
            {visible.map(form => {
              const cat = FORM_CATEGORIES.find(c => c.id === form.category)!;
              const rc  = responseMap[form.id] || 0;
              return (
                <div key={form.id} style={{ background:"#0d0d16", border:`1.5px solid ${cat.color}18`, borderRadius:14, padding:20, display:"flex", flexDirection:"column", gap:14, transition:"border-color .2s" }}
                  onMouseEnter={e=>(e.currentTarget.style.borderColor=cat.color+"40")}
                  onMouseLeave={e=>(e.currentTarget.style.borderColor=cat.color+"18")}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:36, height:36, borderRadius:9, background:cat.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{cat.icon}</div>
                      <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 9px", borderRadius:20, fontSize:11, fontWeight:700, background:cat.bg, color:cat.color, border:`1px solid ${cat.color}25` }}>{cat.label}</span>
                    </div>
                    <span style={{ fontSize:11, color:"#333" }}>{new Date(form.created_at).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <h3 style={{ fontSize:16, fontWeight:800, marginBottom:4 }}>{form.name}</h3>
                    {form.description && <p style={{ fontSize:12, color:"#555", lineHeight:1.5 }}>{form.description}</p>}
                  </div>
                  <div style={{ display:"flex", gap:12, fontSize:12, color:"#444" }}>
                    <span><b style={{ color:"#F0EFF8" }}>{form.fields.length}</b> fields</span>
                    <span><b style={{ color:cat.color }}>{rc}</b> responses</span>
                    <span style={{ color:form.is_published?"#22c55e":"#f87171" }}>{form.is_published?"● Live":"○ Draft"}</span>
                  </div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", borderTop:"1.5px solid #111120", paddingTop:12 }}>
                    <Link href={`/f/${form.id}`} target="_blank" style={{ background:"linear-gradient(135deg,#FF6B35,#FF9A5C)", color:"#fff", border:"none", borderRadius:8, padding:"6px 14px", fontSize:12, fontWeight:700, textDecoration:"none" }}>Preview</Link>
                    <Link href={`/builder/${form.id}`} style={{ background:"transparent", color:"#777", border:"1.5px solid #1e1e30", borderRadius:8, padding:"6px 14px", fontSize:12, fontWeight:700, textDecoration:"none" }}>Edit</Link>
                    <Link href={`/forms/${form.id}/responses`} style={{ background:"transparent", color:"#777", border:"1.5px solid #1e1e30", borderRadius:8, padding:"6px 14px", fontSize:12, fontWeight:700, textDecoration:"none" }}>Responses ({rc})</Link>
                    <button onClick={()=>setImportForm(form)} style={{ background:"transparent", color:"#C77DFF", border:"1.5px solid #C77DFF30", borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"Outfit,sans-serif" }}>↑ Import</button>
                    <button onClick={()=>handleDelete(form.id)} disabled={isPending} style={{ background:"rgba(255,59,59,.08)", color:"#FF6B6B", border:"1.5px solid rgba(255,59,59,.2)", borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"Outfit,sans-serif" }}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
      }

      {/* Import Modal */}
      {importForm && (
        <ImportModal form={importForm} onClose={() => { setImportForm(null); router.refresh(); }} />
      )}
    </div>
  );
}
