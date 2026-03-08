// lib/actions/upload.ts
"use server";

import { createClient } from "@supabase/supabase-js";

const BUCKET_NAME = "Form Upload";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Generate a signed URL for a private file (5 min expiry)
export async function getSignedFileUrl(filePath: string): Promise<string | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, 300);

  if (error) {
    console.error("Signed URL error:", error);
    return null;
  }
  return data.signedUrl;
}

// Delete a file from storage
export async function deleteFile(filePath: string): Promise<void> {
  const supabase = getServiceClient();
  await supabase.storage.from(BUCKET_NAME).remove([filePath]);
}
