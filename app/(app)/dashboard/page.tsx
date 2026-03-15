// app/(app)/dashboard/page.tsx
import { getForms } from "@/lib/actions/forms";
import { getResponses } from "@/lib/actions/responses";
import DashboardClient from "@/components/ui/DashboardClient";

export const dynamic = "force-dynamic";

export type FileUploadEntry = {
  formId: string;
  formName: string;
  fieldLabel: string;
  filePath: string;
  fileName: string;
  submittedAt: string;
  responseId: string;
  // Submitter identity extracted from form answers
  submitterName?: string;
  submitterEmail?: string;
};

/** Pull the best display name out of a response given the form's field list */
function extractSubmitterIdentity(
  fields: import("@/types").FormField[],
  data: Record<string, string | string[]>
): { name?: string; email?: string } {
  // ── Email: prefer an actual email-type field ──
  const emailField = fields.find(f => f.type === "email");
  const email = emailField
    ? (String(data[emailField.label] ?? "").trim() || undefined)
    : undefined;

  // ── Name: try several patterns in priority order ──
  const str = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v.join(" ") : String(v ?? "").trim();

  // 1. Full-name field ("name", "full name", "your name", etc.)
  const fullField = fields.find(
    f => f.type !== "file" && f.type !== "section" && /\bfull[\s_-]?name\b|^name$/i.test(f.label)
  );
  if (fullField) {
    const v = str(data[fullField.label]);
    if (v) return { name: v, email };
  }

  // 2. First + Last name combo
  const firstField = fields.find(f => /first[\s_-]?name/i.test(f.label));
  const lastField  = fields.find(f => /last[\s_-]?name/i.test(f.label));
  if (firstField || lastField) {
    const parts = [
      firstField ? str(data[firstField.label]) : "",
      lastField  ? str(data[lastField.label])  : "",
    ].filter(Boolean);
    if (parts.length) return { name: parts.join(" "), email };
  }

  // 3. Any field whose label contains "name"
  const anyName = fields.find(
    f => f.type !== "file" && f.type !== "section" && /name/i.test(f.label)
  );
  if (anyName) {
    const v = str(data[anyName.label]);
    if (v) return { name: v, email };
  }

  // 4. Fall back to email as the display name
  if (email) return { name: email, email };

  return { email };
}

export default async function DashboardPage() {
  const forms = await getForms();

  // Fetch responses per form in parallel
  const formsWithResponses = await Promise.all(
    forms.map(async (f) => {
      const responses = await getResponses(f.id);
      return { form: f, responses };
    })
  );

  const responseMap = Object.fromEntries(
    formsWithResponses.map(({ form, responses }) => [form.id, responses.length])
  );

  // Collect all file uploads with submitter identity
  const fileUploads: FileUploadEntry[] = [];

  for (const { form, responses } of formsWithResponses) {
    const fileFields = form.fields.filter(f => f.type === "file");
    if (fileFields.length === 0) continue;

    for (const response of responses) {
      const { name: submitterName, email: submitterEmail } =
        extractSubmitterIdentity(form.fields, response.data);

      for (const field of fileFields) {
        const rawVal = response.data[field.label];
        // Must be a valid storage path (contains "/") — bare filenames are import artefacts
        if (!rawVal || typeof rawVal !== "string" || rawVal.startsWith("http") || !rawVal.includes("/")) continue;

        const fileName =
          (response.data[field.label + " (filename)"] as string) ||
          rawVal.split("/").pop() ||
          "File";

        fileUploads.push({
          formId: form.id,
          formName: form.name,
          fieldLabel: field.label,
          filePath: rawVal,
          fileName,
          submittedAt: response.submitted_at,
          responseId: response.id,
          submitterName,
          submitterEmail,
        });
      }
    }
  }

  // Sort newest first, cap at 50
  fileUploads.sort((a, b) =>
    new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );

  return (
    <DashboardClient
      forms={forms}
      responseMap={responseMap}
      fileUploads={fileUploads.slice(0, 50)}
    />
  );
}
