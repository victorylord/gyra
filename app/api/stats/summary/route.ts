import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars.");
  return createClient(url, key, { auth: { persistSession: false } });
}

export const revalidate = 0;

export async function GET() {
  try {
    const supabase = getSupabase();

    const now = new Date();
    const startOfTodayUTC = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    ).toISOString();

    const startOfMonthUTC = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
    ).toISOString();

    const [totalRes, todayRes, monthRes, uniqueRes] = await Promise.all([
      supabase
        .from("api_requests")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("api_requests")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfTodayUTC),
      supabase
        .from("api_requests")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfMonthUTC),
      supabase
        .from("api_requests")
        .select("ip_hash")
        .gte("created_at", startOfTodayUTC)
        .limit(10000),
    ]);

    const uniqueToday = new Set(
      (uniqueRes.data || []).map((r: any) => r.ip_hash)
    ).size;

    return Response.json({
      total: totalRes.count ?? 0,
      today: todayRes.count ?? 0,
      month: monthRes.count ?? 0,
      uniqueToday,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return Response.json(
      { error: { message: err?.message || "Failed" } },
      { status: 500 }
    );
  }
}