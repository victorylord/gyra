import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "crypto";
import { getUserFromToken } from "@/app/lib/subscription";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env.");
  return createClient(url, key, { auth: { persistSession: false } });
}

function generateKey(): string {
  // 32 random bytes → base64url → trim to 40 chars
  return (
    "gyra_" +
    randomBytes(30).toString("base64url").replace(/[-_]/g, "").slice(0, 40)
  );
}

// GET — list user's keys (masked)
export async function GET(req: Request) {
  try {
    const token = (req.headers.get("authorization") || "")
      .replace("Bearer ", "")
      .trim();
    if (!token) return unauthorized();

    const user = await getUserFromToken(token);
    if (!user) return unauthorized();

    const admin = getAdmin();
    const { data, error } = await admin
      .from("api_keys")
      .select("id, name, key, active, created_at, last_used, request_count")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json(
        { error: { code: "fetch_failed", message: error.message } },
        { status: 500 }
      );
    }

    // Mask the keys — never return the full key after creation
    const masked = (data || []).map((k: any) => ({
      id: k.id,
      name: k.name,
      keyPreview: `${k.key.slice(0, 12)}••••••••${k.key.slice(-4)}`,
      active: k.active,
      created_at: k.created_at,
      last_used: k.last_used,
      request_count: k.request_count || 0,
    }));

    return Response.json({ keys: masked });
  } catch (err: any) {
    return Response.json(
      { error: { code: "internal_error", message: err?.message } },
      { status: 500 }
    );
  }
}

// POST — create a new key
export async function POST(req: Request) {
  try {
    const token = (req.headers.get("authorization") || "")
      .replace("Bearer ", "")
      .trim();
    if (!token) return unauthorized();

    const user = await getUserFromToken(token);
    if (!user) return unauthorized();

    const body = await req.json().catch(() => ({}));
    const name = String(body?.name || "Default key").slice(0, 60);

    const admin = getAdmin();

    // Cap at 10 active keys per user
    const { count } = await admin
      .from("api_keys")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("active", true);

    if ((count ?? 0) >= 10) {
      return Response.json(
        {
          error: {
            code: "too_many_keys",
            message: "You've reached the maximum of 10 active API keys.",
          },
        },
        { status: 400 }
      );
    }

    const key = generateKey();

    const { data, error } = await admin
      .from("api_keys")
      .insert({
        user_id: user.id,
        key,
        name,
        active: true,
      })
      .select()
      .single();

    if (error) {
      return Response.json(
        { error: { code: "create_failed", message: error.message } },
        { status: 500 }
      );
    }

    // Return the full key ONCE — never again
    return Response.json({
      id: data.id,
      key: data.key,
      name: data.name,
      created_at: data.created_at,
    });
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