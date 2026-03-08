import { notFound } from "next/navigation";
import { getPublicForm } from "@/lib/actions/forms";
import PublicFormClient from "@/components/preview/PublicFormClient";

export const dynamic = "force-dynamic";

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const form = await getPublicForm(id);
  if (!form) notFound();

  return <PublicFormClient form={form} />;
}