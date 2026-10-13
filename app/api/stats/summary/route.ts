import { createClient } from "@supabase/supabase-js";
import { tickAndGet, snapshotToday } from "@/app/lib/simulatedStats";

export const revalidate = 0;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET() {
  try {
    // 1. Advance the simulator (daily + monthly reset handled inside)
    const sim = await tickAndGet();

    // 2. Persist today's snapshot so the history stays current
    await snapshotToday(sim.total, sim.today);

    // 3. Real api_requests (if any exist yet)
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

    // 4. Read the real 7-day history
    let last7DaysTotal = 0;
    let avgPerDay = 0;
    let busiestDay = 0;
    let busiestDayDate = "";

    if (supabase) {
      try {
        const { data } = await supabase
          .from("sim_daily_history")
          .select("day, count")
          .order("day", { ascending: false })
          .limit(7);

        if (data && data.length > 0) {
          last7DaysTotal = data.reduce(
            (sum: number, row: any) => sum + Number(row.count || 0),
            0
          );
          avgPerDay = Math.floor(last7DaysTotal / data.length);
        }

        // Busiest day = max across ALL history (not just last 7)
        const { data: busiest } = await supabase
          .from("sim_daily_history")
          .select("day, count")
          .order("count", { ascending: false })
          .limit(1);

        if (busiest && busiest.length > 0) {
          busiestDay = Number(busiest[0].count || 0);
          busiestDayDate = busiest[0].day || "";
        }
      } catch (e) {
        console.error("history failed:", e);
      }
    }

    // 5. This month total — sum every row whose day starts with the current YYYY-MM
    let thisMonthTotal = 0;
    if (supabase) {
      try {
        const monthKey = new Date().toISOString().slice(0, 7); // "2026-10"
        const { data } = await supabase
          .from("sim_daily_history")
          .select("count")
          .like("day", `${monthKey}%`);

        if (data) {
          thisMonthTotal = data.reduce(
            (sum: number, row: any) => sum + Number(row.count || 0),
            0
          );
        }
      } catch (e) {
        console.error("month total failed:", e);
      }
    }

    // 6. Combine simulated + real for the current day
    const todayCombined = sim.today + realToday;

    return Response.json({
      // Core
      total: sim.total + realTotal,
      today: todayCombined,
      month: thisMonthTotal + realMonth,

      // Unique visitors (approximation)
      uniqueToday: uniqueToday + Math.floor(sim.today / 12),

      // History-based
      last7Days: last7DaysTotal,
      avgPerDay,
      busiestDay,
      busiestDayDate,

      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return Response.json(
      { error: { message: err?.message || "Failed" } },
      { status: 500 }
    );
  }
}