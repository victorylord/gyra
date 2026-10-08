"use client";

import Link from "next/link";
import Logo from "../Logo";

type Category = {
  id: string;
  title: string;
  description: string;
  icon: string;
  endpoints: number;
  color: string;
  href: string;
  badge?: string;
};

const CATEGORIES: Category[] = [
  {
    id: "chat",
    title: "Chat",
    description:
      "Conversational AI with vision, files, and step-by-step reasoning.",
    icon: "💬",
    endpoints: 8,
    color: "from-blue-500/20 to-blue-700/10",
    href: "/api",
  },
  {
    id: "video",
    title: "Video Generation",
    description:
      "Turn a prompt into a cinematic video. Text-to-video and image-to-video.",
    icon: "🎬",
    endpoints: 6,
    color: "from-purple-500/20 to-purple-700/10",
    href: "/studio",
    badge: "New",
  },
  {
    id: "voice",
    title: "Voice",
    description: "Natural speech synthesis with multiple voices.",
    icon: "🎙️",
    endpoints: 4,
    color: "from-teal-500/20 to-teal-700/10",
    href: "/api",
    badge: "New",
  },
  {
    id: "image",
    title: "Image Generation",
    description: "Create images from text or transform existing photos.",
    icon: "🎨",
    endpoints: 12,
    color: "from-pink-500/20 to-pink-700/10",
    href: "/studio",
    badge: "Soon",
  },
  {
    id: "vision",
    title: "Vision",
    description: "Image understanding, OCR, object detection, chart reading.",
    icon: "👁️",
    endpoints: 6,
    color: "from-cyan-500/20 to-cyan-700/10",
    href: "/api",
  },
  {
    id: "files",
    title: "File Intelligence",
    description: "Read, summarize, and query PDFs, DOCX, XLSX, and more.",
    icon: "📄",
    endpoints: 5,
    color: "from-amber-500/20 to-amber-700/10",
    href: "/api",
  },
  {
    id: "search",
    title: "Search",
    description: "Real-time web search with sources and citations.",
    icon: "🔎",
    endpoints: 3,
    color: "from-emerald-500/20 to-emerald-700/10",
    href: "/api",
  },
  {
    id: "tools",
    title: "Tools & Agents",
    description: "Function calling, code execution, and agent workflows.",
    icon: "🛠️",
    endpoints: 9,
    color: "from-orange-500/20 to-orange-700/10",
    href: "/api",
    badge: "Soon",
  },
  {
    id: "embed",
    title: "Embeddings",
    description: "Vector embeddings for semantic search and RAG.",
    icon: "🧬",
    endpoints: 4,
    color: "from-indigo-500/20 to-indigo-700/10",
    href: "/api",
    badge: "Soon",
  },
  {
    id: "realtime",
    title: "Realtime",
    description: "Streaming responses, live transcription, real-time agents.",
    icon: "⚡",
    endpoints: 5,
    color: "from-red-500/20 to-red-700/10",
    href: "/api",
    badge: "Soon",
  },
];

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-blue-500/8 rounded-full blur-[180px]" />
      </div>

      <div className="relative z-10 border-b border-zinc-800/50 px-6 py-4 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={26} animated={false} />
          <span className="font-bold tracking-widest text-sm">GYRA</span>
          <span className="text-zinc-600 text-xs tracking-widest">PRODUCTS</span>
        </Link>
        <Link
          href="/api"
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          API Docs →
        </Link>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 py-16">
        <p className="text-xs tracking-[0.3em] text-zinc-500 uppercase mb-4">
          Explore our products
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          One platform. Every AI you need.
        </h1>
        <p className="text-zinc-400 max-w-2xl leading-relaxed mb-12">
          Gyra exposes every capability through the same clean API. Chat is
          free. Video, voice, and image generation run on credits — pay only
          for what you use.
        </p>

        {/* Credits info banner */}
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 mb-10 flex items-start gap-4">
          <span className="text-2xl">💎</span>
          <div>
            <p className="text-sm font-semibold mb-1">How credits work</p>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Chat is free up to 20 messages per conversation. Video
              generation costs <strong className="text-white">$2.00</strong>{" "}
              per request. Voice synthesis costs{" "}
              <strong className="text-white">$2.00</strong> per request. Top up
              your wallet anytime.
            </p>
          </div>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.id}
              href={c.href}
              className="group relative rounded-2xl border border-zinc-800 bg-zinc-950/60 hover:border-zinc-600 transition-all overflow-hidden p-6"
            >
              <div
                className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${c.color} rounded-full blur-3xl opacity-60`}
              />

              <div className="relative">
                <div className="flex items-start justify-between mb-5">
                  <span className="text-3xl">{c.icon}</span>
                  {c.badge && (
                    <span
                      className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-semibold ${
                        c.badge === "New"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {c.badge}
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-bold mb-2">{c.title}</h2>
                <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                  {c.description}
                </p>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">
                    {c.endpoints} endpoints
                  </span>
                  <span className="text-blue-400 group-hover:text-blue-300 transition-colors flex items-center gap-1">
                    Explore <span>→</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/upgrade"
            className="inline-block bg-white text-black px-8 py-3.5 rounded-full font-medium hover:bg-zinc-200 transition-colors"
          >
            Get SuperGyra · $2 per video →
          </Link>
        </div>
      </div>
    </main>
  );
}