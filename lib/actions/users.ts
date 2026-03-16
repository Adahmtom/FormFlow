// lib/actions/users.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserProfile, UserRole } from "@/types";

// ── Get current user's profile ──
export async function getMyProfile(): Promise<UserProfile | null> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data as UserProfile | null;
}

// ── Get all users (admin only) ──
export async function getAllUsers(): Promise<UserProfile[]> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getMyProfile();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as UserProfile[];
}

// ── Invite a new user (admin creates auth user + profile) ──
export async function inviteUser(input: {
  email: string;
  full_name: string;
  role: UserRole;
  password: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const profile = await getMyProfile();
  if (profile?.role !== "admin") return { success: false, error: "Not authorized" };

  // Use service role to create user without email verification
  const { createClient: createServiceClient } = await import("@supabase/supabase-js");
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Create auth user
  const { data: newUser, error: authError } = await serviceClient.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.full_name },
  });

  if (authError) return { success: false, error: authError.message };

  // Update their profile with role and name (trigger creates it)
  const { error: profileError } = await serviceClient
    .from("user_profiles")
    .update({
      full_name: input.full_name,
      role: input.role,
      invited_by: user.id,
    })
    .eq("id", newUser.user!.id);

  if (profileError) return { success: false, error: profileError.message };

  revalidatePath("/admin/users");
  return { success: true };
}

// ── Helper: check if a user is the workspace owner (invited_by === null) ──
async function isWorkspaceOwner(userId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("user_profiles")
    .select("invited_by")
    .eq("id", userId)
    .single();
  return data?.invited_by === null;
}

// ── Update user role (admin only) ──
export async function updateUserRole(userId: string, role: UserRole): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const profile = await getMyProfile();
  if (profile?.role !== "admin") redirect("/dashboard");

  // Protect the workspace owner — only the owner themselves can change their own role
  const targetIsOwner = await isWorkspaceOwner(userId);
  if (targetIsOwner && profile.id !== userId)
    throw new Error("The workspace owner's role cannot be changed by other admins.");

  const { error } = await supabase
    .from("user_profiles")
    .update({ role })
    .eq("id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
}

// ── Toggle user active status ──
export async function toggleUserActive(userId: string, isActive: boolean): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const profile = await getMyProfile();
  if (profile?.role !== "admin") redirect("/dashboard");

  // Protect the workspace owner
  const targetIsOwner = await isWorkspaceOwner(userId);
  if (targetIsOwner && profile.id !== userId)
    throw new Error("The workspace owner cannot be deactivated by other admins.");

  const { error } = await supabase
    .from("user_profiles")
    .update({ is_active: isActive })
    .eq("id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
}

// ── Delete user (admin only) ──
export async function deleteUser(userId: string): Promise<void> {
  const profile = await getMyProfile();
  if (profile?.role !== "admin") redirect("/dashboard");

  // Protect the workspace owner — cannot be deleted
  const targetIsOwner = await isWorkspaceOwner(userId);
  if (targetIsOwner)
    throw new Error("The workspace owner cannot be deleted.");

  const { createClient: createServiceClient } = await import("@supabase/supabase-js");
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error } = await serviceClient.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
}
