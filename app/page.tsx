"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "./supabase";
import Logo from "./components/Logo";

const TAGLINE = "Intelligence, Simplified.";

const ECOSYSTEM = [
  {
    name: "Gyra AI",
    tagline: "For everyone",
    description:
      "A multimodal intelligence platform for thinking, researching, writing, building, and understanding.",
    href: "/dashboard",
    action: "Open Gyra",
    icon: "🧠",
    available: true,
  },
  {
    name: "Gyra API",
    tagline: "For developers",
    description:
      "Build with the intelligence layer. Chat, vision, files, and voice — through one clean interface.",
    href: "/api",
    action: "Get API key",
    icon: "⚙️",
    available: true,
  },
  {
    name: "Gyra Studio",
    tagline: "Coming soon",
    description:
      "A visual workspace for building AI applications — agents, workflows, and knowledge, all in one place.",
    href: "/studio",
    action: "Preview",
    icon: "🎨",
    available: false,
  },
  {
    name: "Gyra Cloud",
    tagline: "Coming soon",
    description:
      "Storage, compute, and infrastructure for AI workloads. Deploy and scale what you build on Gyra.",
    href: "/cloud",
    action: "Preview",
    icon: "☁️",
    available: false,
  },
];

const INTELLIGENCE = [
  { icon: "🧠", name: "Reasoning", desc: "Step-by-step problem solving." },
  { icon: "👁️", name: "Vision", desc: "Understand images, charts, and screenshots." },
  { icon: "📄", name: "File Intelligence", desc: "Read, summarize, and query documents." },
  { icon: "🎙️", name: "Voice", desc: "Natural spoken conversations." },
  { icon: "💻", name: "Code", desc: "Write, debug, and explain code." },
  { icon: "🌍", name: "Multilingual", desc: "Fluent across dozens of languages." },
  { icon: "🔎", name: "Research", desc: "Search the live web with sources." },
  { icon: "🧩", name: "Tool Use", desc: "Take actions across connected systems." },
];

const CAPABILITIES = [
  {
    title: "A real AI platform.",
    body:
      "Gyra is a multimodal intelligence layer for people, developers, and the applications they build — not just another chatbot.",
  },
  {
    title: "Built to understand more than words.",
    body:
      "Conversation, vision, files, and voice — unified under one intelligence so context carries across everything.",
  },
  {
    title: "Infrastructure you can build on.",
    body:
      "A clean, OpenAI-compatible API with free keys, structured responses, and production-grade reliability.",
  },
];

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let i = 0;
    let forward = true;
    let timeout: ReturnType<typeof setTimeout>;
    const tick = () => {
      setDisplayedText(TAGLINE.substring(0, i));
      if (forward) {
        i++;
        if (i > TAGLINE.length) {
          forward = false;
          timeout = setTimeout(tick, 2000);
          return;
        }
      } else {
        i--;
        if (i === 0) forward = true;
      }
      timeout = setTimeout(tick, forward ? 90 : 40);
    };
    timeout = setTimeout(tick, 500);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setChecking(false);
    });
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
  };

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Ambient background layers */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-blue-500/8 rounded-full blur-[160px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[160px]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
            maskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
      </div>

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-6 border-b border-white/5 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={32} animated={false} />
          <span className="font-bold tracking-widest text-lg">GYRA</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
          <Link href="/docs" className="hover:text-white transition-colors">
            Docs
          </Link>
          <Link href="/api" className="hover:text-white transition-colors">
            API
          </Link>
          <Link href="/changelog" className="hover:text-white transition-colors">
            Changelog
          </Link>
          <Link href="/status" className="hover:text-white transition-colors">
            Status
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {!checking && user ? (
            <Link
              href="/dashboard"
              className="bg-white text-black px-5 py-2 rounded-full text-sm font-medium hover:bg-zinc-200 transition-colors"
            >
              Open Gyra
            </Link>
          ) : (
            <button
              onClick={handleLogin}
              className="bg-white text-black px-5 py-2 rounded-full text-sm font-medium hover:bg-zinc-200 transition-colors"
            >
              Sign in
            </button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 pt-24 md:pt-32 pb-24">
        <div className="flex flex-col items-center text-center">
          <Logo size={140} animated={true} />

          <h1 className="mt-12 text-5xl md:text-7xl font-bold tracking-tighter leading-none">
            Gyra
          </h1>

          <div className="mt-6 flex items-center">
            <span
              className="text-base md:text-lg text-zinc-500 tracking-wide"
              style={{
                fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
              }}
            >
              {displayedText}
            </span>
            <span className="text-blue-400 text-lg ml-1">▎</span>
          </div>

          <p className="mt-8 max-w-2xl text-zinc-400 text-lg leading-relaxed">
            A multimodal AI platform for people, developers, and the
            applications they build. Conversation, vision, files, and voice —
            unified under one intelligence.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <Link
              href={user ? "/dashboard" : "#"}
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  handleLogin();
                }
              }}
              className="bg-white text-black px-8 py-4 rounded-full font-medium hover:bg-zinc-200 transition-colors"
            >
              {user ? "Open Gyra" : "Start with Gyra"}
            </Link>
            <Link
              href="/api"
              className="border border-white/10 hover:border-white/30 text-white px-8 py-4 rounded-full font-medium transition-colors"
            >
              Build with Gyra API →
            </Link>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-20 border-t border-white/5">
        <div className="grid md:grid-cols-3 gap-12">
          {CAPABILITIES.map((c) => (
            <div key={c.title}>
              <h3 className="text-xl font-semibold mb-3 tracking-tight">
                {c.title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The Gyra Ecosystem */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-24 border-t border-white/5">
        <div className="text-center mb-16">
          <p className="text-xs tracking-[0.3em] text-zinc-500 uppercase mb-4">
            The Gyra Ecosystem
          </p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter max-w-3xl mx-auto">
            One intelligence layer. Endless possibilities.
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-zinc-400 text-base leading-relaxed">
            Gyra is built as a platform — not a product. Each part connects to
            the same intelligence layer, so it can grow with what you build.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {ECOSYSTEM.map((e) => (
            <Link
              key={e.name}
              href={e.href}
              className="group relative bg-zinc-950/60 border border-zinc-800/60 rounded-2xl p-8 hover:border-zinc-600 transition-all duration-300 backdrop-blur-sm"
            >
              <div className="flex items-start justify-between mb-6">
                <span className="text-3xl">{e.icon}</span>
                <span
                  className={`text-[10px] tracking-wider uppercase px-3 py-1 rounded-full ${
                    e.available
                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      : "bg-zinc-800/60 text-zinc-500 border border-zinc-700/60"
                  }`}
                >
                  {e.tagline}
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-3 tracking-tight">
                {e.name}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                {e.description}
              </p>
              <div className="flex items-center gap-2 text-sm text-blue-400 group-hover:text-blue-300 transition-colors">
                <span>{e.action}</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Gyra Intelligence */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-24 border-t border-white/5">
        <div className="text-center mb-16">
          <p className="text-xs tracking-[0.3em] text-zinc-500 uppercase mb-4">
            Gyra Intelligence
          </p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter">
            Understand. Reason. Create. Execute.
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {INTELLIGENCE.map((i) => (
            <div
              key={i.name}
              className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-6 hover:border-zinc-700 transition-colors"
            >
              <span className="text-2xl">{i.icon}</span>
              <h3 className="mt-4 font-semibold text-sm">{i.name}</h3>
              <p className="mt-2 text-xs text-zinc-500 leading-relaxed">
                {i.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Positioning */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 py-24 text-center border-t border-white/5">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tighter leading-tight">
          From conversation to intelligence.
        </h2>
        <p className="mt-6 text-zinc-400 leading-relaxed">
          Gyra is being built as a complete AI platform — a consumer
          intelligence product, a developer infrastructure layer, and a
          research ecosystem. All under one brand, one vision.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={user ? "/dashboard" : "#"}
            onClick={(e) => {
              if (!user) {
                e.preventDefault();
                handleLogin();
              }
            }}
            className="bg-white text-black px-8 py-4 rounded-full font-medium hover:bg-zinc-200 transition-colors"
          >
            {user ? "Continue to Gyra" : "Get started"}
          </Link>
          <Link
            href="/changelog"
            className="text-zinc-400 hover:text-white transition-colors text-sm"
          >
            Read the changelog →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-12 border-t border-white/5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Logo size={28} animated={false} />
            <div>
              <p className="font-bold tracking-widest text-sm">GYRA</p>
              <p className="text-[10px] text-zinc-600 tracking-wider">
                INTELLIGENCE, SIMPLIFIED.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs text-zinc-500">
            <Link href="/api" className="hover:text-white transition-colors">
              API
            </Link>
            <Link href="/docs" className="hover:text-white transition-colors">
              Docs
            </Link>
            <Link
              href="/changelog"
              className="hover:text-white transition-colors"
            >
              Changelog
            </Link>
            <Link href="/status" className="hover:text-white transition-colors">
              Status
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <a
              href="https://t.me/Gyra_AiBot"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              Telegram
            </a>
          </div>
        </div>
        <p className="mt-8 text-[11px] text-zinc-700 text-center">
          © 2026 Gyra · Genvia AI Company. All rights reserved.
        </p>
      </footer>
    </main>
  );
}