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
    // 1. Rate limit
    const clientIP = getClientIP(req);
    const limit = rateLimit(`video:${clientIP}`, 5, 60 * 1000);
    if (!limit.success) {
      logSecurityEvent("rate_limit", {
        ip: clientIP,
        path: "/api/v1/video/generate",
      });
      return rateLimitResponse(limit.resetAt);
    }

    // 2. Auth
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

    // 3. Subscription gate
    const sub = await getSubscription(user.id);
    if (!isSuperGyra(sub)) {
      return errorResponse(
        "supergyra_required",
        "Video generation is a SuperGyra feature. Upgrade to unlock.",
        402,
        { "X-Upgrade-URL": "https://gyra.ng/upgrade" }
      );
    }

    // 4. Credits check
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

    // 5. Parse body
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
    const imageBase64 = body?.imageBase64 ? String(body.imageBase64) : null;

    // 6. Build fal input
    const input: any = {
      prompt,
      aspect_ratio: aspectRatio,
      resolution: "720p",
      num_frames: 121,
      frame_rate: 24,
      expand_prompt: true,
      enable_safety_checker: true,
    };

    // 7. If photo attached, upload to fal and use as image_url
    if (imageBase64 && imageBase64.startsWith("data:")) {
      try {
        const [meta, data] = imageBase64.split(",");
        const mime = meta.match(/data:(.*?);/)?.[1] || "image/jpeg";
        const binary = Buffer.from(data, "base64");
        const blob = new Blob([binary], { type: mime });

        const file = new File([blob], "input.jpg", { type: mime });
        const uploadedUrl = await fal.storage.upload(file);

        if (uploadedUrl) {
          input.image_url = uploadedUrl;
        }
      } catch (uploadErr) {
        console.error("image upload failed:", uploadErr);
        // Continue without image — fall back to text-to-video
      }
    }

    // 8. Deduct credits FIRST
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

    // 9. Queue job with fal
    try {
      const { request_id } = await fal.queue.submit(MODEL, { input });

      // 10. Save to Supabase
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
    } catch (falErr: any) {
      // Refund credits if fal rejected the job
      console.error("fal queue failed:", falErr);
      try {
        const admin = getAdmin();
        await admin
          .from("subscriptions")
          .update({ credits_usd: deduction.balance + VIDEO_COST_USD })
          .eq("user_id", user.id);
      } catch (refundErr) {
        console.error("refund failed:", refundErr);
      }
      return errorResponse(
        "generation_failed",
        falErr?.message || "Could not queue video generation.",
        500
      );
    }
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