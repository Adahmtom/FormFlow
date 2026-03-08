// app/api/file/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const BUCKET_NAME = "Form Upload";
const SIGNED_URL_EXPIRY = 300; // 5 minutes

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(request: NextRequest) {
  try {
    const filePath = request.nextUrl.searchParams.get("path");
    if (!filePath) {
      return NextResponse.json({ error: "No file path provided" }, { status: 400 });
    }

    // Verify the user is authenticated and has permission
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check user role — only admin, editor, viewer can access files
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "editor", "viewer"].includes(profile.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Generate a temporary signed URL using service role
    const serviceClient = getServiceClient();
    const { data, error } = await serviceClient.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, SIGNED_URL_EXPIRY);

    if (error) {
      console.error("Signed URL error:", error);
      return NextResponse.json({ error: "Failed to generate download link" }, { status: 500 });
    }

    return NextResponse.json({ url: data.signedUrl });
  } catch (err: any) {
    console.error("File route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
