// app/(app)/admin/users/page.tsx
import { redirect } from "next/navigation";
import { getAllUsers, getMyProfile } from "@/lib/actions/users";
import AdminUsersClient from "@/components/admin/AdminUsersClient";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const profile = await getMyProfile();
  if (profile?.role !== "admin") redirect("/dashboard");

  const users = await getAllUsers();

  return <AdminUsersClient users={users} currentUserId={profile.id} />;
}
