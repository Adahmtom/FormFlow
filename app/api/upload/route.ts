// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BUCKET_NAME = "Form Upload";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Use service role client for storage operations (bypasses RLS)
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const formId = formData.get("formId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!formId) {
      return NextResponse.json({ error: "No form ID provided" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    // Validate file type — block executables and scripts
    const dangerousTypes = [
      ".exe", ".bat", ".cmd", ".sh", ".ps1", ".msi", ".dll", ".com",
      ".scr", ".vbs", ".js", ".jar", ".py", ".rb", ".php", ".html", ".htm",
    ];
    const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "");
    if (dangerousTypes.includes(ext)) {
      return NextResponse.json({ error: "File type not allowed for security reasons" }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Generate unique path with sanitized filename
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${formId}/${timestamp}_${safeName}`;

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
    }

    // Return the storage path (NOT a public URL) — we'll generate signed URLs on demand
    return NextResponse.json({
      path: data.path,
      name: file.name,
    });
  } catch (err: any) {
    console.error("Upload route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
