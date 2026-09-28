import { fal } from "@fal-ai/client";
import {
  rateLimit,
  getClientIP,
  logSecurityEvent,
  rateLimitResponse,
} from "../../../security";

// The model — swap this string to change provider
// Options: "fal-ai/ltx-video-13b-distilled" (cheap, 480p/720p)
//          "fal-ai/veo3.1/lite" (best quality, 720p/1080p, ~$0.40)
const MODEL = "fal-ai/ltx-video-13b-distilled";

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

    const resolution = body?.resolution === "1080p" ? "720p" : "720p";
    const aspectRatio = body?.aspectRatio === "9:16" ? "9:16" : "16:9";

    // Queue the job
    const { request_id } = await fal.queue.submit(MODEL, {
      input: {
        prompt,
        aspect_ratio: aspectRatio,
        resolution: "720p",
        num_frames: 121, // ~5s at 24fps
        frame_rate: 24,
        expand_prompt: true,
        enable_safety_checker: true,
      },
    });

    return Response.json({ requestId: request_id, model: MODEL });
  } catch (err: any) {
    console.error("video generate error:", err);
    return errorResponse(
      "generation_failed",
      err?.message || "Could not queue video generation.",
      500
    );
  }
}

function errorResponse(code: string, message: string, status: number) {
  return Response.json({ error: { code, message } }, { status });
}