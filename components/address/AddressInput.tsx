// components/address/AddressInput.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface AddressValue {
  fullAddress: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    state_district?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  primaryColor?: string;
}

function parseNominatim(result: NominatimResult): AddressValue {
  const a = result.address;
  const street = [a.house_number, a.road].filter(Boolean).join(" ");
  const city = a.city || a.town || a.village || a.municipality || "";
  const state = a.state || a.state_district || "";
  const zip = a.postcode || "";
  const country = a.country || "";

  return {
    fullAddress: result.display_name,
    street,
    city,
    state,
    zip,
    country,
  };
}

export default function AddressInput({
  value,
  onChange,
  placeholder = "Start typing an address…",
  style = {},
  primaryColor = "#FF6B35",
}: AddressInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [parsed, setParsed] = useState<AddressValue>({
    fullAddress: "", street: "", city: "", state: "", zip: "", country: "",
  });
  const dropRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Parse existing value on mount
  useEffect(() => {
    if (value) {
      try {
        const p = JSON.parse(value);
        if (p.fullAddress) {
          setParsed(p);
          setQuery(p.fullAddress);
          setExpanded(true);
        }
      } catch {
        setQuery(value);
      }
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced search via Nominatim
  const searchAddress = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 3) { setResults([]); setShowDropdown(false); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(q)}`,
          { headers: { "Accept-Language": "en" } }
        );
        const data: NominatimResult[] = await res.json();
        setResults(data);
        setShowDropdown(data.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400); // 400ms debounce to respect Nominatim rate limits
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    searchAddress(val);
  };

  const selectResult = (result: NominatimResult) => {
    const addr = parseNominatim(result);
    setParsed(addr);
    setQuery(addr.fullAddress);
    setExpanded(true);
    setShowDropdown(false);
    onChange(JSON.stringify(addr));
  };

  const updateField = useCallback((field: keyof AddressValue, val: string) => {
    setParsed(prev => {
      const next = { ...prev, [field]: val };
      next.fullAddress = [next.street, next.city, next.state, next.zip, next.country].filter(Boolean).join(", ");
      onChange(JSON.stringify(next));
      return next;
    });
  }, [onChange]);

  const base: React.CSSProperties = {
    width: "100%",
    background: style.background || "#f9fafb",
    border: style.border || "1.5px solid #d1d5db",
    borderRadius: style.borderRadius || 8,
    color: style.color || "#1a1a2e",
    fontSize: style.fontSize || 15,
    fontFamily: style.fontFamily || "Outfit, sans-serif",
    padding: "10px 14px",
    outline: "none",
    transition: "border-color .2s",
  };

  const smallInput: React.CSSProperties = {
    ...base,
    fontSize: (typeof base.fontSize === "number" ? base.fontSize - 1 : 14),
    padding: "8px 12px",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: typeof style.color === "string" ? style.color : "#666",
    opacity: 0.7,
    marginBottom: 4,
    display: "block",
  };

  return (
    <div ref={dropRef} style={{ position: "relative" }}>
      {/* Main autocomplete input */}
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16, opacity: 0.5, pointerEvents: "none" }}>📍</span>
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
          style={{ ...base, paddingLeft: 36, paddingRight: loading ? 36 : 14 }}
        />
        {loading && (
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, opacity: 0.5 }}>⏳</span>
        )}
      </div>

      {/* Autocomplete dropdown */}
      {showDropdown && results.length > 0 && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 4px)",
          left: 0,
          right: 0,
          zIndex: 999,
          background: "#0d0d16",
          border: "1.5px solid #1e1e30",
          borderRadius: 10,
          maxHeight: 260,
          overflowY: "auto",
          boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
        }}>
          {results.map((r) => (
            <div
              key={r.place_id}
              onClick={() => selectResult(r)}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                fontSize: 13,
                color: "#ccc",
                borderBottom: "1px solid #1a1a28",
                transition: "background .15s",
                lineHeight: 1.4,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#ffffff0a")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ marginRight: 8, opacity: 0.5 }}>📍</span>
              {r.display_name}
            </div>
          ))}
          <div style={{ padding: "6px 14px", fontSize: 9, color: "#333", textAlign: "right" }}>
            Powered by OpenStreetMap
          </div>
        </div>
      )}

      {/* Expanded breakdown fields */}
      {expanded && (
        <div style={{
          marginTop: 8,
          background: typeof base.background === "string" ? base.background : "#f9fafb",
          border: typeof base.border === "string" ? base.border : "1.5px solid #d1d5db",
          borderRadius: typeof base.borderRadius === "number" ? base.borderRadius : 8,
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: primaryColor }}>Address Details</span>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              style={{ background: "none", border: "none", color: "#999", fontSize: 12, cursor: "pointer", fontFamily: "Outfit,sans-serif" }}
            >Collapse ↑</button>
          </div>
          <div>
            <span style={labelStyle}>Street</span>
            <input style={smallInput} value={parsed.street} placeholder="Street address"
              onChange={e => updateField("street", e.target.value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <span style={labelStyle}>City</span>
              <input style={smallInput} value={parsed.city} placeholder="City"
                onChange={e => updateField("city", e.target.value)} />
            </div>
            <div>
              <span style={labelStyle}>State / Province</span>
              <input style={smallInput} value={parsed.state} placeholder="State"
                onChange={e => updateField("state", e.target.value)} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <span style={labelStyle}>ZIP / Postal Code</span>
              <input style={smallInput} value={parsed.zip} placeholder="ZIP"
                onChange={e => updateField("zip", e.target.value)} />
            </div>
            <div>
              <span style={labelStyle}>Country</span>
              <input style={smallInput} value={parsed.country} placeholder="Country"
                onChange={e => updateField("country", e.target.value)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
