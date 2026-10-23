import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase env vars.");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const shareId = params.id;
    if (!shareId) {
      return Response.json({ error: "Share ID required" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: share, error: shareErr } = await supabaseAdmin
      .from("shared_chats")
      .select(`
        id,
        revoked,
        chats (
          id,
          title
        )
      `)
      .eq("id", shareId)
      .single();

    if (shareErr || !share) {
      return Response.json({ error: "Shared chat not found" }, { status: 404 });
    }

    if (share.revoked) {
      return Response.json({ error: "This link has been revoked" }, { status: 403 });
    }

    const chat: any = Array.isArray(share.chats) ? share.chats[0] : share.chats;
    if (!chat) {
      return Response.json({ error: "Chat data missing" }, { status: 404 });
    }

    const { data: messages, error: msgErr } = await supabaseAdmin
      .from("messages")
      .select("role, content, created_at")
      .eq("chat_id", chat.id)
      .order("created_at", { ascending: true });

    if (msgErr) {
      throw msgErr;
    }

    return Response.json({
      title: chat.title || "Shared Conversation",
      messages: messages || [],
    });
  } catch (err: any) {
    console.error("Share fetch error:", err);
    return Response.json(
      { error: { code: "internal_error", message: err?.message } },
      { status: 500 }
    );
  }
}