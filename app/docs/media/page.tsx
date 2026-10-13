"use client";

import Link from "next/link";
import { useState } from "react";
import Logo from "../../Logo";

const ENDPOINTS = [
  {
    id: "music-search",
    method: "POST",
    path: "/api/v1/media/music/search",
    title: "Music Search",
    description:
      "Search Spotify for tracks, artists, and albums. Returns names, cover art, preview URLs, and metadata.",
    body: {
      q: "Wizkid Essence",
      type: "track",
      limit: 10,
    },
    response: `{
  "query": "Wizkid Essence",
  "type": "track",
  "count": 10,
  "results": [
    {
      "id": "5p1OvDeMBBMWvGj9xTa0VY",
      "name": "Essence",
      "artists": "Wizkid, Tems",
      "album": "Made in Lagos",
      "coverArt": "https://i.scdn.co/image/...",
      "previewUrl": "https://p.scdn.co/mp3-preview/...",
      "durationMs": 248000,
      "externalUrl": "https://open.spotify.com/track/..."
    }
  ],
  "balanceAfter": 4.10
}`,
  },
  {
    id: "youtube-transcript",
    method: "POST",
    path: "/api/v1/media/youtube/transcript",
    title: "YouTube Transcript",
    description:
      "Fetch public captions from any YouTube video. Returns timestamped segments and the full transcript text.",
    body: {
      url: "https://youtube.com/watch?v=dQw4w9WgXcQ",
    },
    response: `{
  "videoId": "dQw4w9WgXcQ",
  "title": "Rick Astley - Never Gonna Give You Up",
  "transcript": [
    { "start": 0.0, "duration": 3.2, "text": "We're no strangers to love" }
  ],
  "fullText": "We're no strangers to love...",
  "balanceAfter": 3.20
}`,
  },
  {
    id: "youtube-metadata",
    method: "POST",
    path: "/api/v1/media/youtube/metadata",
    title: "YouTube Metadata",
    description:
      "Get title, author, thumbnail, and dimensions for any YouTube video using the official oEmbed endpoint.",
    body: {
      url: "https://youtube.com/watch?v=dQw4w9WgXcQ",
    },
    response: `{
  "videoId": "dQw4w9WgXcQ",
  "title": "Rick Astley - Never Gonna Give You Up",
  "author": "Rick Astley",
  "authorUrl": "https://www.youtube.com/@RickAstleyYT",
  "thumbnail": "https://i.ytimg.com/vi/.../hqdefault.jpg",
  "thumbnailWidth": 480,
  "thumbnailHeight": 360,
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "balanceAfter": 2.30
}`,
  },
  {
    id: "tiktok-metadata",
    method: "POST",
    path: "/api/v1/media/tiktok/metadata",
    title: "TikTok Metadata",
    description:
      "Get title, author, and thumbnail for any public TikTok video using the official oEmbed endpoint.",
    body: {
      url: "https://www.tiktok.com/@user/video/1234567890",
    },
    response: `{
  "title": "Check out this recipe!",
  "author": "chefusername",
  "authorUrl": "https://www.tiktok.com/@chefusername",
  "thumbnail": "https://p16-sign-va.tiktokcdn.com/...",
  "url": "https://www.tiktok.com/@user/video/1234567890",
  "balanceAfter": 1.40
}`,
  },
  {
    id: "transcribe",
    method: "POST",
    path: "/api/v1/media/transcribe",
    title: "Audio Transcription",
    description:
      "Upload any audio file (max 25MB) and get a full transcription with timestamps, powered by Whisper.",
    body: "multipart/form-data",
    response: `{
  "text": "Hello, this is a test of the transcription API.",
  "language": "en",
  "duration": 4.2,
  "segments": [
    { "start": 0, "end": 4.2, "text": "Hello, this is a test..." }
  ],
  "balanceAfter": 0.50
}`,
  },
];

export default function MediaDocsPage() {
  const [activeId, setActiveId] = useState(ENDPOINTS[0].id);
  const active = ENDPOINTS.find((e) => e.id === activeId)!;

  const curlExample = `curl -X POST https://gyra.ng${active.path} \\
  -H "Authorization: Bearer gyramedia_xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '${typeof active.body === "string" ? '"..."' : JSON.stringify(active.body, null, 2)}'`;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-purple-500/8 rounded-full blur-[180px]" />
      </div>

      {/* Nav */}
      <div className="relative z-10 border-b border-zinc-800/50 px-6 py-4 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur z-30">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={26} animated={false} />
          <span className="font-bold tracking-widest text-sm">GYRA</span>
          <span className="text-zinc-600 text-xs tracking-widest">
            MEDIA API DOCS
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/api-keys"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Get API key
          </Link>
          <Link
            href="/api"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            ← Back to API
          </Link>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 flex gap-12">
        {/* Sidebar */}
        <aside className="hidden md:block w-64 shrink-0 sticky top-24 self-start">
          <p className="text-xs tracking-[0.2em] text-zinc-500 uppercase mb-4">
            Media API
          </p>
          <nav className="flex flex-col gap-1">
            {ENDPOINTS.map((e) => (
              <button
                key={e.id}
                onClick={() => setActiveId(e.id)}
                className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeId === e.id
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-500 hover:text-white hover:bg-zinc-900/50"
                }`}
              >
                <span
                  className={`inline-block text-[10px] font-mono mr-2 ${
                    e.method === "GET" ? "text-green-400" : "text-blue-400"
                  }`}
                >
                  {e.method}
                </span>
                {e.title}
              </button>
            ))}
          </nav>

          <div className="mt-8 pt-8 border-t border-zinc-800">
            <p className="text-xs text-zinc-500 mb-3">Pricing</p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              <strong className="text-white">$0.90</strong> per request.
              Free tier: 10 requests/month.
            </p>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`text-[10px] font-mono px-2 py-1 rounded ${
                  active.method === "GET"
                    ? "bg-green-500/10 text-green-400"
                    : "bg-blue-500/10 text-blue-400"
                }`}
              >
                {active.method}
              </span>
              <code className="text-xs font-mono text-zinc-400">
                {active.path}
              </code>
            </div>

            <h1 className="text-4xl font-bold tracking-tight mb-4">
              {active.title}
            </h1>
            <p className="text-zinc-400 leading-relaxed">
              {active.description}
            </p>
          </div>

          {/* Auth */}
          <div className="mb-8 bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
            <p className="text-xs tracking-[0.2em] text-zinc-500 uppercase mb-3">
              Authentication
            </p>
            <p className="text-sm text-zinc-400 leading-relaxed mb-3">
              All Media API requests require your{" "}
              <code className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-xs font-mono text-purple-300">
                gyramedia_
              </code>{" "}
              key in the Authorization header.
            </p>
            <code className="block text-xs font-mono text-zinc-500 bg-black border border-zinc-800 rounded-lg p-3">
              Authorization: Bearer gyramedia_xxxxxxxxxxxx
            </code>
          </div>

          {/* Request body */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold mb-3">Request body</h2>
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
              <pre className="p-5 text-xs font-mono text-zinc-300 overflow-x-auto">
                {typeof active.body === "string"
                  ? active.body
                  : JSON.stringify(active.body, null, 2)}
              </pre>
            </div>
          </div>

          {/* cURL */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold mb-3">Example request</h2>
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-black/60">
                <span className="text-[11px] text-zinc-500 font-mono">
                  curl
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(curlExample)}
                  className="text-[11px] text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-2.5 py-1 rounded-md border border-zinc-800 transition-colors"
                >
                  Copy
                </button>
              </div>
              <pre className="p-5 text-xs font-mono text-zinc-300 overflow-x-auto">
                {curlExample}
              </pre>
            </div>
          </div>

          {/* Response */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold mb-3">Response</h2>
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-black/60">
                <span className="text-[11px] text-zinc-500 font-mono">
                  application/json
                </span>
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(active.response)
                  }
                  className="text-[11px] text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-2.5 py-1 rounded-md border border-zinc-800 transition-colors"
                >
                  Copy
                </button>
              </div>
              <pre className="p-5 text-xs font-mono text-zinc-300 overflow-x-auto">
                {active.response}
              </pre>
            </div>
          </div>

          {/* Errors */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-sm font-semibold mb-4">Error codes</h2>
            <div className="flex flex-col gap-3 text-sm">
              {[
                { code: "invalid_api_key", desc: "Missing or revoked key", status: 401 },
                { code: "wrong_category", desc: "Key is not a media key", status: 403 },
                { code: "insufficient_credits", desc: "Wallet balance too low", status: 402 },
                { code: "rate_limited", desc: "Too many requests per minute", status: 429 },
                { code: "invalid_request", desc: "Missing or invalid parameters", status: 400 },
                { code: "provider_error", desc: "Upstream provider failed", status: 502 },
                { code: "no_transcript", desc: "Video has no captions", status: 404 },
              ].map((e) => (
                <div
                  key={e.code}
                  className="flex items-center justify-between gap-4 py-2 border-b border-zinc-900 last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <code className="text-xs font-mono text-purple-300 shrink-0">
                      {e.code}
                    </code>
                    <span className="text-xs text-zinc-500 truncate">
                      {e.desc}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-zinc-600 shrink-0">
                    {e.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}