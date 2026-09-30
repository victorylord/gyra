import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars.");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  try {
    const token = (req.headers.get("authorization") || "")
      .replace("Bearer ", "")
      .trim();
    if (!token) {
      return Response.json(
        { error: { code: "unauthorized", message: "Missing token." } },
        { status: 401 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const {
      data: { user },
    } = await supabaseAdmin.auth.getUser(token);
    if (!user) {
      return Response.json(
        { error: { code: "unauthorized", message: "Invalid token." } },
        { status: 401 }
      );
    }

    // Cascade will clean up chats, messages, shared_chats
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (error) {
      console.error("delete user error:", error);
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