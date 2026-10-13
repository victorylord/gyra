import { authorizeMediaRequest, jsonError } from "@/app/lib/mediaAuth";

export async function POST(req: Request) {
  const auth = await authorizeMediaRequest(req, "/api/v1/media/youtube/metadata");
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json().catch(() => ({}));
    const url = String(body?.url || "").trim();

    if (!url) {
      return jsonError("invalid_request", "`url` is required.", 400);
    }

    const videoId = extractYouTubeId(url);
    if (!videoId) {
      return jsonError("invalid_url", "Could not extract YouTube video ID.", 400);
    }

    // Fetch oEmbed metadata (official, free)
    const oRes = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );

    if (!oRes.ok) {
      return jsonError(
        "not_found",
        "Video not found or unavailable.",
        404
      );
    }

    const oData = await oRes.json();

    return Response.json({
      videoId,
      title: oData?.title || "",
      author: oData?.author_name || "",
      authorUrl: oData?.author_url || "",
      thumbnail: oData?.thumbnail_url || "",
      thumbnailWidth: oData?.thumbnail_width || null,
      thumbnailHeight: oData?.thumbnail_height || null,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      balanceAfter: auth.balanceAfter,
    });
  } catch (err: any) {
    console.error("youtube metadata error:", err);
    return jsonError(
      "internal_error",
      err?.message || "Failed to fetch metadata.",
      500
    );
  }
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
  );
  return m ? m[1] : null;
}