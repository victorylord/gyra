import { createClient } from "@supabase/supabase-js";

const MIN_TICK = 5;
const MAX_TICK = 20;
const TICK_INTERVAL_MS = 8_000;
const MAX_JUMP = 500;

const ENDPOINT_WEIGHTS: { endpoint: string; weight: number }[] = [
  { endpoint: "/api/v1/chat", weight: 24.3 },
  { endpoint: "/api/chat", weight: 21.3 },
  { endpoint: "/api/v1/video/generate", weight: 17.0 },
  { endpoint: "/api/v1/voice", weight: 15.2 },
  { endpoint: "/api/v1/transcribe", weight: 12.9 },
  { endpoint: "/api/v1/credits", weight: 9.3 },
];

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthUTC(): string {
  return new Date().toISOString().slice(0, 7);
}

export type SimRow = {
  total: number;
  today: number;
  month: number;
  today_date: string;
  month_key: string;
  last_tick_at: string;
};

// ============================================================
// Ticks the simulator forward and handles daily/monthly resets
// ============================================================
export async function tickAndGet(): Promise<SimRow> {
  const admin = getAdmin();
  const nowDay = todayUTC();
  const nowMonth = monthUTC();

  const fallback: SimRow = {
    total: 908_864,
    today: 0,
    month: 0,
    today_date: nowDay,
    month_key: nowMonth,
    last_tick_at: new Date().toISOString(),
  };

  if (!admin) return fallback;

  try {
    const { data, error } = await admin
      .from("sim_stats")
      .select(
        "total, today, month, today_date, month_key, last_tick_at"
      )
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) return fallback;

    const row = data as SimRow;

    // Daily reset
    let today = Number(row.today);
    if (row.today_date !== nowDay) {
      today = 0;
    }

    // Monthly reset
    let month = Number(row.month);
    if (row.month_key !== nowMonth) {
      month = 0;
    }

    // Tick forward based on elapsed time
    const lastTick = new Date(row.last_tick_at).getTime();
    const elapsed = Date.now() - lastTick;
    const ticks = Math.floor(elapsed / TICK_INTERVAL_MS);

    let total = Number(row.total);

    if (ticks > 0) {
      let delta = 0;
      for (let i = 0; i < ticks; i++) {
        delta += rand(MIN_TICK, MAX_TICK);
      }
      delta = Math.min(delta, MAX_JUMP);

      total += delta;
      today += delta;
      month += delta;
    }

    const next: SimRow = {
      total,
      today,
      month,
      today_date: nowDay,
      month_key: nowMonth,
      last_tick_at: new Date().toISOString(),
    };

    await admin
      .from("sim_stats")
      .update({
        total: next.total,
        today: next.today,
        month: next.month,
        today_date: next.today_date,
        month_key: next.month_key,
        last_tick_at: next.last_tick_at,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    return next;
  } catch (e) {
    console.error("sim_stats error:", e);
    return fallback;
  }
}

// ============================================================
// Daily snapshot — call once per summary read
// ============================================================
export async function snapshotToday(total: number, today: number) {
  const admin = getAdmin();
  if (!admin) return;

  const day = todayUTC();

  try {
    await admin.from("sim_daily_history").upsert(
      {
        day,
        total,
        count: today,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "day" }
    );
  } catch (e) {
    console.error("snapshot failed:", e);
  }
}

// ============================================================
// Real historical reads
// ============================================================

// Last 7 calendar days of daily totals
export async function getLast7Days(): Promise<{
  total: number;
  avgPerDay: number;
  busiestDay: number;
  busiestDayDate: string;
}> {
  const admin = getAdmin();
  if (!admin) {
    return { total: 0, avgPerDay: 0, busiestDay: 0, busiestDayDate: "" };
  }

  try {
    const { data } = await admin
      .from("sim_daily_history")
      .select("day, count")
      .order("day", { ascending: false })
      .limit(7);

    if (!data || data.length === 0) {
      return { total: 0, avgPerDay: 0, busiestDay: 0, busiestDayDate: "" };
    }

    const total = data.reduce((a, b: any) => a + Number(b.count || 0), 0);
    const avg = Math.floor(total / data.length);
    const busiest = [...data].sort(
      (a: any, b: any) => Number(b.count || 0) - Number(a.count || 0)
    )[0];

    return {
      total,
      avgPerDay: avg,
      busiestDay: Number(busiest?.count || 0),
      busiestDayDate: busiest?.day || "",
    };
  } catch (e) {
    console.error("last 7 days failed:", e);
    return { total: 0, avgPerDay: 0, busiestDay: 0, busiestDayDate: "" };
  }
}

// Busiest day of ALL TIME
export async function getBusiestDay(): Promise<{
  count: number;
  date: string;
}> {
  const admin = getAdmin();
  if (!admin) return { count: 0, date: "" };

  try {
    const { data } = await admin
      .from("sim_daily_history")
      .select("day, count")
      .order("count", { ascending: false })
      .limit(1);

    if (!data || data.length === 0) return { count: 0, date: "" };

    return {
      count: Number(data[0].count || 0),
      date: data[0].day || "",
    };
  } catch (e) {
    console.error("busiest day failed:", e);
    return { count: 0, date: "" };
  }
}

// Deterministic split of today's total across endpoints
export function deriveEndpoints(
  todayTotal: number,
  limit = 10
): { endpoint: string; count: number }[] {
  const results: { endpoint: string; count: number }[] = [];
  let allocated = 0;

  for (let i = 0; i < ENDPOINT_WEIGHTS.length; i++) {
    const ep = ENDPOINT_WEIGHTS[i];
    const isLast = i === ENDPOINT_WEIGHTS.length - 1;

    const jitter = ((todayTotal * (i + 7)) % 100) / 1000;
    const pct = ep.weight / 100 + (jitter - 0.05) * 0.02;

    const share = isLast
      ? Math.max(0, todayTotal - allocated)
      : Math.floor(todayTotal * pct);

    results.push({ endpoint: ep.endpoint, count: share });
    allocated += share;
    if (allocated >= todayTotal) break;
  }

  const sum = results.reduce((a, b) => a + b.count, 0);
  const diff = todayTotal - sum;
  if (diff !== 0 && results.length > 0) {
    results[0].count += diff;
  }

  results.sort((a, b) => b.count - a.count);
  return results.slice(0, limit);
}