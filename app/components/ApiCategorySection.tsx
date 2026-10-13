"use client";

import Link from "next/link";
import type { ApiCategory } from "@/app/lib/apiCategories";

const COLOR_MAP: Record<
  string,
  { glow: string; border: string; badge: string; text: string; dot: string }
> = {
  blue: {
    glow: "from-blue-500/20 via-blue-500/5 to-transparent",
    border: "border-blue-500/30",
    badge: "bg-blue-500/10 text-blue-300 border-blue-500/30",
    text: "text-blue-400",
    dot: "bg-blue-400",
  },
  purple: {
    glow: "from-purple-500/20 via-purple-500/5 to-transparent",
    border: "border-purple-500/30",
    badge: "bg-purple-500/10 text-purple-300 border-purple-500/30",
    text: "text-purple-400",
    dot: "bg-purple-400",
  },
  cyan: {
    glow: "from-cyan-500/20 via-cyan-500/5 to-transparent",
    border: "border-cyan-500/30",
    badge: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
    text: "text-cyan-400",
    dot: "bg-cyan-400",
  },
  amber: {
    glow: "from-amber-500/20 via-amber-500/5 to-transparent",
    border: "border-amber-500/30",
    badge: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    text: "text-amber-400",
    dot: "bg-amber-400",
  },
};

export default function ApiCategorySection({
  category,
  index,
  reversed = false,
}: {
  category: ApiCategory;
  index: number;
  reversed?: boolean;
}) {
  const c = COLOR_MAP[category.color] || COLOR_MAP.blue;

  const isLive = category.status === "live";

  return (
    <section
      id={category.id}
      className="relative z-10 border-t border-white/5 py-24 scroll-mt-20"
    >
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <div
          className={`grid md:grid-cols-2 gap-16 items-center ${
            reversed ? "md:grid-flow-dense" : ""
          }`}
        >
          {/* Text column */}
          <div className={reversed ? "md:col-start-2" : ""}>
            {/* Category chip + status */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">{category.icon}</span>
              <span
                className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border font-semibold flex items-center gap-1.5 ${c.badge}`}
              >
                {isLive ? (
                  <>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${c.dot} animate-pulse`}
                    />
                    Live
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                    Coming soon
                  </>
                )}
              </span>
            </div>

            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter leading-[1.05] mb-6">
              {category.name}
            </h2>

            <p className="text-zinc-400 leading-relaxed mb-8 max-w-lg">
              {category.description}
            </p>

            {/* Tools list */}
            <div className="mb-8">
              <p className="text-xs tracking-[0.2em] text-zinc-500 uppercase mb-4">
                {category.tools.length} tools available
              </p>
              <ul className="flex flex-col gap-2">
                {category.tools.slice(0, 4).map((t) => (
                  <li
                    key={t.id}
                    className="flex items-start gap-3 text-sm text-zinc-400"
                  >
                    <span className={`${c.text} mt-0.5 shrink-0`}>◆</span>
                    <span>
                      <strong className="text-white font-medium">
                        {t.name}
                      </strong>{" "}
                      — {t.description}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              {isLive ? (
                <Link
                  href={category.keyHref}
                  className="bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-zinc-200 transition-colors text-sm"
                >
                  Get API key
                </Link>
              ) : (
                <button
                  disabled
                  className="bg-zinc-900 text-zinc-500 cursor-not-allowed px-6 py-3 rounded-full font-medium border border-zinc-800 text-sm"
                >
                  Coming soon
                </button>
              )}
              <Link
                href={category.docsHref}
                className="text-sm text-zinc-400 hover:text-white transition-colors inline-flex items-center gap-1.5"
              >
                View docs <span>→</span>
              </Link>
            </div>

            {/* Pricing */}
            <div className="mt-6 pt-6 border-t border-white/5">
              <p className="text-xs text-zinc-500">
                <span className="text-zinc-600 uppercase tracking-wider">
                  Pricing:
                </span>{" "}
                <span className="text-zinc-300">{category.pricing}</span>
              </p>
            </div>
          </div>

          {/* Visual column — Tools card */}
          <div className={`relative ${reversed ? "md:col-start-1" : ""}`}>
            <div
              className={`absolute inset-0 bg-gradient-to-br ${c.glow} rounded-3xl blur-2xl`}
            />
            <div
              className={`relative rounded-3xl border ${c.border} bg-black/40 backdrop-blur-xl p-6`}
            >
              {/* Card header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg bg-${category.color}-500/15 border ${c.border} flex items-center justify-center text-sm`}
                  >
                    {category.icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">
                      {category.name.replace("Gyra ", "")}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {category.tagline}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-zinc-600">
                  v1.0
                </span>
              </div>

              {/* Tool list preview */}
              <div className="flex flex-col gap-2.5">
                {category.tools.map((t, i) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[10px] font-mono text-zinc-600 w-5 shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-zinc-200 truncate">
                          {t.name}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-mono truncate">
                          {t.method} {t.endpoint}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {t.status === "live" ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-zinc-500">
                  {category.tools.length} endpoints
                </span>
                <span
                  className={`text-[10px] font-mono ${c.text} uppercase tracking-wider`}
                >
                  {isLive ? "Ready" : "Planned"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}