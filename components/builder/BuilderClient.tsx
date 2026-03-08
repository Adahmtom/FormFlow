// components/builder/BuilderClient.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createForm, updateForm } from "@/lib/actions/forms";
import { DEFAULT_THEME, FIELD_TYPES, FORM_CATEGORIES, GOOGLE_FONTS, GRADIENT_PRESETS, FORM_TEMPLATES } from "@/lib/constants";
import { COUNTRY_CODES } from "@/lib/countryCodes";
import AutomationsPanel from "@/components/automations/AutomationsPanel";
import MiniPreview from "./MiniPreview";
import type { Form, FormField, FormTheme, FormCategory, BuilderPanel, AutomationRule, ConditionOperator } from "@/types";

const uid = () => Math.random().toString(36).slice(2, 9);

export default function BuilderClient({ initialForm, isNew }: { initialForm: Form; isNew: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name,    setName]    = useState(initialForm.name);
  const [desc,    setDesc]    = useState(initialForm.description);
  const [cat,     setCat]     = useState<FormCategory>(initialForm.category);
  const [fields,  setFields]  = useState<FormField[]>(initialForm.fields);
  const [theme,   setTheme]   = useState<FormTheme>({ ...DEFAULT_THEME, ...initialForm.theme });
  const [automations, setAutomations] = useState<AutomationRule[]>(initialForm.automations ?? []);
  const [openFid, setOpenFid] = useState<string | null>(null);
  const [panel,   setPanel]   = useState<BuilderPanel>("fields");
  const [shareMode, setShareMode] = useState<"link" | "embed" | "display">("link");
  const [toast,   setToast]   = useState<string | null>(null);

  const catObj = FORM_CATEGORIES.find(c => c.id === cat)!;
  const setT   = (k: keyof FormTheme, v: any) => setTheme(p => ({ ...p, [k]: v }));
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const addField = (type: string) => {
    const f: FormField = {
      id: uid(),
      type: type as any,
      label: FIELD_TYPES.find(t => t.type === type)?.label || type,
      placeholder: type === "address" ? "Start typing an address…" : "",
      required: false,
      options: ["select", "radio", "checkbox"].includes(type) ? ["Option A", "Option B"] : [],
      defaultCountry: type === "phone" ? "US" : undefined,
      maxFileSize: type === "file" ? 10 : undefined,
      allowedFileTypes: type === "file" ? [] : undefined,
    };
    setFields(p => [...p, f]);
    setOpenFid(f.id);
  };

  const updateField = (id: string, upd: Partial<FormField>) => setFields(p => p.map(f => f.id === id ? { ...f, ...upd } : f));
  const removeField = (id: string) => { setFields(p => p.filter(f => f.id !== id)); if (openFid === id) setOpenFid(null); };
  const moveField   = (id: string, dir: "up" | "down") => {
    const i = fields.findIndex(f => f.id === id);
    if ((dir === "up" && i === 0) || (dir === "down" && i === fields.length - 1)) return;
    const a = [...fields]; const j = dir === "up" ? i - 1 : i + 1;
    [a[i], a[j]] = [a[j], a[i]]; setFields(a);
  };

  const applyTemplate = () => {
    const tpl = FORM_TEMPLATES[cat];
    setFields(tpl.map(t => ({ id: uid(), type: t.t as any, label: t.l, placeholder: "", required: t.r, options: t.o ?? [] })));
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        if (isNew) {
          await createForm({ name, description: desc, category: cat, fields, theme, automations });
        } else {
          await updateForm(initialForm.id, { name, description: desc, category: cat, fields, theme, automations });
        }
        showToast("Form saved ✓");
        router.push("/forms");
        router.refresh();
      } catch (e: any) {
        showToast("Error: " + e.message);
      }
    });
  };

  const formId    = initialForm.id || "preview";
  const origin    = typeof window !== "undefined" ? window.location.origin : "https://yourapp.com";
  const linkUrl   = `${origin}/f/${formId}`;
  const embedCode = `<iframe src="${linkUrl}" width="100%" height="600" frameborder="0" style="border-radius:${theme.formRadius}px;border:none"></iframe>`;
  const widgetCode = `<script src="${origin}/widget.js" data-form="${formId}" data-trigger="click"></script>`;

  const grouped: Record<string, any[]> = { basic: [], choice: [], advanced: [], layout: [] };
  FIELD_TYPES.forEach(f => grouped[f.group].push(f));

  const inp: React.CSSProperties = { width: "100%", background: "#0e0e16", border: "1.5px solid #1e1e30", borderRadius: 9, color: "#F0EFF8", fontFamily: "Outfit,sans-serif", fontSize: 13, padding: "9px 12px", outline: "none" };

  return (
    <div className="builder-grid" style={{ height: "100vh", overflow: "hidden", position: "relative" }}>
      {toast && <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: "#0d1f0d", border: "1.5px solid #22c55e", borderRadius: 10, padding: "10px 20px", fontSize: 13, color: "#86efac", fontWeight: 700 }}>{toast}</div>}

      <style>{`
        .builder-grid { display: grid; grid-template-columns: 260px 1fr 300px; }
        @media (max-width: 1024px) { .builder-grid { grid-template-columns: 220px 1fr 260px; } }
        @media (max-width: 768px) { .builder-grid { grid-template-columns: 1fr; grid-template-rows: auto 1fr; height: auto !important; min-height: 100vh; } }
        @media (max-width: 768px) { .builder-left { display: none; } .builder-right { display: none; } }
      `}</style>

      {/* ── LEFT PANEL ── */}
      <div style={{ background: "#08080f", borderRight: "1.5px solid #111120", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", borderBottom: "1.5px solid #111120", overflowX: "auto" }}>
          {(["fields", "theme", "share", "automate"] as BuilderPanel[]).map(t => (
            <button key={t} onClick={() => setPanel(t)} style={{ flex: 1, padding: "10px 6px", fontSize: 11, fontWeight: 700, cursor: "pointer", background: "none", border: "none", borderBottom: panel === t ? "2px solid #FF6B35" : "2px solid transparent", color: panel === t ? "#FF6B35" : "#555", fontFamily: "Outfit,sans-serif", textTransform: "capitalize", transition: "all .2s", whiteSpace: "nowrap" }}>
              {t === "automate" ? "⚡ Auto" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px" }}>

          {/* FIELDS */}
          {panel === "fields" && <>
            <button onClick={applyTemplate} style={{ ...inp, background: "#0e0e16", border: "1.5px solid rgba(255,107,53,.3)", color: "#FF9A5C", cursor: "pointer", fontWeight: 700, textAlign: "center", marginBottom: 14, borderRadius: 9, padding: "9px" }}>⚡ {catObj.label} Template</button>
            {Object.entries({ Basic: grouped.basic, Choice: grouped.choice, Advanced: grouped.advanced, Layout: grouped.layout }).map(([grp, types]) => (
              <div key={grp} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: "#333", fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", marginBottom: 7 }}>{grp}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                  {types.map((ft: any) => (
                    <div key={ft.type} onClick={() => addField(ft.type)}
                      style={{ background: "#0e0e18", border: "1.5px solid #1a1a2c", borderRadius: 9, padding: "8px 6px", cursor: "pointer", textAlign: "center", transition: "all .2s" }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#FF6B35"; el.style.background = "#FF6B3510"; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#1a1a2c"; el.style.background = "#0e0e18"; }}>
                      <div style={{ fontSize: 16, marginBottom: 2, color: "#FF6B35" }}>{ft.icon}</div>
                      <div style={{ fontSize: 10, color: "#666", fontWeight: 600 }}>{ft.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>}

          {/* THEME */}
          {panel === "theme" && <>
            <ThemeSection label="Background">
              <ThemeRow label="Type"><select style={inp} value={theme.bgType} onChange={e => setT("bgType", e.target.value as any)}><option value="solid">Solid Color</option><option value="gradient">Gradient</option></select></ThemeRow>
              {theme.bgType === "solid" && <ThemeRow label="Color"><ColorPicker value={theme.bgColor} onChange={v => setT("bgColor", v)} /></ThemeRow>}
              {theme.bgType === "gradient" && <ThemeRow label="Preset">{GRADIENT_PRESETS.map(g => <div key={g.value} onClick={() => setT("bgGradient", g.value)} style={{ background: g.value, height: 26, borderRadius: 6, marginBottom: 4, cursor: "pointer", border: `2px solid ${theme.bgGradient === g.value ? "#FF6B35" : "transparent"}` }} />)}</ThemeRow>}
            </ThemeSection>
            <ThemeSection label="Form Card">
              <ThemeRow label="Card Background"><ColorPicker value={theme.formBg} onChange={v => setT("formBg", v)} /></ThemeRow>
              <RangeRow label="Width"   min={380} max={900} value={theme.formWidth}   unit="px" onChange={v => setT("formWidth", v)} />
              <RangeRow label="Radius"  min={0}   max={32}  value={theme.formRadius}  unit="px" onChange={v => setT("formRadius", v)} />
              <RangeRow label="Padding" min={16}  max={64}  value={theme.formPadding} unit="px" onChange={v => setT("formPadding", v)} />
              <ThemeRow label="Drop Shadow"><label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: "#888" }}><input type="checkbox" checked={theme.showShadow} onChange={e => setT("showShadow", e.target.checked)} /> Enabled</label></ThemeRow>
            </ThemeSection>
            <ThemeSection label="Typography">
              <ThemeRow label="Font Family"><select style={inp} value={theme.fontFamily} onChange={e => setT("fontFamily", e.target.value)}>{GOOGLE_FONTS.map(f => <option key={f} value={f}>{f}</option>)}</select></ThemeRow>
              <RangeRow label="Title Size" min={16} max={48} value={theme.titleSize} unit="px" onChange={v => setT("titleSize", v)} />
              <RangeRow label="Label Size" min={10} max={20} value={theme.labelSize} unit="px" onChange={v => setT("labelSize", v)} />
              <RangeRow label="Input Size" min={11} max={20} value={theme.fontSize}  unit="px" onChange={v => setT("fontSize", v)} />
              <ThemeRow label="Text Color"><ColorPicker value={theme.textColor}  onChange={v => setT("textColor", v)} /></ThemeRow>
              <ThemeRow label="Label Color"><ColorPicker value={theme.labelColor} onChange={v => setT("labelColor", v)} /></ThemeRow>
            </ThemeSection>
            <ThemeSection label="Input Fields">
              <ThemeRow label="Input Background"><ColorPicker value={theme.inputBg}     onChange={v => setT("inputBg", v)} /></ThemeRow>
              <ThemeRow label="Border Color"><ColorPicker value={theme.inputBorder}  onChange={v => setT("inputBorder", v)} /></ThemeRow>
              <RangeRow label="Border Radius" min={0}  max={20} value={theme.inputRadius}  unit="px" onChange={v => setT("inputRadius", v)} />
              <RangeRow label="Field Spacing" min={8}  max={40} value={theme.fieldSpacing} unit="px" onChange={v => setT("fieldSpacing", v)} />
              <ThemeRow label="Primary Color"><ColorPicker value={theme.primaryColor} onChange={v => setT("primaryColor", v)} /></ThemeRow>
            </ThemeSection>
            <ThemeSection label="Submit Button">
              <ThemeRow label="Button Text"><input style={inp} value={theme.buttonText} onChange={e => setT("buttonText", e.target.value)} /></ThemeRow>
              <ThemeRow label="Button Color"><ColorPicker value={theme.buttonColor}     onChange={v => setT("buttonColor", v)} /></ThemeRow>
              <ThemeRow label="Text Color"><ColorPicker value={theme.buttonTextColor}   onChange={v => setT("buttonTextColor", v)} /></ThemeRow>
              <RangeRow label="Radius" min={0} max={50} value={theme.buttonRadius} unit="px" onChange={v => setT("buttonRadius", v)} />
              <ThemeRow label="Full Width"><label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: "#888" }}><input type="checkbox" checked={theme.buttonFullWidth} onChange={e => setT("buttonFullWidth", e.target.checked)} /> Enabled</label></ThemeRow>
            </ThemeSection>
          </>}

          {/* SHARE */}
          {panel === "share" && <>
            <div style={{ fontSize: 11, color: "#FF6B35", fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", marginBottom: 12 }}>Share / Publish</div>
            <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
              {[{ id: "link", label: "🔗 Link" }, { id: "embed", label: "</> Embed" }, { id: "display", label: "🖥 Display" }].map(m => (
                <button key={m.id} onClick={() => setShareMode(m.id as any)} style={{ flex: 1, background: shareMode === m.id ? "#FF6B35" : "#0e0e16", color: shareMode === m.id ? "#fff" : "#666", border: `1.5px solid ${shareMode === m.id ? "#FF6B35" : "#1a1a2c"}`, borderRadius: 7, padding: "7px 4px", fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: 10, cursor: "pointer" }}>{m.label}</button>
              ))}
            </div>
            {shareMode === "link" && <>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 10, lineHeight: 1.6 }}>Share this URL. Opens the form full-page.</div>
              <div style={{ background: "#0a0a12", border: "1.5px solid #1a1a28", borderRadius: 10, padding: 12, fontSize: 11, color: "#888", fontFamily: "monospace", wordBreak: "break-all", lineHeight: 1.6 }}>{linkUrl}</div>
              <button onClick={() => { navigator.clipboard?.writeText(linkUrl); showToast("Link copied!"); }} style={{ ...inp, cursor: "pointer", background: "linear-gradient(135deg,#FF6B35,#FF9A5C)", color: "#fff", fontWeight: 700, textAlign: "center", marginTop: 10, border: "none" }}>Copy Link</button>
            </>}
            {shareMode === "embed" && <>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 10, lineHeight: 1.6 }}>Paste this iframe into any webpage to embed the form inline.</div>
              <div style={{ background: "#0a0a12", border: "1.5px solid #1a1a28", borderRadius: 10, padding: 12, fontSize: 11, color: "#888", fontFamily: "monospace", wordBreak: "break-all", lineHeight: 1.6 }}>{embedCode}</div>
              <button onClick={() => { navigator.clipboard?.writeText(embedCode); showToast("Embed code copied!"); }} style={{ ...inp, cursor: "pointer", background: "linear-gradient(135deg,#FF6B35,#FF9A5C)", color: "#fff", fontWeight: 700, textAlign: "center", marginTop: 10, border: "none" }}>Copy Embed Code</button>
            </>}
            {shareMode === "display" && <>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 10, lineHeight: 1.6 }}>Popup or slide-in via JS widget.</div>
              <ThemeRow label="Trigger"><select style={inp}><option>On button click</option><option>On page load</option><option>After 5 seconds</option><option>On exit intent</option><option>After 50% scroll</option></select></ThemeRow>
              <ThemeRow label="Position"><select style={inp}><option>Center modal</option><option>Slide in right</option><option>Slide in left</option><option>Bottom bar</option></select></ThemeRow>
              <div style={{ background: "#0a0a12", border: "1.5px solid #1a1a28", borderRadius: 10, padding: 12, fontSize: 11, color: "#888", fontFamily: "monospace", wordBreak: "break-all", lineHeight: 1.6 }}>{widgetCode}</div>
              <button onClick={() => { navigator.clipboard?.writeText(widgetCode); showToast("Snippet copied!"); }} style={{ ...inp, cursor: "pointer", background: "linear-gradient(135deg,#FF6B35,#FF9A5C)", color: "#fff", fontWeight: 700, textAlign: "center", marginTop: 10, border: "none" }}>Copy Snippet</button>
            </>}
          </>}

          {/* AUTOMATE */}
          {panel === "automate" && (
            <AutomationsPanel automations={automations} onChange={setAutomations} fields={fields} />
          )}
        </div>
      </div>

      {/* ── CENTER: Meta + Fields ── */}
      <div style={{ overflowY: "auto", padding: "22px 18px", background: "#060608" }}>
        <div style={{ background: "#0d0d16", border: "1.5px solid #171726", borderRadius: 12, padding: 18, marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div><TLabel>Form Name</TLabel><input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Form name…" /></div>
            <div><TLabel>Category</TLabel>
              <select style={inp} value={cat} onChange={e => setCat(e.target.value as FormCategory)}>
                {FORM_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>
            </div>
          </div>
          <div><TLabel>Description</TLabel><input style={inp} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Brief description…" /></div>
        </div>

        <div style={{ fontSize: 10, color: "#444", fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", marginBottom: 10 }}>Fields ({fields.length})</div>
        {fields.length === 0 && <div style={{ textAlign: "center", padding: "24px", color: "#2a2a40", background: "#0b0b12", border: "2px dashed #1a1a28", borderRadius: 10, fontSize: 12 }}>Add fields from the left panel or apply a template</div>}

        {fields.map(f => {
          const ft = FIELD_TYPES.find(t => t.type === f.type);
          const isOpen = openFid === f.id;
          return (
            <div key={f.id} onClick={() => setOpenFid(isOpen ? null : f.id)}
              style={{ background: "#0b0b14", border: `1.5px solid ${isOpen ? "#FF6B3560" : "#1a1a2c"}`, borderRadius: 11, padding: "12px 14px", marginBottom: 7, cursor: "pointer", transition: "all .2s" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ fontSize: 15, color: "#FF6B35", width: 20, textAlign: "center" }}>{ft?.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{f.label}</div>
                    <div style={{ fontSize: 10, color: "#444" }}>{ft?.label}{f.required && <span style={{ color: "#FF3B3B", marginLeft: 5 }}>Required</span>}{f.condition?.enabled && <span style={{ color: "#C77DFF", marginLeft: 5 }}>⚡ Conditional</span>}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 3 }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => moveField(f.id, "up")}   style={ghostBtn}>↑</button>
                  <button onClick={() => moveField(f.id, "down")} style={ghostBtn}>↓</button>
                  <button onClick={() => removeField(f.id)}       style={delBtn}>×</button>
                </div>
              </div>

              {isOpen && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1.5px solid #1a1a2c" }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                    <div><TLabel>Label</TLabel><input style={inp} value={f.label} onChange={e => updateField(f.id, { label: e.target.value })} /></div>
                    {!["select", "radio", "checkbox", "rating", "scale", "section", "file", "address"].includes(f.type) && (
                      <div><TLabel>Placeholder</TLabel><input style={inp} value={f.placeholder} onChange={e => updateField(f.id, { placeholder: e.target.value })} /></div>
                    )}
                  </div>

                  {/* Phone: country code default */}
                  {f.type === "phone" && (
                    <div style={{ marginBottom: 8 }}>
                      <TLabel>Default Country</TLabel>
                      <select style={inp} value={f.defaultCountry ?? "US"} onChange={e => updateField(f.id, { defaultCountry: e.target.value })}>
                        {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name} ({c.dial})</option>)}
                      </select>
                    </div>
                  )}

                  {["select", "radio", "checkbox"].includes(f.type) && (
                    <div style={{ marginBottom: 8 }}>
                      <TLabel>Options (one per line)</TLabel>
                      <textarea style={{ ...inp, resize: "vertical" }} rows={3} value={f.options.join("\n")} onChange={e => updateField(f.id, { options: e.target.value.split("\n").filter(Boolean) })} />
                    </div>
                  )}

                  {/* File Upload Config */}
                  {f.type === "file" && (
                    <div style={{ marginBottom: 8 }}>
                      <TLabel>Max File Size (MB)</TLabel>
                      <input style={inp} type="number" min={1} max={50} value={f.maxFileSize ?? 10} onChange={e => updateField(f.id, { maxFileSize: Number(e.target.value) })} />
                      <div style={{ marginTop: 6 }}>
                        <TLabel>Allowed File Types (comma separated, e.g. .pdf,.jpg,.png)</TLabel>
                        <input style={inp} placeholder=".pdf,.jpg,.png,.doc" value={(f.allowedFileTypes ?? []).join(",")} onChange={e => updateField(f.id, { allowedFileTypes: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} />
                      </div>
                      <div style={{ fontSize: 10, color: "#555", marginTop: 4 }}>Leave empty to allow all file types. Files upload to Supabase Storage.</div>
                    </div>
                  )}

                  <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 12, color: "#777", marginBottom: 10 }}>
                    <input type="checkbox" checked={f.required} onChange={e => updateField(f.id, { required: e.target.checked })} /> Required field
                  </label>

                  {/* ── Conditional Logic ── */}
                  {f.type !== "section" && (
                    <div style={{ borderTop: "1.5px solid #1a1a2c", paddingTop: 10, marginTop: 4 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 12, color: "#FF6B35", fontWeight: 700, marginBottom: 8 }}>
                        <input type="checkbox" checked={f.condition?.enabled ?? false}
                          onChange={e => updateField(f.id, {
                            condition: {
                              enabled: e.target.checked,
                              sourceFieldId: f.condition?.sourceFieldId ?? "",
                              operator: f.condition?.operator ?? "equals",
                              value: f.condition?.value ?? "",
                            }
                          })} />
                        Show conditionally
                      </label>

                      {f.condition?.enabled && (() => {
                        const otherFields = fields.filter(of => of.id !== f.id && of.type !== "section");
                        return (
                          <div style={{ background: "#0a0a14", border: "1px solid #1e1e30", borderRadius: 8, padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                            <div style={{ fontSize: 10, color: "#FF6B35", fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 2 }}>Show this field when…</div>
                            <div>
                              <TLabel>Source Field</TLabel>
                              <select style={inp} value={f.condition.sourceFieldId} onChange={e => updateField(f.id, { condition: { ...f.condition!, sourceFieldId: e.target.value } })}>
                                <option value="">Select a field…</option>
                                {otherFields.map(of => <option key={of.id} value={of.id}>{of.label} ({of.type})</option>)}
                              </select>
                            </div>
                            <div>
                              <TLabel>Operator</TLabel>
                              <select style={inp} value={f.condition.operator} onChange={e => updateField(f.id, { condition: { ...f.condition!, operator: e.target.value as ConditionOperator } })}>
                                <option value="equals">Equals</option>
                                <option value="not_equals">Does Not Equal</option>
                                <option value="contains">Contains</option>
                                <option value="not_empty">Is Not Empty</option>
                                <option value="is_empty">Is Empty</option>
                              </select>
                            </div>
                            {!["not_empty", "is_empty"].includes(f.condition.operator) && (
                              <div>
                                <TLabel>Value</TLabel>
                                {(() => {
                                  const src = fields.find(sf => sf.id === f.condition!.sourceFieldId);
                                  if (src && ["select", "radio"].includes(src.type) && src.options.length > 0) {
                                    return (
                                      <select style={inp} value={f.condition.value} onChange={e => updateField(f.id, { condition: { ...f.condition!, value: e.target.value } })}>
                                        <option value="">Select…</option>
                                        {src.options.map(o => <option key={o} value={o}>{o}</option>)}
                                      </select>
                                    );
                                  }
                                  return <input style={inp} value={f.condition.value} onChange={e => updateField(f.id, { condition: { ...f.condition!, value: e.target.value } })} placeholder="Match value…" />;
                                })()}
                              </div>
                            )}
                            <div style={{ fontSize: 10, color: "#555", lineHeight: 1.5, marginTop: 2 }}>
                              This field will only show when the condition above is met.
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── RIGHT: Live preview + save ── */}
      <div style={{ background: "#0a0a12", borderLeft: "1.5px solid #111120", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "11px 14px", borderBottom: "1.5px solid #111120", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#555", letterSpacing: ".07em", textTransform: "uppercase" }}>Live Preview</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={handleSave} disabled={isPending} style={{ background: "linear-gradient(135deg,#FF6B35,#FF9A5C)", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif", opacity: isPending ? .7 : 1 }}>
              {isPending ? "Saving…" : "Save"}
            </button>
            <button onClick={() => router.push("/forms")} style={ghostBtnFull}>Cancel</button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <MiniPreview fields={fields} theme={theme} name={name} desc={desc} />
        </div>
      </div>
    </div>
  );
}

// ── Tiny helper components ──
function TLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: "#555", letterSpacing: ".07em", textTransform: "uppercase", marginBottom: 5 }}>{children}</div>;
}
function ThemeSection({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 18 }}><div style={{ fontSize: 10, color: "#FF6B35", fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", marginBottom: 10 }}>{label}</div>{children}</div>;
}
function ThemeRow({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 10 }}><TLabel>{label}</TLabel>{children}</div>;
}
function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="color" value={value} onChange={e => onChange(e.target.value)} style={{ width: 32, height: 32, borderRadius: 7, border: "none", cursor: "pointer", background: "none", padding: 0 }} /><span style={{ fontSize: 12, color: "#555" }}>{value}</span></div>;
}
function RangeRow({ label, min, max, value, unit, onChange }: { label: string; min: number; max: number; value: number; unit: string; onChange: (v: number) => void }) {
  return <ThemeRow label={`${label}: ${value}${unit}`}><input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))} style={{ width: "100%", accentColor: "#FF6B35" }} /></ThemeRow>;
}

const ghostBtn: React.CSSProperties = { background: "transparent", color: "#666", border: "1.5px solid #1e1e30", borderRadius: 7, padding: "3px 8px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif" };
const ghostBtnFull: React.CSSProperties = { background: "transparent", color: "#777", border: "1.5px solid #1e1e30", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif" };
const delBtn: React.CSSProperties = { background: "rgba(255,59,59,.08)", color: "#FF6B6B", border: "1.5px solid rgba(255,59,59,.2)", borderRadius: 7, padding: "3px 8px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif" };
