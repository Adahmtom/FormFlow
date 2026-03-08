// components/builder/MiniPreview.tsx
"use client";
import type { FormField, FormTheme } from "@/types";

export default function MiniPreview({ fields, theme, name, desc }: { fields: FormField[]; theme: FormTheme; name: string; desc: string }) {
  const bg = theme.bgType === "gradient" ? theme.bgGradient : theme.bgColor;
  const shadow = theme.showShadow ? "0 20px 60px rgba(0,0,0,0.15)" : "none";

  return (
    <div style={{ background: bg, minHeight: "100%", padding: "20px 12px", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: theme.formWidth, background: theme.formBg, borderRadius: theme.formRadius, padding: theme.formPadding / 1.6, boxShadow: shadow, fontFamily: `'${theme.fontFamily}',sans-serif` }}>
        <div style={{ fontSize: theme.titleSize * 0.6, fontWeight: 800, color: theme.textColor, marginBottom: 6, lineHeight: 1.2 }}>{name || "Form Title"}</div>
        {desc && <div style={{ fontSize: theme.fontSize * 0.8, color: theme.labelColor, opacity: .7, marginBottom: 14 }}>{desc}</div>}

        {fields.map(f => (
          <div key={f.id} style={{ marginBottom: theme.fieldSpacing * 0.55 }}>
            {f.type === "section"
              ? <div style={{ borderBottom: `2px solid ${theme.primaryColor}`, paddingBottom: 4, marginBottom: 8, fontSize: theme.labelSize * 0.75, fontWeight: 700, color: theme.primaryColor }}>{f.label}</div>
              : <>
                  <div style={{ fontSize: theme.labelSize * 0.72, fontWeight: 600, color: theme.labelColor, marginBottom: 4 }}>
                    {f.label}{f.required && <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>}
                  </div>
                  {["text","email","phone","number","date"].includes(f.type) && <div style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: theme.inputRadius * 0.55, padding: "5px 9px", fontSize: theme.fontSize * 0.68, color: "#aaa" }}>{f.placeholder || "…"}</div>}
                  {f.type === "textarea"  && <div style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: theme.inputRadius * 0.55, padding: "5px 9px", fontSize: theme.fontSize * 0.68, color: "#aaa", height: 44 }}>{f.placeholder || "…"}</div>}
                  {f.type === "select"    && <div style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: theme.inputRadius * 0.55, padding: "5px 9px", fontSize: theme.fontSize * 0.68, color: "#aaa", display: "flex", justifyContent: "space-between" }}>Choose… <span>▾</span></div>}
                  {f.type === "radio"     && <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{f.options.slice(0,3).map(o => <span key={o} style={{ fontSize: theme.fontSize * 0.62, color: theme.labelColor, display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 9, height: 9, borderRadius: "50%", border: `2px solid ${theme.primaryColor}`, display: "inline-block" }} />{o}</span>)}</div>}
                  {f.type === "rating"    && <div style={{ display: "flex", gap: 3 }}>{[1,2,3,4,5].map(n => <span key={n} style={{ color: n <= 3 ? theme.primaryColor : "#ddd", fontSize: 14 }}>★</span>)}</div>}
                  {f.type === "scale"     && <div style={{ background: theme.inputBg, borderRadius: 4, height: 5, position: "relative" }}><div style={{ background: theme.primaryColor, height: "100%", width: "60%", borderRadius: 4 }} /></div>}
                  {f.type === "file"      && <div style={{ background: theme.inputBg, border: `1px dashed ${theme.inputBorder}`, borderRadius: theme.inputRadius * 0.55, padding: "6px 9px", fontSize: theme.fontSize * 0.65, color: "#aaa", textAlign: "center" }}>☁️ Upload file</div>}
                  {f.type === "address"   && <div style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: theme.inputRadius * 0.55, padding: "5px 9px", fontSize: theme.fontSize * 0.68, color: "#aaa", display: "flex", alignItems: "center", gap: 4 }}><span style={{ fontSize: 11 }}>📍</span> Start typing address…</div>}
                </>
            }
          </div>
        ))}

        <div style={{ background: theme.buttonColor, color: theme.buttonTextColor, borderRadius: theme.buttonRadius * 0.55, padding: "7px 14px", textAlign: "center", fontSize: theme.fontSize * 0.72, fontWeight: 700, marginTop: 8, width: theme.buttonFullWidth ? "100%" : "auto", display: "inline-block" }}>
          {theme.buttonText}
        </div>
      </div>
    </div>
  );
}
