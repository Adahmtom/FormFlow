// lib/actions/responses.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import type { Response } from "@/types";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ── Get all responses for a form (any authenticated user in workspace) ──
export async function getResponses(formId: string): Promise<Response[]> {
  const service = getServiceClient();

  const { data, error } = await service
    .from("responses")
    .select("*")
    .eq("form_id", formId)
    .order("submitted_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Response[];
}

// ── Submit a response (public, no auth required) ──
export async function submitResponse(
  formId: string,
  responseData: Record<string, string | string[]>,
  meta?: { ipAddress?: string; userAgent?: string }
): Promise<Response> {
  const service = getServiceClient();

  const { data, error } = await service
    .from("responses")
    .insert({
      form_id: formId,
      data: responseData,
      ip_address: meta?.ipAddress ?? null,
      user_agent: meta?.userAgent ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/forms/${formId}/responses`);
  return data as Response;
}

// ── Update response data fields (admin use: remove a file field, etc.) ──
export async function updateResponseData(
  responseId: string,
  data: Record<string, string | string[]>
): Promise<void> {
  const service = getServiceClient();
  const { error } = await service
    .from("responses")
    .update({ data })
    .eq("id", responseId);
  if (error) throw new Error(error.message);
  revalidatePath("/uploads");
  revalidatePath("/dashboard");
}

// ── Get response stats for a form ──
export async function getResponseStats(formId: string) {
  const service = getServiceClient();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart  = new Date(Date.now() - 7 * 86400000).toISOString();

  const [total, today, week] = await Promise.all([
    service.from("responses").select("id", { count: "exact", head: true }).eq("form_id", formId),
    service.from("responses").select("id", { count: "exact", head: true }).eq("form_id", formId).gte("submitted_at", todayStart),
    service.from("responses").select("id", { count: "exact", head: true }).eq("form_id", formId).gte("submitted_at", weekStart),
  ]);

  return {
    total:   total.count  ?? 0,
    today:   today.count  ?? 0,
    thisWeek: week.count  ?? 0,
  };
}
