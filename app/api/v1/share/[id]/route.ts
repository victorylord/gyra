import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars.");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabaseAdmin = getSupabaseAdmin();

    const { data: share, error: shareErr } = await supabaseAdmin
      .from("shared_chats")
      .select("id, chat_id, revoked, created_at")
      .eq("id", id)
      .maybeSingle();

    if (shareErr || !share || share.revoked) {
      return Response.json(
        { error: { code: "not_found", message: "Share not found or revoked." } },
        { status: 404 }
      );
    }

    const { data: chat } = await supabaseAdmin
      .from("chats")
      .select("title")
      .eq("id", share.chat_id)
      .maybeSingle();

    const { data: messages } = await supabaseAdmin
      .from("messages")
      .select("role, content, created_at")
      .eq("chat_id", share.chat_id)
      .order("created_at", { ascending: true });

    return Response.json({
      id: share.id,
      title: chat?.title || "Shared chat",
      createdAt: share.created_at,
      messages: messages || [],
    });
  } catch (err: any) {
    return Response.json(
      { error: { code: "internal_error", message: err?.message } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
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

    await supabaseAdmin
      .from("shared_chats")
      .update({ revoked: true })
      .eq("id", id)
      .eq("user_id", user.id);

    return Response.json({ ok: true });
  } catch (err: any) {
    return Response.json(
      { error: { code: "internal_error", message: err?.message } },
      { status: 500 }
    );
  }
}