import BuilderClient from "@/components/builder/BuilderClient";
import { DEFAULT_THEME } from "@/lib/constants";
import type { FormCategory } from "@/types";

export default async function NewBuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  const blankForm = {
    id: "",
    user_id: "",
    name: "Untitled Form",
    description: "",
    category: (category as FormCategory) || "contact",
    fields: [],
    theme: { ...DEFAULT_THEME },
    automations: [],
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return <BuilderClient initialForm={blankForm} isNew />;
}