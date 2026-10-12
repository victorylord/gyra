import { createClient } from "@supabase/supabase-js";
import { getUserFromToken } from "@/app/lib/subscription";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env.");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = (req.headers.get("authorization") || "")
      .replace("Bearer ", "")
      .trim();
    if (!token) return unauthorized();

    const user = await getUserFromToken(token);
    if (!user) return unauthorized();

    const admin = getAdmin();

    // Verify ownership before deleting
    const { data: existing } = await admin
      .from("api_keys")
      .select("id, user_id")
      .eq("id", id)
      .maybeSingle();

    if (!existing || existing.user_id !== user.id) {
      return Response.json(
        { error: { code: "not_found", message: "Key not found." } },
        { status: 404 }
      );
    }

    const { error } = await admin
      .from("api_keys")
      .delete()
      .eq("id", id);

    if (error) {
      return Response.json(
        { error: { code: "delete_failed", message: error.message } },
        { status: 500 }
      );
    }

    return Response.json({ ok: true });
  } catch (err: any) {
    return Response.json(
      { error: { code: "internal_error", message: err?.message } },
      { status: 500 }
    );
  }
}

function unauthorized() {
  return Response.json(
    { error: { code: "unauthorized", message: "Sign in required." } },
    { status: 401 }
  );
}