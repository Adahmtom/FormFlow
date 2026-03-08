// lib/actions/forms.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_THEME } from "@/lib/constants";
import type { Form, FormField, FormTheme, FormCategory, AutomationRule } from "@/types";

// Service role client to bypass RLS for shared workspace reads
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Helper to verify user is authenticated
async function requireAuth() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

// Helper to get user role
async function getUserRole(userId: string): Promise<string> {
  const service = getServiceClient();
  const { data } = await service
    .from("user_profiles")
    .select("role")
    .eq("id", userId)
    .single();
  return data?.role ?? "viewer";
}

// ── Get ALL forms in the workspace (any authenticated user) ──
export async function getForms(): Promise<Form[]> {
  const { user } = await requireAuth();

  const service = getServiceClient();
  const { data, error } = await service
    .from("forms")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Form[];
}

// ── Get single form by ID (any authenticated user) ──
export async function getForm(id: string): Promise<Form | null> {
  const service = getServiceClient();
  const { data, error } = await service
    .from("forms")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Form;
}

// ── Get published form for public submission (no auth required) ──
export async function getPublicForm(id: string): Promise<Form | null> {
  const service = getServiceClient();
  const { data, error } = await service
    .from("forms")
    .select("*")
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (error) return null;
  return data as Form;
}

// ── Create new form (admin/editor only) ──
export async function createForm(input: {
  name: string;
  description?: string;
  category: FormCategory;
  fields?: FormField[];
  automations?: AutomationRule[];
  theme?: Partial<FormTheme>;
}): Promise<Form> {
  const { user } = await requireAuth();
  const role = await getUserRole(user.id);

  if (!["admin", "editor"].includes(role)) {
    throw new Error("You don't have permission to create forms");
  }

  const service = getServiceClient();
  const { data, error } = await service
    .from("forms")
    .insert({
      user_id: user.id,
      name: input.name,
      description: input.description ?? "",
      category: input.category,
      fields: input.fields ?? [],
      automations: input.automations ?? [],
      theme: { ...DEFAULT_THEME, ...input.theme },
      is_published: true,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/forms");
  return data as Form;
}

// ── Update existing form (admin/editor only) ──
export async function updateForm(
  id: string,
  updates: Partial<Pick<Form, "name" | "description" | "category" | "fields" | "theme" | "is_published" | "automations">>
): Promise<Form> {
  const { user } = await requireAuth();
  const role = await getUserRole(user.id);

  if (!["admin", "editor"].includes(role)) {
    throw new Error("You don't have permission to edit forms");
  }

  const service = getServiceClient();
  const { data, error } = await service
    .from("forms")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/forms");
  revalidatePath(`/builder/${id}`);
  return data as Form;
}

// ── Delete form (admin only) ──
export async function deleteForm(id: string): Promise<void> {
  const { user } = await requireAuth();
  const role = await getUserRole(user.id);

  if (role !== "admin") {
    throw new Error("Only admins can delete forms");
  }

  const service = getServiceClient();
  const { error } = await service
    .from("forms")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/forms");
}

// ── Toggle published state (admin/editor) ──
export async function togglePublished(id: string, published: boolean): Promise<void> {
  await updateForm(id, { is_published: published });
}
