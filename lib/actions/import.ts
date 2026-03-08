// lib/actions/import.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { getMyProfile } from "@/lib/actions/users";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function importResponses(
  formId: string,
  rows: Record<string, string | string[]>[]
): Promise<{ success: boolean; imported: number; errors: string[] }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Only admin/editor can import
  const profile = await getMyProfile();
  if (!profile || !["admin", "editor"].includes(profile.role)) {
    return { success: false, imported: 0, errors: ["Not authorized to import data"] };
  }

  const service = getServiceClient();

  // Verify form exists
  const { data: form, error: formError } = await service
    .from("forms")
    .select("id")
    .eq("id", formId)
    .single();

  if (formError || !form) {
    return { success: false, imported: 0, errors: ["Form not found"] };
  }

  const errors: string[] = [];
  let imported = 0;

  // Insert in batches of 50
  const batchSize = 50;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);

    const insertData = batch.map((row, idx) => {
      const cleanData: Record<string, string | string[]> = {};
      for (const [key, val] of Object.entries(row)) {
        const trimmedKey = key.trim();
        if (!trimmedKey) continue;
        if (Array.isArray(val)) {
          cleanData[trimmedKey] = val.map(v => String(v).trim());
        } else {
          cleanData[trimmedKey] = String(val ?? "").trim();
        }
      }

      return {
        form_id: formId,
        data: cleanData,
        ip_address: "imported",
        user_agent: `FormFlow Import (row ${i + idx + 1})`,
      };
    });

    const { error: insertError, data: inserted } = await service
      .from("responses")
      .insert(insertData)
      .select("id");

    if (insertError) {
      errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${insertError.message}`);
    } else {
      imported += inserted?.length ?? 0;
    }
  }

  revalidatePath(`/forms/${formId}/responses`);
  revalidatePath("/dashboard");
  revalidatePath("/forms");

  return {
    success: errors.length === 0,
    imported,
    errors,
  };
}
