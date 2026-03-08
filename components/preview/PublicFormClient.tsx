// components/preview/PublicFormClient.tsx
"use client";
import { useState, useCallback, useEffect } from "react";
import { submitResponse } from "@/lib/actions/responses";
import { FORM_CATEGORIES, DEFAULT_THEME } from "@/lib/constants";
import PhoneInput from "@/components/phone/PhoneInput";
import FileUploadInput from "@/components/file/FileUploadInput";
import AddressInput from "@/components/address/AddressInput";
import type { Form, FormField, FieldCondition } from "@/types";

function evaluateCondition(
  condition: FieldCondition | undefined,
  vals: Record<string, any>,
  allFields: FormField[]
): boolean {
  if (!condition || !condition.enabled) return true;
  const sourceField = allFields.find(f => f.id === condition.sourceFieldId);
  if (!sourceField) return true;
  const sourceVal = vals[sourceField.label];
  const rawVal = Array.isArray(sourceVal) ? sourceVal.join(", ") : (sourceVal ?? "");
  const strVal = String(rawVal);
  switch (condition.operator) {
    case "equals":     return strVal === condition.value;
    case "not_equals": return strVal !== condition.value;
    case "contains":   return strVal.toLowerCase().includes(condition.value.toLowerCase());
    case "not_empty":  return strVal.trim().length > 0;
    case "is_empty":   return strVal.trim().length === 0;
    default:           return true;
  }
}

export default function PublicFormClient({ form }: { form: Form }) {
  const t     = { ...DEFAULT_THEME, ...form.theme };
  const cat   = FORM_CATEGORIES.find(c => c.id === form.category)!;
  const [vals,    setVals]    = useState<Record<string, any>>({});
  const [done,    setDone]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const set = useCallback((k: string, v: any) => setVals(p => ({ ...p, [k]: v })), []);
  const bg  = t.bgType === "gradient" ? t.bgGradient : t.bgColor;

  const handleSubmit = async () => {
    const visibleFields = form.fields.filter(
      f => f.type !== "section" && evaluateCondition(f.condition, vals, form.fields)
    );
    const miss = visibleFields.filter(f => f.required && !vals[f.label]);
    if (miss.length) { setError("Please fill in: " + miss.map(f => f.label).join(", ")); return; }
    setLoading(true); setError("");
    try {
      const cleanVals: Record<string, any> = {};
      for (const [key, val] of Object.entries(vals)) {
        if (typeof val === "string") {
          try {
            const parsed = JSON.parse(val);
            if (parsed.path && parsed.name) {
              cleanVals[key] = parsed.path;
              cleanVals[key + " (filename)"] = parsed.name;
            } else if (parsed.fullAddress !== undefined) {
              cleanVals[key] = parsed.fullAddress;
              if (parsed.street)  cleanVals[key + " (street)"]  = parsed.street;
              if (parsed.city)    cleanVals[key + " (city)"]    = parsed.city;
              if (parsed.state)   cleanVals[key + " (state)"]   = parsed.state;
              if (parsed.zip)     cleanVals[key + " (zip)"]     = parsed.zip;
              if (parsed.country) cleanVals[key + " (country)"] = parsed.country;
            } else { cleanVals[key] = val; }
          } catch { cleanVals[key] = val; }
        } else { cleanVals[key] = val; }
      }
      await submitResponse(form.id, cleanVals);
      setDone(true);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  // ── Responsive CSS-in-JS helper ──
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const responsivePadding = isMobile ? Math.min(t.formPadding, 20) : t.formPadding;
  const responsiveTitleSize = isMobile ? Math.min(t.titleSize, 24) : t.titleSize;
  const responsiveFontSize = isMobile ? Math.min(t.fontSize, 14) : t.fontSize;
  const responsiveWidth = isMobile ? "100%" : `min(${t.formWidth}px, calc(100vw - 32px))`;

  // ── Input styles ──
  const inputBase: React.CSSProperties = {
    width: "100%",
    background: t.inputBg,
    border: `1.5px solid ${t.inputBorder}`,
    borderRadius: t.inputRadius,
    color: t.textColor,
    fontFamily: `'${t.fontFamily}',sans-serif`,
    fontSize: responsiveFontSize,
    padding: isMobile ? "12px 14px" : "12px 16px",
    outline: "none",
    transition: "border-color .25s ease, box-shadow .25s ease",
    boxSizing: "border-box" as const,
  };

  const inputFocusStyle = (fieldLabel: string): React.CSSProperties => ({
    ...inputBase,
    ...(focusedField === fieldLabel ? {
      borderColor: t.primaryColor,
      boxShadow: `0 0 0 3px ${t.primaryColor}18`,
    } : {}),
  });

  if (done) return (
    <div style={{
      minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: `'${t.fontFamily}',sans-serif`, padding: 16,
    }}>
      <div style={{
        background: t.formBg, borderRadius: t.formRadius, padding: isMobile ? 28 : t.formPadding,
        textAlign: "center",
        boxShadow: t.showShadow ? "0 24px 80px rgba(0,0,0,.12), 0 4px 16px rgba(0,0,0,.08)" : "none",
        maxWidth: 520, width: "100%",
        animation: "formFadeIn .5s ease both",
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: `linear-gradient(135deg, ${cat.color}20, ${cat.color}10)`,
          border: `3px solid ${cat.color}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 36, margin: "0 auto 24px", color: cat.color,
          animation: "successPop .4s cubic-bezier(.68,-.55,.27,1.55) .2s both",
        }}>✓</div>
        <h2 style={{ fontSize: responsiveTitleSize * .75, fontWeight: 800, color: t.textColor, marginBottom: 10, lineHeight: 1.3 }}>Thank You!</h2>
        <p style={{ color: t.labelColor, opacity: .7, fontSize: responsiveFontSize, lineHeight: 1.6, maxWidth: 380, margin: "0 auto" }}>
          Your response to <b style={{ color: t.textColor }}>{form.name}</b> has been submitted successfully.
        </p>
      </div>

      <style>{`
        @keyframes formFadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes successPop { from { opacity: 0; transform: scale(0.3); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh", background: bg,
      fontFamily: `'${t.fontFamily}',sans-serif`,
      padding: isMobile ? "20px 12px" : "40px 16px",
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      {/* Progress bar at top */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 3, zIndex: 100,
        background: `${t.primaryColor}15`,
      }}>
        <div style={{
          height: "100%",
          background: `linear-gradient(90deg, ${t.primaryColor}, ${t.primaryColor}cc)`,
          width: `${Math.min(100, (Object.keys(vals).length / Math.max(1, form.fields.filter(f => f.type !== "section").length)) * 100)}%`,
          transition: "width .4s ease",
          borderRadius: "0 2px 2px 0",
        }} />
      </div>

      <div style={{
        width: responsiveWidth, maxWidth: t.formWidth,
        background: t.formBg, borderRadius: isMobile ? Math.min(t.formRadius, 16) : t.formRadius,
        padding: responsivePadding,
        boxShadow: t.showShadow ? "0 24px 80px rgba(0,0,0,.12), 0 4px 16px rgba(0,0,0,.08)" : "none",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(12px)",
        transition: "opacity .4s ease, transform .4s ease",
      }}>
        {/* Header */}
        <div style={{ marginBottom: t.fieldSpacing * 1.2 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 12px", borderRadius: 20,
            background: `${cat.color}12`, border: `1px solid ${cat.color}20`,
            fontSize: 11, fontWeight: 700, color: cat.color,
            marginBottom: 12,
          }}>
            {cat.icon} {cat.label}
          </div>
          <h1 style={{
            fontSize: responsiveTitleSize, fontWeight: 800, color: t.textColor,
            marginBottom: 8, lineHeight: 1.2, letterSpacing: "-0.02em",
          }}>{form.name}</h1>
          {form.description && (
            <p style={{
              fontSize: responsiveFontSize, color: t.labelColor, opacity: .65,
              lineHeight: 1.6, maxWidth: 540,
            }}>{form.description}</p>
          )}
        </div>

        {/* Fields */}
        {form.fields.map((f, idx) => {
          const isVisible = evaluateCondition(f.condition, vals, form.fields);
          if (!isVisible) return null;

          return (
            <div key={f.id} style={{
              marginBottom: t.fieldSpacing,
              animation: `fieldSlideIn .3s ease ${idx * 0.03}s both`,
            }}>
              {f.type === "section" ? (
                <div style={{
                  display: "flex", alignItems: "center", gap: 12,
                  paddingTop: t.fieldSpacing * 0.5,
                  paddingBottom: 8,
                  marginBottom: 4,
                }}>
                  <div style={{
                    fontSize: t.labelSize + 2, fontWeight: 700, color: t.primaryColor,
                    whiteSpace: "nowrap",
                  }}>{f.label}</div>
                  <div style={{ flex: 1, height: 2, background: `${t.primaryColor}30`, borderRadius: 1 }} />
                </div>
              ) : (
                <>
                  <label style={{
                    display: "block",
                    fontSize: isMobile ? Math.min(t.labelSize, 13) : t.labelSize,
                    fontWeight: 600, color: t.labelColor,
                    marginBottom: 8,
                    letterSpacing: "0.01em",
                  }}>
                    {f.label}
                    {f.required && <span style={{ color: t.primaryColor, marginLeft: 4, fontSize: "0.85em" }}>*</span>}
                  </label>

                  {/* Text / Email / Number */}
                  {["text", "email", "number"].includes(f.type) && (
                    <input
                      style={inputFocusStyle(f.label)}
                      type={f.type}
                      placeholder={f.placeholder}
                      value={vals[f.label] || ""}
                      onChange={e => set(f.label, e.target.value)}
                      onFocus={() => setFocusedField(f.label)}
                      onBlur={() => setFocusedField(null)}
                    />
                  )}

                  {/* Phone */}
                  {f.type === "phone" && (
                    <PhoneInput
                      value={vals[f.label] || ""} onChange={v => set(f.label, v)}
                      placeholder={f.placeholder || "Phone number"}
                      defaultCountry={f.defaultCountry || "US"} primaryColor={t.primaryColor}
                      style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, borderRadius: t.inputRadius, color: t.textColor, fontSize: responsiveFontSize, fontFamily: `'${t.fontFamily}',sans-serif` }}
                    />
                  )}

                  {/* Textarea */}
                  {f.type === "textarea" && (
                    <textarea
                      style={{ ...inputFocusStyle(f.label), resize: "vertical", minHeight: 100 }}
                      rows={4} placeholder={f.placeholder}
                      value={vals[f.label] || ""} onChange={e => set(f.label, e.target.value)}
                      onFocus={() => setFocusedField(f.label)}
                      onBlur={() => setFocusedField(null)}
                    />
                  )}

                  {/* Date */}
                  {f.type === "date" && (
                    <input style={inputBase} type="date" value={vals[f.label] || ""} onChange={e => set(f.label, e.target.value)} />
                  )}

                  {/* File Upload */}
                  {f.type === "file" && (
                    <FileUploadInput
                      value={vals[f.label] || ""} onChange={v => set(f.label, v)} formId={form.id}
                      maxFileSize={f.maxFileSize || 10} allowedTypes={f.allowedFileTypes} primaryColor={t.primaryColor}
                      style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, borderRadius: t.inputRadius, color: t.textColor, fontSize: responsiveFontSize, fontFamily: `'${t.fontFamily}',sans-serif` }}
                    />
                  )}

                  {/* Address */}
                  {f.type === "address" && (
                    <AddressInput
                      value={vals[f.label] || ""} onChange={v => set(f.label, v)}
                      placeholder={f.placeholder || "Start typing an address…"} primaryColor={t.primaryColor}
                      style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, borderRadius: t.inputRadius, color: t.textColor, fontSize: responsiveFontSize, fontFamily: `'${t.fontFamily}',sans-serif` }}
                    />
                  )}

                  {/* Select */}
                  {f.type === "select" && (
                    <select style={{ ...inputBase, cursor: "pointer" }} value={vals[f.label] || ""} onChange={e => set(f.label, e.target.value)}>
                      <option value="">Choose…</option>
                      {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  )}

                  {/* Radio */}
                  {f.type === "radio" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {f.options.map(o => (
                        <label key={o} style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "10px 14px", borderRadius: t.inputRadius,
                          border: `1.5px solid ${vals[f.label] === o ? t.primaryColor : t.inputBorder}`,
                          background: vals[f.label] === o ? `${t.primaryColor}08` : t.inputBg,
                          cursor: "pointer", transition: "all .2s",
                          fontSize: responsiveFontSize, color: t.textColor,
                        }}>
                          <div style={{
                            width: 18, height: 18, borderRadius: "50%",
                            border: `2px solid ${vals[f.label] === o ? t.primaryColor : t.inputBorder}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all .2s", flexShrink: 0,
                          }}>
                            {vals[f.label] === o && (
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.primaryColor }} />
                            )}
                          </div>
                          <input type="radio" name={f.id} value={o} checked={vals[f.label] === o}
                            onChange={() => set(f.label, o)} style={{ display: "none" }} />
                          {o}
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Checkbox */}
                  {f.type === "checkbox" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {f.options.map(o => {
                        const checked = (vals[f.label] || []).includes(o);
                        return (
                          <label key={o} style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "10px 14px", borderRadius: t.inputRadius,
                            border: `1.5px solid ${checked ? t.primaryColor : t.inputBorder}`,
                            background: checked ? `${t.primaryColor}08` : t.inputBg,
                            cursor: "pointer", transition: "all .2s",
                            fontSize: responsiveFontSize, color: t.textColor,
                          }}>
                            <div style={{
                              width: 18, height: 18, borderRadius: 4,
                              border: `2px solid ${checked ? t.primaryColor : t.inputBorder}`,
                              background: checked ? t.primaryColor : "transparent",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              transition: "all .2s", flexShrink: 0,
                            }}>
                              {checked && <span style={{ color: "#fff", fontSize: 11, fontWeight: 800, lineHeight: 1 }}>✓</span>}
                            </div>
                            <input type="checkbox" checked={checked}
                              onChange={e => { const a = vals[f.label] || []; set(f.label, e.target.checked ? [...a, o] : a.filter((x: string) => x !== o)); }}
                              style={{ display: "none" }} />
                            {o}
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* Rating */}
                  {f.type === "rating" && (
                    <div style={{ display: "flex", gap: isMobile ? 6 : 10, padding: "4px 0" }}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <span key={n} onClick={() => set(f.label, String(n))} style={{
                          fontSize: isMobile ? 32 : 38, cursor: "pointer",
                          color: Number(vals[f.label]) >= n ? t.primaryColor : `${t.inputBorder}`,
                          transition: "color .15s, transform .15s",
                          transform: Number(vals[f.label]) >= n ? "scale(1.1)" : "scale(1)",
                          display: "inline-block",
                        }}
                          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.2)")}
                          onMouseLeave={e => (e.currentTarget.style.transform = Number(vals[f.label]) >= n ? "scale(1.1)" : "scale(1)")}
                        >★</span>
                      ))}
                      {vals[f.label] && (
                        <span style={{ fontSize: 13, color: t.primaryColor, fontWeight: 700, alignSelf: "center", marginLeft: 4 }}>{vals[f.label]}/5</span>
                      )}
                    </div>
                  )}

                  {/* Scale */}
                  {f.type === "scale" && (
                    <div style={{ padding: "8px 0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: t.labelColor, opacity: .5, marginBottom: 10 }}>
                        <span>Not likely</span><span>Very likely</span>
                      </div>
                      <input type="range" min={0} max={10} value={vals[f.label] || 5}
                        onChange={e => set(f.label, e.target.value)}
                        style={{ width: "100%", accentColor: t.primaryColor, height: 6 }} />
                      <div style={{ textAlign: "center", marginTop: 8 }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          width: 44, height: 44, borderRadius: "50%",
                          background: `${t.primaryColor}15`, border: `2px solid ${t.primaryColor}30`,
                          fontSize: 20, fontWeight: 800, color: t.primaryColor,
                          fontFamily: `'${t.fontFamily}',sans-serif`,
                        }}>{vals[f.label] || 5}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}

        {/* Error */}
        {error && (
          <div style={{
            fontSize: 13, color: "#dc2626",
            background: "rgba(220,38,38,.06)", border: "1.5px solid rgba(220,38,38,.15)",
            borderRadius: t.inputRadius, padding: "12px 16px", marginBottom: 14,
            lineHeight: 1.5,
          }}>{error}</div>
        )}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={loading}
          style={{
            background: `linear-gradient(135deg, ${t.buttonColor}, ${t.buttonColor}dd)`,
            color: t.buttonTextColor,
            border: "none", borderRadius: t.buttonRadius,
            padding: isMobile ? "14px 24px" : "14px 32px",
            fontSize: responsiveFontSize, fontWeight: 700,
            cursor: loading ? "wait" : "pointer",
            fontFamily: `'${t.fontFamily}',sans-serif`,
            width: t.buttonFullWidth ? "100%" : "auto",
            marginTop: 8,
            opacity: loading ? .7 : 1,
            transition: "all .25s ease",
            boxShadow: `0 4px 14px ${t.buttonColor}30`,
            position: "relative",
            overflow: "hidden",
          }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 6px 20px ${t.buttonColor}40`; } }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 14px ${t.buttonColor}30`; }}
        >
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{ display: "inline-block", width: 16, height: 16, border: `2px solid ${t.buttonTextColor}40`, borderTopColor: t.buttonTextColor, borderRadius: "50%", animation: "spin .6s linear infinite" }} />
              Submitting…
            </span>
          ) : t.buttonText}
        </button>

        {/* Footer branding */}
        <div style={{
          textAlign: "center", marginTop: 24, paddingTop: 16,
          borderTop: `1px solid ${t.inputBorder}30`,
          fontSize: 11, color: t.labelColor, opacity: 0.35,
          letterSpacing: ".02em",
        }}>
          Powered by <span style={{ fontWeight: 700, color: t.primaryColor, opacity: 1 }}>FormFlow</span>
        </div>
      </div>

      <style>{`
        @keyframes fieldSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Responsive overrides */
        @media (max-width: 640px) {
          input, textarea, select {
            font-size: 16px !important; /* Prevents iOS zoom on focus */
          }
        }

        /* Smooth focus transitions */
        input:focus, textarea:focus, select:focus {
          outline: none;
        }

        /* Better select styling */
        select {
          -webkit-appearance: none;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 36px !important;
        }

        /* Range slider styling */
        input[type="range"] {
          -webkit-appearance: none;
          height: 6px;
          border-radius: 3px;
          outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,.15);
        }
      `}</style>
    </div>
  );
}
