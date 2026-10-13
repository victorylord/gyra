import { createClient } from "@supabase/supabase-js";
import {
  tickAndGet,
  snapshotToday,
  getBusiestDay,
} from "@/app/lib/simulatedStats";

export const revalidate = 0;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET() {
  try {
    // 1. Advance the simulator (daily / monthly reset handled inside)
    const sim = await tickAndGet();

    // 2. Persist today's snapshot so history stays current
    await snapshotToday(sim.total, sim.today);

    // 3. Real requests from the api_requests table (if it exists)
    let realTotal = 0;
    let realToday = 0;
    let realMonth = 0;
    let uniqueToday = 0;

    const supabase = getSupabase();
    if (supabase) {
      try {
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

        realTotal = totalRes.count ?? 0;
        realToday = todayRes.count ?? 0;
        realMonth = monthRes.count ?? 0;
        uniqueToday = new Set(
          (uniqueRes.data || []).map((r: any) => r.ip_hash)
        ).size;
      } catch (e) {
        console.error("real stats failed:", e);
      }
    }

    // 4. Busiest day across ALL history
    const busiest = await getBusiestDay();

    // 5. Today's combined number (sim + real)
    const todayCombined = sim.today + realToday;

    return Response.json({
      // Core counts
      total: sim.total + realTotal,
      today: todayCombined,
      month: sim.month + realMonth,

      // Unique visitors (approx)
      uniqueToday: uniqueToday + Math.floor(sim.today / 12),

      // Avg / Day — as requested: today's total / 1
      avgPerDay: todayCombined,

      // Busiest day — real max across all history
      busiestDay: busiest.count,
      busiestDayDate: busiest.date,

      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return Response.json(
      { error: { message: err?.message || "Failed" } },
      { status: 500 }
    );
  }
}