// app/(app)/uploads/page.tsx
import { getForms } from "@/lib/actions/forms";
import { getResponses } from "@/lib/actions/responses";
import UploadsClient from "@/components/ui/UploadsClient";
import type { FileUploadEntry } from "@/app/(app)/dashboard/page";
import type { FormField } from "@/types";

export const dynamic = "force-dynamic";

function extractSubmitterIdentity(
  fields: FormField[],
  data: Record<string, string | string[]>
): { name?: string; email?: string } {
  const str = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v.join(" ") : String(v ?? "").trim();

  const emailField = fields.find(f => f.type === "email");
  const email = emailField ? (str(data[emailField.label]) || undefined) : undefined;

  const fullField = fields.find(
    f => f.type !== "file" && f.type !== "section" && /\bfull[\s_-]?name\b|^name$/i.test(f.label)
  );
  if (fullField) { const v = str(data[fullField.label]); if (v) return { name: v, email }; }

  const firstField = fields.find(f => /first[\s_-]?name/i.test(f.label));
  const lastField  = fields.find(f => /last[\s_-]?name/i.test(f.label));
  if (firstField || lastField) {
    const parts = [
      firstField ? str(data[firstField.label]) : "",
      lastField  ? str(data[lastField.label])  : "",
    ].filter(Boolean);
    if (parts.length) return { name: parts.join(" "), email };
  }

  const anyName = fields.find(f => f.type !== "file" && f.type !== "section" && /name/i.test(f.label));
  if (anyName) { const v = str(data[anyName.label]); if (v) return { name: v, email }; }

  if (email) return { name: email, email };
  return { email };
}

export default async function UploadsPage() {
  const forms = await getForms();

  const formsWithResponses = await Promise.all(
    forms.map(async (f) => {
      const responses = await getResponses(f.id);
      return { form: f, responses };
    })
  );

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

  fileUploads.sort((a, b) =>
    new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );

  return <UploadsClient forms={forms} fileUploads={fileUploads} />;
}
