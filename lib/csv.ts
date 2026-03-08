// lib/csv.ts
import type { Form, Response } from "@/types";

export function generateCSV(form: Form, responses: Response[]): string {
  const dataFields = form.fields.filter((f) => f.type !== "section");
  const headers = ["#", "Submitted At", ...dataFields.map((f) => f.label)];

  const rows = responses.map((r, i) => [
    i + 1,
    new Date(r.submitted_at).toLocaleString(),
    ...dataFields.map((f) => {
      const v = r.data[f.label];
      return Array.isArray(v) ? v.join("; ") : v ?? "";
    }),
  ]);

  return [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");
}

export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
