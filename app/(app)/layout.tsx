// app/(app)/layout.tsx
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/actions/users";
import Sidebar from "@/components/ui/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getMyProfile();

  return (
    <div className="app-shell">
      <Sidebar userEmail={user.email ?? ""} userRole={profile?.role ?? "viewer"} />
      <main className="app-main">
        {children}
      </main>
      <style>{`
        .app-shell { display: flex; min-height: 100vh; }
        .app-main { flex: 1; overflow: auto; min-width: 0; }
        @media (max-width: 767px) {
          .app-main { padding-top: 52px; }
        }
      `}</style>
    </div>
  );
}
