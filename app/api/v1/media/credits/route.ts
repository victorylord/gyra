import { createClient } from "@supabase/supabase-js";
import { getUserFromToken } from "@/app/lib/subscription";
import { getMediaCredits } from "@/app/lib/mediaWallet";

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

    const balance = await getMediaCredits(user.id);

    const admin = getAdmin();
    const { data: tx } = await admin
      .from("credit_transactions")
      .select("id, amount_usd, type, description, created_at")
      .eq("user_id", user.id)
      .in("type", ["media_spend", "media_topup"])
      .order("created_at", { ascending: false })
      .limit(50);

    return Response.json({ balance, transactions: tx || [] });
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