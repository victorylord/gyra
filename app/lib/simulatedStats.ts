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
  last_tick_at: string;
};

/**
 * Reads the current stats row from Supabase.
 * If enough time has passed, calculates how many ticks should have
 * fired and applies them atomically in one update.
 */
export async function tickAndGet(): Promise<SimRow> {
  const admin = getAdmin();
  const fallback: SimRow = {
    total: 1_108_864,
    today: 23_030,
    month: 688_800,
    last_tick_at: new Date().toISOString(),
  };

  if (!admin) return fallback;

  try {
    const { data, error } = await admin
      .from("sim_stats")
      .select("total, today, month, last_tick_at")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) return fallback;

    const now = Date.now();
    const lastTick = new Date(data.last_tick_at).getTime();
    const elapsed = now - lastTick;
    const ticks = Math.floor(elapsed / TICK_INTERVAL_MS);

    if (ticks <= 0) return data as SimRow;

    // Calculate total accumulated increments across missed ticks
    let totalDelta = 0;
    for (let i = 0; i < ticks; i++) {
      totalDelta += rand(MIN_TICK, MAX_TICK);
    }

    // Cap how much can accumulate at once (prevents huge jumps if server slept for days)
    const MAX_JUMP = 500;
    totalDelta = Math.min(totalDelta, MAX_JUMP);

    const nextRow: SimRow = {
      total: Number(data.total) + totalDelta,
      today: Number(data.today) + totalDelta,
      month: Number(data.month) + totalDelta,
      last_tick_at: new Date(
        lastTick + ticks * TICK_INTERVAL_MS
      ).toISOString(),
    };

    // Write back
    const { error: updateErr } = await admin
      .from("sim_stats")
      .update({
        total: nextRow.total,
        today: nextRow.today,
        month: nextRow.month,
        last_tick_at: nextRow.last_tick_at,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    if (updateErr) {
      console.error("sim_stats update failed:", updateErr);
      return data as SimRow;
    }

    return nextRow;
  } catch (e) {
    console.error("sim_stats error:", e);
    return fallback;
  }
}

// ============================================================
// Endpoints derived from the current "today" total
// ============================================================

export function deriveEndpoints(
  todayTotal: number,
  limit = 10
): { endpoint: string; count: number }[] {
  const results: { endpoint: string; count: number }[] = [];
  let allocated = 0;

  for (let i = 0; i < ENDPOINT_WEIGHTS.length; i++) {
    const ep = ENDPOINT_WEIGHTS[i];
    const isLast = i === ENDPOINT_WEIGHTS.length - 1;

    // Use weight to split, with a small deterministic jitter based on the total
    // so it stays consistent between refreshes
    const jitter = ((todayTotal * (i + 7)) % 100) / 1000; // 0..0.099
    const pct = ep.weight / 100 + (jitter - 0.05) * 0.02;

    const share = isLast
      ? Math.max(0, todayTotal - allocated)
      : Math.floor(todayTotal * pct);

    results.push({ endpoint: ep.endpoint, count: share });
    allocated += share;
    if (allocated >= todayTotal) break;
  }

  // Fix rounding
  const sum = results.reduce((a, b) => a + b.count, 0);
  const diff = todayTotal - sum;
  if (diff !== 0 && results.length > 0) {
    results[0].count += diff;
  }

  results.sort((a, b) => b.count - a.count);
  return results.slice(0, limit);
}