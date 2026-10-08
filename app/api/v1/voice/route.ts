import {
  rateLimit,
  getClientIP,
  logSecurityEvent,
  rateLimitResponse,
} from "../../security";
import {
  getUserFromToken,
  getSubscription,
  isSuperGyra,
} from "@/app/lib/subscription";
import { deductCredits } from "@/app/lib/credits";
import { VOICE_COST_USD } from "@/app/lib/paymentConfig";

export async function POST(req: Request) {
  try {
    const clientIP = getClientIP(req);
    const limit = rateLimit(`voice:${clientIP}`, 10, 60 * 1000);
    if (!limit.success) {
      logSecurityEvent("rate_limit", {
        ip: clientIP,
        path: "/api/v1/voice",
      });
      return rateLimitResponse(limit.resetAt);
    }

    const token = (req.headers.get("x-gyra-user-token") || "").trim();
    if (!token) {
      return errorResponse(
        "unauthorized",
        "Sign in required for voice synthesis.",
        401
      );
    }

    const user = await getUserFromToken(token);
    if (!user) return errorResponse("unauthorized", "Invalid session.", 401);

    const sub = await getSubscription(user.id);
    if (!isSuperGyra(sub)) {
      return errorResponse(
        "supergyra_required",
        "Voice synthesis is a SuperGyra feature.",
        402,
        { "X-Upgrade-URL": "https://gyra.ng/upgrade" }
      );
    }

    if (sub.creditsUsd < VOICE_COST_USD) {
      return errorResponse(
        "insufficient_credits",
        `You need $${VOICE_COST_USD.toFixed(
          2
        )} to use voice. Top up at gyra.ng/upgrade`,
        402,
        { "X-Upgrade-URL": "https://gyra.ng/upgrade" }
      );
    }

    const body = await req.json().catch(() => ({}));
    const text = String(body?.text || "").trim();
    const voiceId = String(body?.voiceId || "ara");

    if (!text) {
      return errorResponse("invalid_request", "`text` is required.", 400);
    }
    if (text.length > 5000) {
      return errorResponse(
        "invalid_request",
        "Text too long (max 5000 chars).",
        400
      );
    }

    const deduction = await deductCredits(
      user.id,
      VOICE_COST_USD,
      `Voice synthesis: ${text.slice(0, 60)}`
    );

    if (!deduction.ok) {
      return errorResponse(
        "credits_failed",
        deduction.error || "Could not deduct credits.",
        402
      );
    }

    // Return text + voice params for client-side SpeechSynthesis
    return Response.json({
      text,
      voiceId,
      cost: VOICE_COST_USD,
      newBalance: deduction.balance,
    });
  } catch (err: any) {
    console.error("voice error:", err);
    return errorResponse(
      "synthesis_failed",
      err?.message || "Could not process voice.",
      500
    );
  }
}

function errorResponse(
  code: string,
  message: string,
  status: number,
  extraHeaders: Record<string, string> = {}
) {
  return Response.json(
    { error: { code, message } },
    { status, headers: extraHeaders }
  );
}