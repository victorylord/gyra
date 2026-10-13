import { authorizeMediaRequest, jsonError } from "@/app/lib/mediaAuth";

/**
 * POST /api/v1/media/youtube/transcript
 * Body: { url: "https://youtube.com/watch?v=..." }
 * Returns: { videoId, title, transcript: [{ start, duration, text }], fullText }
 */
export async function POST(req: Request) {
  const auth = await authorizeMediaRequest(req, "/api/v1/media/youtube/transcript");
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json().catch(() => ({}));
    const url = String(body?.url || "").trim();

    if (!url) {
      return jsonError("invalid_request", "`url` is required.", 400);
    }

    const videoId = extractYouTubeId(url);
    if (!videoId) {
      return jsonError(
        "invalid_url",
        "Could not extract YouTube video ID from URL.",
        400
      );
    }

    // 1. Get video title via oEmbed (free, official)
    let title = "";
    try {
      const oRes = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      );
      if (oRes.ok) {
        const oData = await oRes.json();
        title = oData?.title || "";
      }
    } catch {}

    // 2. Try to fetch public captions
    const captions = await fetchYouTubeCaptions(videoId);

    if (!captions || captions.length === 0) {
      return jsonError(
        "no_transcript",
        "No captions available for this video. It may not have public captions enabled.",
        404
      );
    }

    const fullText = captions.map((c) => c.text).join(" ");

    return Response.json({
      videoId,
      title,
      transcript: captions,
      fullText,
      balanceAfter: auth.balanceAfter,
    });
  } catch (err: any) {
    console.error("youtube transcript error:", err);
    return jsonError(
      "internal_error",
      err?.message || "Failed to fetch transcript.",
      500
    );
  }
}

// ---------- Helpers ----------

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

async function fetchYouTubeCaptions(videoId: string) {
  try {
    // Fetch the video page to extract caption track URLs
    const res = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
      }
    );

    if (!res.ok) return null;
    const html = await res.text();

    // Find captionTracks JSON
    const captionMatch = html.match(
      /"captionTracks":\s*(\[.*?\])/
    );
    if (!captionMatch) return null;

    let tracks: any[] = [];
    try {
      tracks = JSON.parse(captionMatch[1].replace(/\\u0026/g, "&"));
    } catch {
      return null;
    }

    if (tracks.length === 0) return null;

    // Prefer English
    const track =
      tracks.find((t) => t.languageCode?.startsWith("en")) || tracks[0];

    if (!track?.baseUrl) return null;

    // Fetch the captions XML
    const capRes = await fetch(track.baseUrl);
    if (!capRes.ok) return null;
    const xml = await capRes.text();

    // Parse <text start="..." dur="...">...</text> tags
    const segments: { start: number; duration: number; text: string }[] = [];
    const regex =
      /<text start="([\d.]+)"(?:\s+dur="([\d.]+)")?[^>]*>([\s\S]*?)<\/text>/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(xml)) !== null) {
      segments.push({
        start: parseFloat(m[1]),
        duration: m[2] ? parseFloat(m[2]) : 0,
        text: decodeHTMLEntities(m[3].trim()),
      });
    }

    return segments;
  } catch (e) {
    console.error("fetchYouTubeCaptions error:", e);
    return null;
  }
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ");
}