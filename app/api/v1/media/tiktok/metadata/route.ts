import { authorizeMediaRequest, jsonError } from "@/app/lib/mediaAuth";

export async function POST(req: Request) {
  const auth = await authorizeMediaRequest(req, "/api/v1/media/tiktok/metadata");
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json().catch(() => ({}));
    const url = String(body?.url || "").trim();

    if (!url) {
      return jsonError("invalid_request", "`url` is required.", 400);
    }

    if (!url.includes("tiktok.com")) {
      return jsonError("invalid_url", "Not a TikTok URL.", 400);
    }

    // Use TikTok's oEmbed (official, free, allowed)
    const oRes = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
    );

    if (!oRes.ok) {
      return jsonError(
        "not_found",
        "TikTok video not found or unavailable.",
        404
      );
    }

    const oData = await oRes.json();

    return Response.json({
      title: oData?.title || "",
      author: oData?.author_name || "",
      authorUrl: oData?.author_url || "",
      thumbnail: oData?.thumbnail_url || "",
      thumbnailWidth: oData?.thumbnail_width || null,
      thumbnailHeight: oData?.thumbnail_height || null,
      url,
      balanceAfter: auth.balanceAfter,
    });
  } catch (err: any) {
    console.error("tiktok metadata error:", err);
    return jsonError(
      "internal_error",
      err?.message || "Failed to fetch metadata.",
      500
    );
  }
}