// components/phone/PhoneInput.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { COUNTRY_CODES, getDefaultCountry, type CountryCode } from "@/lib/countryCodes";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  defaultCountry?: string;
  style?: React.CSSProperties;
  primaryColor?: string;
}

export default function PhoneInput({
  value,
  onChange,
  placeholder = "Phone number",
  defaultCountry = "US",
  style = {},
  primaryColor = "#FF6B35",
}: PhoneInputProps) {
  const defaultC = COUNTRY_CODES.find(c => c.code === defaultCountry) ?? getDefaultCountry();
  const [selected, setSelected]   = useState<CountryCode>(defaultC);
  const [open,     setOpen]       = useState(false);
  const [search,   setSearch]     = useState("");
  const [numPart,  setNumPart]    = useState("");
  const dropRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false); setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = search
    ? COUNTRY_CODES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dial.includes(search)
      )
    : COUNTRY_CODES;

  const handleNumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = e.target.value.replace(/[^\d\s\-().]/g, "");
    setNumPart(num);
    onChange(`${selected.dial} ${num}`.trim());
  };

  const selectCountry = (c: CountryCode) => {
    setSelected(c);
    setOpen(false);
    setSearch("");
    onChange(`${c.dial} ${numPart}`.trim());
  };

  const base: React.CSSProperties = {
    background: style.background || "#f9fafb",
    border: style.border || "1.5px solid #d1d5db",
    borderRadius: style.borderRadius || 8,
    color: style.color || "#1a1a2e",
    fontSize: style.fontSize || 15,
    fontFamily: style.fontFamily || "Outfit, sans-serif",
  };

  return (
    <div style={{ position: "relative", display: "flex", gap: 0 }} ref={dropRef}>
      {/* Country selector button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 12px",
          background: base.background,
          border: base.border,
          borderRight: "none",
          borderRadius: `${base.borderRadius}px 0 0 ${base.borderRadius}px`,
          cursor: "pointer",
          fontSize: 14,
          fontFamily: base.fontFamily,
          color: base.color,
          flexShrink: 0,
          whiteSpace: "nowrap",
          outline: "none",
        }}
      >
        <span style={{ fontSize: 18 }}>{selected.flag}</span>
        <span style={{ fontSize: 13, color: "#666" }}>{selected.dial}</span>
        <span style={{ fontSize: 10, color: "#aaa" }}>▾</span>
      </button>

      {/* Number input */}
      <input
        type="tel"
        value={numPart}
        onChange={handleNumChange}
        placeholder={placeholder}
        style={{
          flex: 1,
          padding: "10px 14px",
          background: base.background,
          border: base.border,
          borderLeft: `1px solid ${typeof base.border === "string" ? base.border.split(" ").pop() : "#d1d5db"}`,
          borderRadius: `0 ${base.borderRadius}px ${base.borderRadius}px 0`,
          color: base.color,
          fontSize: base.fontSize,
          fontFamily: base.fontFamily,
          outline: "none",
          width: "100%",
        }}
        onFocus={e => { e.target.style.borderColor = primaryColor; (e.target.previousElementSibling as HTMLElement)!.style.borderColor = primaryColor; }}
        onBlur={e => { const borderVal = typeof base.border === "string" ? base.border.split(" ").pop()! : "#d1d5db"; e.target.style.borderColor = borderVal; }}
      />

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 4px)",
          left: 0,
          zIndex: 999,
          background: "#0d0d16",
          border: "1.5px solid #1e1e30",
          borderRadius: 10,
          width: 280,
          maxHeight: 300,
          overflowY: "auto",
          boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
        }}>
          {/* Search */}
          <div style={{ padding: "8px 10px", borderBottom: "1px solid #1e1e30", position: "sticky", top: 0, background: "#0d0d16" }}>
            <input
              autoFocus
              type="text"
              placeholder="Search country or code…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", background: "#08080f", border: "1px solid #2a2a3a", borderRadius: 7, color: "#F0EFF8", fontSize: 12, padding: "7px 10px", outline: "none", fontFamily: "Outfit, sans-serif" }}
            />
          </div>
          {filtered.map(c => (
            <div
              key={c.code}
              onClick={() => selectCountry(c)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 14px",
                cursor: "pointer",
                fontSize: 13,
                color: selected.code === c.code ? primaryColor : "#ccc",
                background: selected.code === c.code ? `${primaryColor}15` : "transparent",
                transition: "background .15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#ffffff0a")}
              onMouseLeave={e => (e.currentTarget.style.background = selected.code === c.code ? `${primaryColor}15` : "transparent")}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{c.flag}</span>
              <span style={{ flex: 1 }}>{c.name}</span>
              <span style={{ color: "#555", fontSize: 12 }}>{c.dial}</span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: "16px", textAlign: "center", color: "#444", fontSize: 13 }}>No results</div>
          )}
        </div>
      )}
    </div>
  );
}
