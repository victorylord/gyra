import { authorizeMediaRequest, jsonError } from "@/app/lib/mediaAuth";
import { getSpotifyToken } from "@/app/lib/spotify";

export async function POST(req: Request) {
  const auth = await authorizeMediaRequest(req, "/api/v1/media/music/search");
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json().catch(() => ({}));
    const query = String(body?.q || "").trim();
    const type = String(body?.type || "track"); // track | artist | album
    const limit = Math.min(20, Math.max(1, Number(body?.limit) || 10));

    if (!query) {
      return jsonError("invalid_request", "`q` (query) is required.", 400);
    }

    if (!["track", "artist", "album"].includes(type)) {
      return jsonError(
        "invalid_request",
        "`type` must be track, artist, or album.",
        400
      );
    }

    const token = await getSpotifyToken();
    if (!token) {
      return jsonError(
        "provider_unavailable",
        "Music search is temporarily unavailable.",
        503
      );
    }

    const spRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        query
      )}&type=${type}&limit=${limit}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!spRes.ok) {
      console.error("spotify search non-OK:", spRes.status);
      return jsonError(
        "provider_error",
        "Music search failed.",
        502
      );
    }

    const data = await spRes.json();

    // Normalise response per type
    let results: any[] = [];
    if (type === "track") {
      results = (data?.tracks?.items || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        artists: (t.artists || []).map((a: any) => a.name).join(", "),
        album: t.album?.name || "",
        coverArt: t.album?.images?.[0]?.url || null,
        previewUrl: t.preview_url || null,
        durationMs: t.duration_ms,
        externalUrl: t.external_urls?.spotify || null,
      }));
    } else if (type === "artist") {
      results = (data?.artists?.items || []).map((a: any) => ({
        id: a.id,
        name: a.name,
        genres: a.genres || [],
        followers: a.followers?.total || 0,
        popularity: a.popularity || 0,
        image: a.images?.[0]?.url || null,
        externalUrl: a.external_urls?.spotify || null,
      }));
    } else if (type === "album") {
      results = (data?.albums?.items || []).map((a: any) => ({
        id: a.id,
        name: a.name,
        artists: (a.artists || []).map((x: any) => x.name).join(", "),
        releaseDate: a.release_date,
        totalTracks: a.total_tracks,
        coverArt: a.images?.[0]?.url || null,
        externalUrl: a.external_urls?.spotify || null,
      }));
    }

    return Response.json({
      query,
      type,
      count: results.length,
      results,
      balanceAfter: auth.balanceAfter,
    });
  } catch (err: any) {
    console.error("music search error:", err);
    return jsonError(
      "internal_error",
      err?.message || "Search failed.",
      500
    );
  }
}