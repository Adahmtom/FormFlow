import { notFound } from "next/navigation";
import { getForm } from "@/lib/actions/forms";
import { getResponses } from "@/lib/actions/responses";
import ResponsesClient from "@/components/responses/ResponsesClient";

export const dynamic = "force-dynamic";

export default async function ResponsesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const form = await getForm(id);
  if (!form) notFound();

  const responses = await getResponses(id);

  return <ResponsesClient form={form} responses={responses} />;
}