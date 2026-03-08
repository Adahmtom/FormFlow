import { notFound } from "next/navigation";
import { getForm } from "@/lib/actions/forms";
import BuilderClient from "@/components/builder/BuilderClient";
import { DEFAULT_THEME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function EditBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const form = await getForm(id);
  if (!form) notFound();

  return <BuilderClient initialForm={{ ...form, theme: { ...DEFAULT_THEME, ...form.theme }, automations: form.automations ?? [] }} isNew={false} />;
}