import { fal } from "@fal-ai/client";
import { createClient } from "@supabase/supabase-js";
import {
  rateLimit,
  getClientIP,
  logSecurityEvent,
  rateLimitResponse,
} from "../../../security";
import {
  getUserFromToken,
  getSubscription,
  isSuperGyra,
} from "@/app/lib/subscription";
import { deductCredits } from "@/app/lib/credits";
import { VIDEO_COST_USD } from "@/app/lib/paymentConfig";

const MODEL = "fal-ai/ltx-video-13b-distilled";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env.");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  try {
    const clientIP = getClientIP(req);
    const limit = rateLimit(`video:${clientIP}`, 5, 60 * 1000);
    if (!limit.success) {
      logSecurityEvent("rate_limit", {
        ip: clientIP,
        path: "/api/v1/video/generate",
      });
      return rateLimitResponse(limit.resetAt);
    }

    const token = (req.headers.get("x-gyra-user-token") || "").trim();
    if (!token) {
      return errorResponse(
        "unauthorized",
        "Sign in required to generate videos.",
        401
      );
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return errorResponse("unauthorized", "Invalid session.", 401);
    }

    const sub = await getSubscription(user.id);
    if (!isSuperGyra(sub)) {
      return errorResponse(
        "supergyra_required",
        "Video generation is a SuperGyra feature. Upgrade to unlock.",
        402,
        { "X-Upgrade-URL": "https://gyra.ng/upgrade" }
      );
    }

    // Credits check
    if (sub.creditsUsd < VIDEO_COST_USD) {
      return errorResponse(
        "insufficient_credits",
        `You need $${VIDEO_COST_USD.toFixed(
          2
        )} in credits to generate a video. Your balance: $${sub.creditsUsd.toFixed(
          2
        )}. Top up at gyra.ng/upgrade`,
        402,
        { "X-Upgrade-URL": "https://gyra.ng/upgrade" }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return errorResponse("invalid_json", "Body must be valid JSON.", 400);
    }

    const prompt = String(body?.prompt || "").trim();
    if (!prompt) {
      return errorResponse("invalid_request", "`prompt` is required.", 400);
    }
    if (prompt.length > 2000) {
      return errorResponse(
        "invalid_request",
        "Prompt is too long (max 2000 chars).",
        400
      );
    }

    const aspectRatio = body?.aspectRatio === "9:16" ? "9:16" : "16:9";

    // Deduct credits FIRST
    const deduction = await deductCredits(
      user.id,
      VIDEO_COST_USD,
      `Video generation: ${prompt.slice(0, 80)}`
    );

    if (!deduction.ok) {
      return errorResponse(
        "credits_failed",
        deduction.error || "Could not deduct credits.",
        402
      );
    }

    // Queue with fal
    const { request_id } = await fal.queue.submit(MODEL, {
      input: {
        prompt,
        aspect_ratio: aspectRatio,
        resolution: "720p",
        num_frames: 121,
        frame_rate: 24,
        expand_prompt: true,
        enable_safety_checker: true,
      },
    });

    // Save job
    const admin = getAdmin();
    await admin.from("video_jobs").insert({
      user_id: user.id,
      request_id,
      prompt,
      model: MODEL,
      status: "queued",
    });

    return Response.json({
      requestId: request_id,
      model: MODEL,
      cost: VIDEO_COST_USD,
      newBalance: deduction.balance,
    });
  } catch (err: any) {
    console.error("video generate error:", err);
    return errorResponse(
      "generation_failed",
      err?.message || "Could not queue video generation.",
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