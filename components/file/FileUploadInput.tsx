// components/file/FileUploadInput.tsx
"use client";

import { useState, useRef } from "react";

interface FileUploadInputProps {
  value: string;
  onChange: (value: string) => void;
  formId: string;
  maxFileSize?: number;
  allowedTypes?: string[];
  style?: React.CSSProperties;
  primaryColor?: string;
}

export default function FileUploadInput({
  value,
  onChange,
  formId,
  maxFileSize = 10,
  allowedTypes,
  style = {},
  primaryColor = "#FF6B35",
}: FileUploadInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState("");
  const [fileName, setFileName]   = useState(() => {
    if (!value) return "";
    try { return JSON.parse(value).name || ""; } catch { return ""; }
  });

  const base: React.CSSProperties = {
    background: style.background || "#f9fafb",
    border: style.border || "1.5px solid #d1d5db",
    borderRadius: style.borderRadius || 8,
    color: style.color || "#1a1a2e",
    fontSize: style.fontSize || 15,
    fontFamily: style.fontFamily || "Outfit, sans-serif",
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    if (file.size > maxFileSize * 1024 * 1024) {
      setError(`File too large. Max ${maxFileSize}MB.`);
      return;
    }

    if (allowedTypes && allowedTypes.length > 0) {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!allowedTypes.some(t => t.toLowerCase() === ext)) {
        setError(`Invalid file type. Allowed: ${allowedTypes.join(", ")}`);
        return;
      }
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("formId", formId);

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();

      if (data.error) { setError(data.error); return; }

      setFileName(data.name);
      // Store path + name (NOT a public URL)
      onChange(JSON.stringify({ path: data.path, name: data.name }));
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setFileName("");
    onChange("");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      {!fileName ? (
        <label
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            padding: "20px 16px",
            background: base.background,
            border: `2px dashed ${uploading ? primaryColor : (typeof base.border === "string" ? base.border.split(" ").pop() : "#d1d5db")}`,
            borderRadius: base.borderRadius,
            cursor: uploading ? "wait" : "pointer",
            transition: "all .2s", textAlign: "center",
          }}
          onMouseEnter={e => { if (!uploading) (e.currentTarget as HTMLElement).style.borderColor = primaryColor; }}
          onMouseLeave={e => { if (!uploading) (e.currentTarget as HTMLElement).style.borderColor = typeof base.border === "string" ? base.border.split(" ").pop()! : "#d1d5db"; }}
        >
          <input ref={inputRef} type="file" onChange={handleFileChange} accept={allowedTypes?.join(",")} style={{ display: "none" }} />
          {uploading ? (
            <>
              <div style={{ fontSize: 24, animation: "spin 1s linear infinite" }}>⏳</div>
              <span style={{ fontSize: (base.fontSize as number) * 0.85, color: primaryColor, fontWeight: 600 }}>Uploading…</span>
            </>
          ) : (
            <>
              <div style={{ fontSize: 28, opacity: 0.5 }}>☁️</div>
              <span style={{ fontSize: (base.fontSize as number) * 0.85, color: typeof base.color === "string" ? base.color : "#666", fontWeight: 600 }}>Click to upload a file</span>
              <span style={{ fontSize: 11, opacity: 0.5 }}>
                Max {maxFileSize}MB{allowedTypes && allowedTypes.length > 0 && ` · ${allowedTypes.join(", ")}`}
              </span>
            </>
          )}
        </label>
      ) : (
        <div style={{
          display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
          background: base.background,
          border: `1.5px solid ${primaryColor}40`,
          borderRadius: base.borderRadius,
        }}>
          <span style={{ fontSize: 20 }}>📎</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: (base.fontSize as number) * 0.85, fontWeight: 600, color: base.color, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fileName}</span>
            <span style={{ fontSize: 11, opacity: 0.5, display: "block" }}>Uploaded securely ✓</span>
          </div>
          <button type="button" onClick={handleRemove} style={{
            background: "rgba(239,68,68,.1)", color: "#f87171", border: "1px solid rgba(239,68,68,.2)",
            borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer",
            fontFamily: "Outfit,sans-serif", flexShrink: 0,
          }}>Remove</button>
        </div>
      )}

      {error && (
        <div style={{ marginTop: 6, fontSize: 12, color: "#f87171", background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.2)", borderRadius: 6, padding: "6px 10px" }}>{error}</div>
      )}
    </div>
  );
}
