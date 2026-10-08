import { createClient } from "@supabase/supabase-js";
import { getUserFromToken, getSubscription } from "@/app/lib/subscription";

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

    const sub = await getSubscription(user.id);
    const admin = getAdmin();

    const { data: tx } = await admin
      .from("credit_transactions")
      .select("id, amount_usd, type, description, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    return Response.json({
      balance: sub.creditsUsd,
      transactions: tx || [],
    });
  } catch (err: any) {
    return Response.json(
      { error: { code: "internal_error", message: err?.message } },
      { status: 500 }
    );
  }
}