import { createClient } from "@supabase/supabase-js";
import { tickAndGet } from "@/app/lib/simulatedStats";

export const revalidate = 0;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// ============================================================
// Daily history — used for Last 7 Days / Avg / Busiest
// Stored in sim_daily_history (one row per day)
// ============================================================

async function recordTodaySnapshot(total: number, today: number) {
  const supabase = getSupabase();
  if (!supabase) return;

  const day = new Date().toISOString().slice(0, 10);

  try {
    await supabase.from("sim_daily_history").upsert(
      {
        day,
        total,
        count: today,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "day" }
    );
  } catch (e) {
    console.error("daily snapshot failed:", e);
  }
}

async function getLast7Days(): Promise<{
  last7Days: number;
  avgPerDay: number;
  busiestDay: number;
  busiestDayDate: string;
}> {
  const supabase = getSupabase();
  if (!supabase) {
    return { last7Days: 0, avgPerDay: 0, busiestDay: 0, busiestDayDate: "" };
  }

  try {
    const { data } = await supabase
      .from("sim_daily_history")
      .select("day, count")
      .order("day", { ascending: false })
      .limit(7);

    if (!data || data.length === 0) {
      return { last7Days: 0, avgPerDay: 0, busiestDay: 0, busiestDayDate: "" };
    }

    const total = data.reduce((a, b: any) => a + (b.count || 0), 0);
    const avg = Math.floor(total / data.length);
    const busiest = [...data].sort(
      (a: any, b: any) => (b.count || 0) - (a.count || 0)
    )[0];

    return {
      last7Days: total,
      avgPerDay: avg,
      busiestDay: busiest?.count || 0,
      busiestDayDate: busiest?.day || "",
    };
  } catch (e) {
    console.error("last 7 days failed:", e);
    return { last7Days: 0, avgPerDay: 0, busiestDay: 0, busiestDayDate: "" };
  }
}

// ============================================================
// Main handler
// ============================================================

export async function GET() {
  try {
    // 1. Get the running simulated counters (handles daily + monthly reset)
    const sim = await tickAndGet();

    // 2. Persist today's snapshot for Last 7 Days / Avg / Busiest
    await recordTodaySnapshot(sim.total, sim.today);

    // 3. Get real request counts from api_requests
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

    // 4. Compute last 7 days metrics
    const last7 = await getLast7Days();

    return Response.json({
      total: sim.total + realTotal,
      today: sim.today + realToday,
      month: sim.month + realMonth,
      uniqueToday: uniqueToday + Math.floor(sim.today / 12),
      last7Days: last7.last7Days,
      avgPerDay: last7.avgPerDay,
      busiestDay: last7.busiestDay,
      busiestDayDate: last7.busiestDayDate,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return Response.json(
      { error: { message: err?.message || "Failed" } },
      { status: 500 }
    );
  }
}