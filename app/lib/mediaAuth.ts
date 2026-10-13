import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import {
  rateLimit,
  getClientIP,
  logSecurityEvent,
  rateLimitResponse,
} from "../api/security";
import {
  deductMediaCredits,
  hasMediaCredits,
  MEDIA_COST_USD,
} from "./mediaWallet";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function hashIP(ip: string): string {
  return createHash("sha256").update(ip + "gyra-media").digest("hex").slice(0, 16);
}

export type MediaAuthResult =
  | {
      ok: true;
      userId: string;
      keyId: string;
      balanceAfter: number;
    }
  | {
      ok: false;
      response: Response;
    };

/**
 * Use this at the top of every media endpoint.
 * Handles: rate limit, key validation, credit check, credit deduction.
 */
export async function authorizeMediaRequest(
  req: Request,
  endpoint: string
): Promise<MediaAuthResult> {
  // 1. IP rate limit
  const clientIP = getClientIP(req);
  const ipLimit = rateLimit(`media-ip:${clientIP}`, 30, 60 * 1000);
  if (!ipLimit.success) {
    logSecurityEvent("rate_limit", { ip: clientIP, path: endpoint });
    return { ok: false, response: rateLimitResponse(ipLimit.resetAt) };
  }

  // 2. Extract key
  const authHeader = req.headers.get("authorization") || "";
  const [scheme, token] = authHeader.split(" ");
  const apiKey = (token || "").trim();

  if (
    scheme !== "Bearer" ||
    !apiKey ||
    !apiKey.startsWith("gyramedia_")
  ) {
    return {
      ok: false,
      response: jsonError(
        "invalid_api_key",
        "Missing or invalid media API key. Include header: Authorization: Bearer gyramedia_xxx",
        401
      ),
    };
  }

  const admin = getAdmin();
  if (!admin) {
    return {
      ok: false,
      response: jsonError("server_error", "Server not configured.", 500),
    };
  }

  // 3. Validate key + category
  const { data: keyData, error: keyError } = await admin
    .from("api_keys")
    .select("id, user_id, category, active")
    .eq("key", apiKey)
    .eq("active", true)
    .maybeSingle();

  if (keyError || !keyData) {
    return {
      ok: false,
      response: jsonError(
        "invalid_api_key",
        "This API key does not exist or has been revoked.",
        401
      ),
    };
  }

  if (keyData.category !== "media") {
    return {
      ok: false,
      response: jsonError(
        "wrong_category",
        "This key is not a media API key. Generate a key at gyra.ng/api-keys?category=media",
        403
      ),
    };
  }

  // 4. Per-key rate limit (20/min for media)
  const keyLimit = rateLimit(`media-key:${apiKey}`, 20, 60 * 1000);
  if (!keyLimit.success) {
    logSecurityEvent("rate_limit", {
      ip: clientIP,
      keyPrefix: apiKey.slice(0, 18),
      path: endpoint,
    });
    return { ok: false, response: rateLimitResponse(keyLimit.resetAt) };
  }

  // 5. Credits check
  const credits = await hasMediaCredits(keyData.user_id, MEDIA_COST_USD);
  if (!credits.ok) {
    return {
      ok: false,
      response: jsonError(
        "insufficient_credits",
        `Media API costs $${MEDIA_COST_USD.toFixed(2)} per request. Your balance: $${credits.balance.toFixed(2)}. Top up at gyra.ng/upgrade?wallet=media`,
        402,
        { "X-Upgrade-URL": "https://gyra.ng/upgrade?wallet=media" }
      ),
    };
  }

  // 6. Deduct credits (before running the request)
  const deduction = await deductMediaCredits(
    keyData.user_id,
    `Media API: ${endpoint}`
  );

  if (!deduction.ok) {
    return {
      ok: false,
      response: jsonError(
        "credits_failed",
        deduction.error || "Could not deduct credits.",
        402
      ),
    };
  }

  // 7. Log the request (fire and forget — no await)
  admin
    .from("media_requests")
    .insert({
      user_id: keyData.user_id,
      endpoint,
      status_code: 200,
      cost_usd: MEDIA_COST_USD,
      ip_hash: hashIP(clientIP),
    })
    .then(
      () => {},
      (err) => console.error("media request log failed:", err)
    );

  return {
    ok: true,
    userId: keyData.user_id,
    keyId: keyData.id,
    balanceAfter: deduction.balance,
  };
}

export function jsonError(
  code: string,
  message: string,
  status: number,
  extraHeaders: Record<string, string> = {}
): Response {
  return Response.json(
    { error: { code, message } },
    { status, headers: extraHeaders }
  );
}