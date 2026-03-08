// app/(app)/dashboard/page.tsx
import { getForms } from "@/lib/actions/forms";
import { getResponses } from "@/lib/actions/responses";
import DashboardClient from "@/components/ui/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const forms = await getForms();

  // Fetch response counts per form in parallel
  const responseCounts = await Promise.all(
    forms.map(async (f) => {
      const rs = await getResponses(f.id);
      return { formId: f.id, count: rs.length };
    })
  );

  const responseMap = Object.fromEntries(responseCounts.map(r => [r.formId, r.count]));

  return <DashboardClient forms={forms} responseMap={responseMap} />;
}
