import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase env vars.");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

function makeId(len = 10) {
  // URL-safe short id
  return randomBytes(len).toString("base64url").slice(0, len);
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return Response.json(
        { error: { code: "unauthorized", message: "Missing auth token." } },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const chatId = String(body?.chatId || "");
    if (!chatId) {
      return Response.json(
        { error: { code: "invalid_request", message: "chatId required." } },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Verify the caller owns the chat
    const {
      data: { user },
      error: userErr,
    } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !user) {
      return Response.json(
        { error: { code: "unauthorized", message: "Invalid token." } },
        { status: 401 }
      );
    }

    const { data: chat, error: chatErr } = await supabaseAdmin
      .from("chats")
      .select("id, user_id, title")
      .eq("id", chatId)
      .maybeSingle();

    if (chatErr || !chat) {
      return Response.json(
        { error: { code: "not_found", message: "Chat not found." } },
        { status: 404 }
      );
    }
    if (chat.user_id !== user.id) {
      return Response.json(
        { error: { code: "forbidden", message: "Not your chat." } },
        { status: 403 }
      );
    }

    // Reuse existing share if still active
    const { data: existing } = await supabaseAdmin
      .from("shared_chats")
      .select("id")
      .eq("chat_id", chatId)
      .eq("revoked", false)
      .maybeSingle();

    if (existing) {
      return Response.json({ id: existing.id });
    }

    const id = makeId(10);
    const { error: insertErr } = await supabaseAdmin
      .from("shared_chats")
      .insert([{ id, chat_id: chatId, user_id: user.id }]);

    if (insertErr) {
      console.error("share insert error:", insertErr);
      return Response.json(
        { error: { code: "insert_failed", message: insertErr.message } },
        { status: 500 }
      );
    }

    return Response.json({ id });
  } catch (err: any) {
    console.error("share create error:", err);
    return Response.json(
      { error: { code: "internal_error", message: err?.message } },
      { status: 500 }
    );
  }
}