"use client";

import Link from "next/link";
import { useState } from "react";
import Logo from "../../Logo";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const ENDPOINTS = [
  {
    id: "music-search",
    method: "POST",
    path: "/api/v1/media/music/search",
    title: "Music Search",
    description: "Search Spotify for tracks, artists, and albums. Returns names, cover art, preview URLs, and metadata.",
    body: { q: "Wizkid Essence", type: "track", limit: 10 },
    response: `{\n  "query": "Wizkid Essence",\n  "type": "track",\n  "count": 10,\n  "results": [\n    {\n      "id": "5p1OvDeMBBMWvGj9xTa0VY",\n      "name": "Essence",\n      "artists": "Wizkid, Tems",\n      "album": "Made in Lagos",\n      "coverArt": "https://i.scdn.co/image/...",\n      "previewUrl": "https://p.scdn.co/mp3-preview/...",\n      "durationMs": 248000,\n      "externalUrl": "https://open.spotify.com/track/..."\n    }\n  ],\n  "balanceAfter": 4.10\n}`,
  },
  {
    id: "youtube-transcript",
    method: "POST",
    path: "/api/v1/media/youtube/transcript",
    title: "YouTube Transcript",
    description: "Fetch public captions from any YouTube video. Returns timestamped segments and the full transcript text.",
    body: { url: "https://youtube.com/watch?v=dQw4w9WgXcQ" },
    response: `{\n  "videoId": "dQw4w9WgXcQ",\n  "title": "Rick Astley - Never Gonna Give You Up",\n  "transcript": [\n    { "start": 0.0, "duration": 3.2, "text": "We're no strangers to love" }\n  ],\n  "fullText": "We're no strangers to love...",\n  "balanceAfter": 3.20\n}`,
  },
  {
    id: "youtube-metadata",
    method: "POST",
    path: "/api/v1/media/youtube/metadata",
    title: "YouTube Metadata",
    description: "Get title, author, thumbnail, and dimensions for any YouTube video using the official oEmbed endpoint.",
    body: { url: "https://youtube.com/watch?v=dQw4w9WgXcQ" },
    response: `{\n  "videoId": "dQw4w9WgXcQ",\n  "title": "Rick Astley - Never Gonna Give You Up",\n  "author": "Rick Astley",\n  "authorUrl": "https://www.youtube.com/@RickAstleyYT",\n  "thumbnail": "https://i.ytimg.com/vi/.../hqdefault.jpg",\n  "thumbnailWidth": 480,\n  "thumbnailHeight": 360,\n  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",\n  "balanceAfter": 2.30\n}`,
  },
  {
    id: "tiktok-metadata",
    method: "POST",
    path: "/api/v1/media/tiktok/metadata",
    title: "TikTok Metadata",
    description: "Get title, author, and thumbnail for any public TikTok video using the official oEmbed endpoint.",
    body: { url: "https://www.tiktok.com/@user/video/1234567890" },
    response: `{\n  "title": "Check out this recipe!",\n  "author": "chefusername",\n  "authorUrl": "https://www.tiktok.com/@chefusername",\n  "thumbnail": "https://p16-sign-va.tiktokcdn.com/...",\n  "url": "https://www.tiktok.com/@user/video/1234567890",\n  "balanceAfter": 1.40\n}`,
  },
  {
    id: "transcribe",
    method: "POST",
    path: "/api/v1/media/transcribe",
    title: "Audio Transcription",
    description: "Upload any audio file (max 25MB) and get a full transcription with timestamps, powered by Whisper.",
    body: "multipart/form-data",
    response: `{\n  "text": "Hello, this is a test of the transcription API.",\n  "language": "en",\n  "duration": 4.2,\n  "segments": [\n    { "start": 0, "end": 4.2, "text": "Hello, this is a test..." }\n  ],\n  "balanceAfter": 0.50\n}`,
  },
];

export default function MediaDocsPage() {
  const [activeId, setActiveId] = useState(ENDPOINTS[0].id);
  const [codeLang, setCodeLang] = useState<"curl" | "js" | "py">("curl");
  
  // Safe fallback to prevent undefined errors
  const active = ENDPOINTS.find((e) => e.id === activeId) || ENDPOINTS[0];

  const getCode = () => {
    const bodyString = typeof active.body === "string" ? '"..."' : JSON.stringify(active.body, null, 2);
    
    if (codeLang === "curl") {
      return `curl -X POST https://gyra.ng${active.path} \\\n  -H "Authorization: Bearer gyramedia_xxxxx" \\\n  -H "Content-Type: application/json" \\\n  -d '${bodyString}'`;
    }
    
    if (codeLang === "js") {
      return `const response = await fetch("https://gyra.ng${active.path}", {\n  method: "POST",\n  headers: {\n    "Authorization": "Bearer gyramedia_xxxxx",\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify(${bodyString})\n});\n\nconst data = await response.json();`;
    }
    
    return `import requests\n\nurl = "https://gyra.ng${active.path}"\nheaders = {\n    "Authorization": "Bearer gyramedia_xxxxx",\n    "Content-Type": "application/json"\n}\npayload = ${bodyString}\n\nresponse = requests.post(url, headers=headers, json=payload)\nprint(response.json())`;
  };

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-300">
      {/* Ambient Purple Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-500/10 rounded-full blur-[150px]" />
      </div>

      {/* Nav */}
      <div className="relative z-30 border-b border-zinc-800/50 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#09090b]/90 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={26} animated={false} />
          <span className="font-bold tracking-widest text-sm text-white">GYRA</span>
          <span className="text-zinc-600 text-xs tracking-widest border-l border-zinc-800 pl-3">MEDIA API</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/api-keys" className="text-sm text-zinc-400 hover:text-white transition-colors">Get API key</Link>
          <Link href="/api" className="text-sm text-zinc-400 hover:text-white transition-colors">← Back to API</Link>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 flex gap-12">
        {/* Sidebar */}
        <aside className="hidden md:block w-64 shrink-0 sticky top-24 self-start">
          <p className="text-[11px] tracking-[0.2em] text-zinc-500 uppercase mb-4 font-semibold">Endpoints</p>
          <nav className="flex flex-col gap-1">
            {ENDPOINTS.map((e) => (
              <button
                key={e.id}
                onClick={() => setActiveId(e.id)}
                className={`text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeId === e.id
                    ? "bg-zinc-900 border border-zinc-800 text-white shadow-sm"
                    : "text-zinc-500 hover:text-white hover:bg-zinc-900/50 border border-transparent"
                }`}
              >
                <span className={`inline-block text-[10px] font-mono mr-2 ${e.method === "GET" ? "text-green-400" : "text-purple-400"}`}>
                  {e.method}
                </span>
                {e.title}
              </button>
            ))}
          </nav>

          <div className="mt-8 pt-8 border-t border-zinc-800/60">
            <p className="text-[11px] tracking-[0.2em] text-zinc-500 uppercase mb-3 font-semibold">Pricing</p>
            <p className="text-xs text-zinc-400 leading-relaxed bg-purple-500/5 border border-purple-500/10 p-3 rounded-lg">
              <strong className="text-purple-400">$0.90</strong> per request.<br/>
              Free tier: 10 requests/month.
            </p>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] font-mono px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold uppercase tracking-wider">
                {active.method}
              </span>
              <code className="text-xs font-mono text-zinc-400 bg-zinc-900 px-2 py-1 rounded-md border border-zinc-800">
                {active.path}
              </code>
            </div>

            <h1 className="text-4xl font-bold tracking-tight mb-4 text-white">
              {active.title}
            </h1>
            <p className="text-zinc-400 leading-relaxed text-lg">
              {active.description}
            </p>
          </div>

          {/* Auth */}
          <div className="mb-10 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Authentication
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed mb-4">
              All Media API requests require your <code className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-xs font-mono text-purple-300">gyramedia_</code> key in the Authorization header.
            </p>
            <code className="block text-xs font-mono text-zinc-400 bg-[#1e1e1e] border border-zinc-800 rounded-lg p-3">
              Authorization: Bearer gyramedia_xxxxxxxxxxxx
            </code>
          </div>

          {/* Code Block */}
          <div className="mb-10">
            <h2 className="text-sm font-semibold text-white mb-3">Example request</h2>
            <div className="bg-[#1e1e1e] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800 bg-[#252526] pr-2">
                <div className="flex">
                  {(["curl", "js", "py"] as const).map(lang => (
                    <button
                      key={lang}
                      onClick={() => setCodeLang(lang)}
                      className={`px-4 py-2.5 text-xs font-medium transition-colors border-r border-zinc-800/50 ${
                        codeLang === lang 
                          ? "bg-[#1e1e1e] text-white border-b-2 border-b-purple-500" 
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {lang === "js" ? "Node.js" : lang === "py" ? "Python" : "cURL"}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(getCode())}
                  className="text-[11px] text-zinc-400 hover:text-white transition-colors px-3 py-1.5"
                >
                  Copy
                </button>
              </div>
              <div className="overflow-x-auto text-[13px]">
                <SyntaxHighlighter
                  language={codeLang === "js" ? "javascript" : codeLang === "py" ? "python" : "bash"}
                  style={vscDarkPlus}
                  customStyle={{ margin: 0, padding: "1.25rem", background: "transparent" }}
                >
                  {getCode()}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>

          {/* Response */}
          <div className="mb-10">
            <h2 className="text-sm font-semibold text-white mb-3">Response</h2>
            <div className="bg-[#1e1e1e] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-[#252526]">
                <span className="text-[11px] text-zinc-500 font-mono">200 OK · application/json</span>
              </div>
              <div className="overflow-x-auto text-[13px]">
                <SyntaxHighlighter
                  language="json"
                  style={vscDarkPlus}
                  customStyle={{ margin: 0, padding: "1.25rem", background: "transparent" }}
                >
                  {active.response}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>

          {/* Errors */}
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-white mb-4">Error codes</h2>
            <div className="flex flex-col gap-2">
              {[
                { code: "invalid_api_key", desc: "Missing or revoked key", status: 401 },
                { code: "wrong_category", desc: "Key is not a media key", status: 403 },
                { code: "insufficient_credits", desc: "Wallet balance too low", status: 402 },
                { code: "rate_limited", desc: "Too many requests", status: 429 },
                { code: "invalid_request", desc: "Missing parameters", status: 400 },
              ].map((e) => (
                <div key={e.code} className="flex items-center justify-between gap-4 py-2.5 border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/50 px-2 rounded transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">{e.status}</span>
                    <code className="text-xs font-mono text-purple-300 shrink-0 group-hover:text-purple-200 transition-colors">{e.code}</code>
                    <span className="text-xs text-zinc-500 truncate">{e.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}