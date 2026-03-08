// app/(app)/forms/page.tsx
import { getForms } from "@/lib/actions/forms";
import { getResponses } from "@/lib/actions/responses";
import FormsListClient from "@/components/ui/FormsListClient";

export const dynamic = "force-dynamic";

export default async function FormsPage() {
  const forms = await getForms();
  const responseCounts = await Promise.all(
    forms.map(async (f) => {
      const rs = await getResponses(f.id);
      return { formId: f.id, count: rs.length };
    })
  );
  const responseMap = Object.fromEntries(responseCounts.map(r => [r.formId, r.count]));

  return <FormsListClient forms={forms} responseMap={responseMap} />;
}
