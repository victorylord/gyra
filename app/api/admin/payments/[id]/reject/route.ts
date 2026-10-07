import { createClient } from "@supabase/supabase-js";
import { getUserFromToken } from "@/app/lib/subscription";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "victorylordhimself@gmail.com";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env.");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(
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
    if (!user || user.email !== ADMIN_EMAIL) return unauthorized();

    const body = await req.json().catch(() => ({}));
    const note = body?.note ? String(body.note) : null;

    const admin = getAdmin();
    await admin
      .from("payments")
      .update({
        status: "rejected",
        admin_note: note,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

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
    { error: { code: "unauthorized", message: "Admin only." } },
    { status: 401 }
  );
}