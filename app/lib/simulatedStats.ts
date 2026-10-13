import { createClient } from "@supabase/supabase-js";

const MIN_TICK = 5;
const MAX_TICK = 20;
const TICK_INTERVAL_MS = 8_000;

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

type SimRow = {
  total: number;
  today: number;
  month: number;
  today_date: string;   // "2026-10-13"
  month_key: string;    // "2026-10"
  last_tick_at: string;
};

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthUTC(): string {
  return new Date().toISOString().slice(0, 7);
}

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
      .select("total, today, month, today_date, month_key, last_tick_at")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) return fallback;

    const row = data as SimRow;

    // Handle daily reset
    let today = Number(row.today);
    if (row.today_date !== nowDay) {
      today = 0;
    }

    // Handle monthly reset
    let month = Number(row.month);
    if (row.month_key !== nowMonth) {
      month = 0;
    }

    // Calculate elapsed ticks since last update
    const lastTick = new Date(row.last_tick_at).getTime();
    const elapsed = Date.now() - lastTick;
    const ticks = Math.floor(elapsed / TICK_INTERVAL_MS);

    let total = Number(row.total);

    if (ticks > 0) {
      let totalDelta = 0;
      for (let i = 0; i < ticks; i++) {
        totalDelta += rand(MIN_TICK, MAX_TICK);
      }
      totalDelta = Math.min(totalDelta, 500);

      total += totalDelta;
      today += totalDelta;
      month += totalDelta;
    }

    const nextRow: SimRow = {
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
        total: nextRow.total,
        today: nextRow.today,
        month: nextRow.month,
        today_date: nextRow.today_date,
        month_key: nextRow.month_key,
        last_tick_at: nextRow.last_tick_at,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    return nextRow;
  } catch (e) {
    console.error("sim_stats error:", e);
    return fallback;
  }
}

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