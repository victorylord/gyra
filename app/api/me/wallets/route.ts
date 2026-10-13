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
    if (!token) {
      return Response.json(
        { error: { code: "unauthorized", message: "Missing token." } },
        { status: 401 }
      );
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return Response.json(
        { error: { code: "unauthorized", message: "Invalid token." } },
        { status: 401 }
      );
    }

    const admin = getAdmin();
    const { data } = await admin
      .from("subscriptions")
      .select("credits_usd, media_credits_usd, network_credits_usd")
      .eq("user_id", user.id)
      .maybeSingle();

    return Response.json({
      ai: Number(data?.credits_usd || 0),
      media: Number(data?.media_credits_usd || 0),
      network: Number(data?.network_credits_usd || 0),
      utilities: 0,
    });
  } catch (err: any) {
    return Response.json(
      { error: { code: "internal_error", message: err?.message } },
      { status: 500 }
    );
  }
}