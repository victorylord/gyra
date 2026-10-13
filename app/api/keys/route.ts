import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import { getUserFromToken } from "@/app/lib/subscription";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env.");
  return createClient(url, key, { auth: { persistSession: false } });
}

const VALID_CATEGORIES = ["ai", "media", "network", "utilities"];

const KEY_PREFIXES: Record<string, string> = {
  ai: "gyra_",
  media: "gyramedia_",
  network: "gyranet_",
  utilities: "gyrautils_",
};

function generateKey(category: string): string {
  const prefix = KEY_PREFIXES[category] || "gyra_";
  const random = randomBytes(30).toString("base64url").replace(/[-_]/g, "").slice(0, 40);
  return prefix + random;
}

export async function GET(req: Request) {
  try {
    const token = (req.headers.get("authorization") || "")
      .replace("Bearer ", "")
      .trim();
    if (!token) return unauthorized();

    const user = await getUserFromToken(token);
    if (!user) return unauthorized();

    const url = new URL(req.url);
    const categoryFilter = url.searchParams.get("category");

    const admin = getAdmin();
    let query = admin
      .from("api_keys")
      .select("id, name, key, category, active, created_at, last_used, request_count")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (categoryFilter && VALID_CATEGORIES.includes(categoryFilter)) {
      query = query.eq("category", categoryFilter);
    }

    const { data, error } = await query;

    if (error) {
      return Response.json(
        { error: { code: "fetch_failed", message: error.message } },
        { status: 500 }
      );
    }

    const masked = (data || []).map((k: any) => ({
      id: k.id,
      name: k.name,
      category: k.category || "ai",
      keyPreview: `${k.key.slice(0, 14)}••••••••${k.key.slice(-4)}`,
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
    const category = String(body?.category || "ai");

    if (!VALID_CATEGORIES.includes(category)) {
      return Response.json(
        {
          error: {
            code: "invalid_category",
            message: `Category must be one of: ${VALID_CATEGORIES.join(", ")}`,
          },
        },
        { status: 400 }
      );
    }

    const admin = getAdmin();

    // Cap at 10 active keys per user per category
    const { count } = await admin
      .from("api_keys")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("category", category)
      .eq("active", true);

    if ((count ?? 0) >= 10) {
      return Response.json(
        {
          error: {
            code: "too_many_keys",
            message: `You've reached the maximum of 10 active ${category} keys.`,
          },
        },
        { status: 400 }
      );
    }

    const key = generateKey(category);

    const { data, error } = await admin
      .from("api_keys")
      .insert({
        user_id: user.id,
        key,
        name,
        category,
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

    return Response.json({
      id: data.id,
      key: data.key,
      name: data.name,
      category: data.category,
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