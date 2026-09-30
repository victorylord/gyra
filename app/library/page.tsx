"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "../Logo";
import { PROMPT_LIBRARY, type Prompt } from "./data";

export default function LibraryPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = activeCategory
    ? PROMPT_LIBRARY.filter((c) => c.id === activeCategory)
    : PROMPT_LIBRARY;

  const filtered = categories
    .map((cat) => ({
      ...cat,
      prompts: cat.prompts.filter(
        (p) =>
          !query.trim() ||
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.description.toLowerCase().includes(query.toLowerCase()) ||
          p.prompt.toLowerCase().includes(query.toLowerCase())
      ),
    }))
    .filter((cat) => cat.prompts.length > 0);

  const usePrompt = (p: Prompt) => {
    const text = p.prompt;
    window.location.href = `/dashboard?prompt=${encodeURIComponent(text)}`;
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[160px]" />
      </div>

      {/* Nav */}
      <div className="relative z-10 border-b border-zinc-800/50 px-6 py-4 flex items-center justify-between sticky top-0 bg-black/95 backdrop-blur">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={28} animated={false} />
          <span className="font-bold tracking-widest text-sm">GYRA</span>
          <span className="text-zinc-600 text-xs tracking-widest">LIBRARY</span>
        </Link>
        <Link
          href="/dashboard"
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Open chat →
        </Link>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 py-12">
        <p className="text-xs tracking-[0.3em] text-zinc-500 uppercase mb-4">
          Prompt Library
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Start with a prompt.
        </h1>
        <p className="text-zinc-400 max-w-2xl mb-10 leading-relaxed">
          A curated collection of prompts that work well with Gyra. Tap any
          card to open it directly in chat.
        </p>

        {/* Search */}
        <div className="mb-8 max-w-xl">
          <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-full px-5 py-3">
            <svg
              className="w-4 h-4 text-zinc-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search prompts…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent outline-none text-sm flex-1 placeholder:text-zinc-500"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-10">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-2 rounded-full text-sm border transition-colors ${
              activeCategory === null
                ? "bg-white text-black border-white"
                : "bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-white"
            }`}
          >
            All
          </button>
          {PROMPT_LIBRARY.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm border transition-colors flex items-center gap-2 ${
                activeCategory === cat.id
                  ? "bg-white text-black border-white"
                  : "bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-white"
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.title}
            </button>
          ))}
        </div>

        {/* Prompt grid */}
        {filtered.length === 0 ? (
          <p className="text-zinc-500 text-sm">No prompts match your search.</p>
        ) : (
          filtered.map((cat) => (
            <section key={cat.id} className="mb-12">
              <div className="mb-5">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <span>{cat.emoji}</span>
                  {cat.title}
                </h2>
                <p className="text-sm text-zinc-500 mt-1">{cat.description}</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {cat.prompts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => usePrompt(p)}
                    className="text-left bg-zinc-950 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-600 transition-all group"
                  >
                    <h3 className="font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
                      {p.title}
                    </h3>
                    <p className="text-sm text-zinc-400 mb-3">
                      {p.description}
                    </p>
                    <p className="text-xs text-zinc-600 line-clamp-2 font-mono leading-relaxed">
                      {p.prompt}
                    </p>
                    <p className="text-xs text-blue-400 mt-3">
                      Use this prompt →
                    </p>
                  </button>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </main>
  );
}