// components/ui/DashboardClient.tsx
"use client";
import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteForm } from "@/lib/actions/forms";
import { FORM_CATEGORIES } from "@/lib/constants";
import type { Form } from "@/types";

export default function DashboardClient({ forms, responseMap }: { forms: Form[]; responseMap: Record<string, number> }) {
  const router = useRouter();
  const [isPending, start] = useTransition();

  const totalResp   = Object.values(responseMap).reduce((s, c) => s + c, 0);
  const catCount    = (id: string) => forms.filter(f => f.category === id).length;
  const catResp     = (id: string) => forms.filter(f => f.category === id).reduce((s, f) => s + (responseMap[f.id] || 0), 0);

  return (
    <div style={{ padding:"clamp(16px, 4vw, 36px)" }} className="animate-fade-up">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28, flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontSize:10, color:"#FF6B35", fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", marginBottom:5 }}>Overview</div>
          <h1 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"clamp(28px, 5vw, 40px)", letterSpacing:".05em", lineHeight:1 }}>DASHBOARD</h1>
        </div>
        <Link href="/builder" style={{ background:"linear-gradient(135deg,#FF6B35,#FF9A5C)", color:"#fff", border:"none", borderRadius:9, padding:"10px 20px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"Outfit,sans-serif", textDecoration:"none", whiteSpace:"nowrap" }}>+ New Form</Link>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12, marginBottom:24 }}>
        {[{label:"Total Forms",value:forms.length,accent:"#FF6B35"},{label:"All Responses",value:totalResp,accent:"#00D4FF"},{label:"Active Forms",value:forms.filter(f=>f.is_published).length,accent:"#22c55e"},{label:"Categories",value:3,accent:"#C77DFF"}].map(s=>(
          <div key={s.label} style={{ background:"#0d0d16", border:"1.5px solid #171726", borderRadius:14, padding:20, borderTop:`3px solid ${s.accent}` }}>
            <div style={{ fontSize:38, fontFamily:"'Bebas Neue',sans-serif", color:s.accent, lineHeight:1, marginBottom:4 }}>{s.value}</div>
            <div style={{ fontSize:13, fontWeight:700 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:12, marginBottom:24 }}>
        {FORM_CATEGORIES.map(cat => (
          <div key={cat.id} style={{ background:`linear-gradient(135deg,#0d0d16,${cat.color}08)`, border:`1.5px solid ${cat.color}20`, borderRadius:14, padding:20, display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:46, height:46, borderRadius:12, background:cat.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{cat.icon}</div>
            <div>
              <div style={{ fontSize:10, color:cat.color, fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", marginBottom:3 }}>{cat.label}</div>
              <div style={{ fontSize:24, fontFamily:"'Bebas Neue',sans-serif", color:cat.color, lineHeight:1 }}>{catCount(cat.id)} <span style={{ fontSize:12, color:"#444", fontFamily:"Outfit,sans-serif" }}>forms · {catResp(cat.id)} resp.</span></div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent forms */}
      <div style={{ background:"#0d0d16", border:"1.5px solid #171726", borderRadius:14, padding:22 }}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", color:"#444", marginBottom:16 }}>Recent Forms</div>
        {forms.length === 0
          ? <div style={{ textAlign:"center", padding:"32px 0", color:"#333" }}>No forms yet. <Link href="/builder" style={{ color:"#FF9A5C" }}>Create one →</Link></div>
          : forms.slice(0, 6).map(form => {
              const cat = FORM_CATEGORIES.find(c => c.id === form.category)!;
              const rc  = responseMap[form.id] || 0;
              return (
                <div key={form.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 0", borderBottom:"1.5px solid #111120" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:34, height:34, borderRadius:9, background:cat.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>{cat.icon}</div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, marginBottom:1 }}>{form.name}</div>
                      <div style={{ fontSize:11, color:"#444" }}>{form.fields.length} fields · <span style={{ color:cat.color }}>{rc} resp.</span></div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:5 }}>
                    <Link href={`/f/${form.id}`} target="_blank" style={{ background:"transparent", color:"#777", border:"1.5px solid #1e1e30", borderRadius:8, padding:"5px 12px", fontSize:12, fontWeight:700, textDecoration:"none" }}>Preview</Link>
                    <Link href={`/forms/${form.id}/responses`} style={{ background:"transparent", color:"#777", border:"1.5px solid #1e1e30", borderRadius:8, padding:"5px 12px", fontSize:12, fontWeight:700, textDecoration:"none" }}>Data</Link>
                  </div>
                </div>
              );
            })
        }
      </div>
    </div>
  );
}
