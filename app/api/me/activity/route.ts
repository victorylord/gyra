import { createClient } from "@supabase/supabase-js";
import { getUserFromToken } from "@/app/lib/subscription";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env.");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(req: Request) {
  try {
    const token = (req.headers.get("authorization") || "")
      .replace("Bearer ", "")
      .trim();
    if (!token) return unauthorized();

    const user = await getUserFromToken(token);
    if (!user) return unauthorized();

    const admin = getAdmin();

    // Media activity
    const { data: media } = await admin
      .from("media_requests")
      .select("id, endpoint, status_code, cost_usd, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    const combined = (media || []).map((m: any) => ({
      id: m.id,
      endpoint: m.endpoint,
      category: "media",
      status_code: m.status_code,
      cost_usd: Number(m.cost_usd || 0),
      created_at: m.created_at,
    }));

    return Response.json({ activity: combined });
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