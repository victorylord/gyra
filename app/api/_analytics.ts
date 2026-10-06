import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { getClientIP } from "./security";

let _supabase: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient | null {
  if (_supabase) return _supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _supabase = createClient(url, key, {
    auth: { persistSession: false },
  });
  return _supabase;
}

function hashIP(ip: string): string {
  return createHash("sha256").update(ip + "gyra-analytics-salt").digest("hex").slice(0, 16);
}

export type LogOptions = {
  endpoint: string;
  method?: string;
  statusCode?: number;
  provider?: string;
  latencyMs?: number;
  req?: Request;
};

/**
 * Fire-and-forget request logger. Never blocks the response.
 * Call this AFTER you've sent your response (or don't await it).
 */
export function logRequest(opts: LogOptions): void {
  const {
    endpoint,
    method = "POST",
    statusCode = 200,
    provider,
    latencyMs,
    req,
  } = opts;

  const ip = req ? getClientIP(req) : "unknown";
  const ua = req?.headers.get("user-agent") || "";

  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  // Fire and forget — do NOT await
  supabase
    .from("api_requests")
    .insert({
      endpoint,
      method,
      status_code: statusCode,
      ip_hash: hashIP(ip),
      user_agent: ua.slice(0, 500),
      provider: provider || null,
      latency_ms: latencyMs ?? null,
    })
    .then(
      () => {},
      (err) => console.error("logRequest failed:", err?.message)
    );
}