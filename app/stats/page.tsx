"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Summary = {
  total: number;
  today: number;
  month: number;
  uniqueToday: number;
  updatedAt: string;
};

type Endpoints = {
  endpoints: { endpoint: string; count: number }[];
  updatedAt: string;
};

export default function StatsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [endpoints, setEndpoints] = useState<Endpoints | null>(null);
  const [pulse, setPulse] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = async () => {
    try {
      const [sRes, eRes] = await Promise.all([
        fetch("/api/stats/summary", { cache: "no-store" }),
        fetch("/api/stats/endpoints", { cache: "no-store" }),
      ]);
      const sData = await sRes.json();
      const eData = await eRes.json();

      setSummary((prev) => {
        // Trigger a subtle pulse if the total changed
        if (prev && sData?.total && sData.total !== prev.total) {
          setPulse(true);
          setTimeout(() => setPulse(false), 400);
        }
        return sData;
      });
      setEndpoints(eData);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAll();
    pollRef.current = setInterval(fetchAll, 8_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const maxEndpointCount = Math.max(
    1,
    ...(endpoints?.endpoints.map((e) => e.count) || [1])
  );

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-blue-500/8 rounded-full blur-[180px]" />
      </div>

      {/* Nav */}
      <div className="relative z-10 border-b border-zinc-800/50 px-6 py-4 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur z-30">
        <Link href="/" className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xs font-bold">
            G
          </span>
          <span className="font-bold tracking-widest text-sm">GYRA</span>
          <span className="text-zinc-600 text-xs tracking-widest">STATS</span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs text-green-400 font-medium">Live</span>
          </div>
          <Link
            href="/"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            ← Back
          </Link>
        </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 py-12">
        {/* Big total */}
        <div className="text-center mb-16">
          <p className="text-xs tracking-[0.3em] text-zinc-500 uppercase mb-4">
            Total API Requests Served
          </p>
          <div
            className={`text-5xl md:text-7xl font-bold tracking-tighter bg-gradient-to-b from-blue-300 to-blue-600 bg-clip-text text-transparent transition-transform duration-300 ${
              pulse ? "scale-[1.02]" : "scale-100"
            }`}
          >
            {summary?.total != null ? (
              <AnimatedNumber value={summary.total} />
            ) : (
              <span className="opacity-40">—</span>
            )}
          </div>
          {summary?.updatedAt && (
            <p className="text-xs text-zinc-600 mt-4">
              Updated{" "}
              {new Date(summary.updatedAt).toLocaleTimeString()} · Auto-refresh
              every 8s
            </p>
          )}
        </div>

        {/* 3 cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <StatCard
            label="Today"
            sub="requests since 00:00 UTC"
            value={summary?.today ?? 0}
            loading={!summary}
            pulse={pulse}
          />
          <StatCard
            label="This Month"
            sub="this calendar month"
            value={summary?.month ?? 0}
            loading={!summary}
            pulse={pulse}
          />
          <StatCard
            label="All Time"
            sub="since launch"
            value={summary?.total ?? 0}
            loading={!summary}
            pulse={pulse}
          />
        </div>

        {/* Top endpoints */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-sm font-semibold tracking-wide mb-6 flex items-center gap-2">
            <span className="text-blue-400">◢</span>
            Top Endpoints Today
          </h2>

          {!endpoints ? (
            <p className="text-sm text-zinc-500">Loading…</p>
          ) : endpoints.endpoints.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No requests yet today. Check back soon.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {endpoints.endpoints.map((ep, i) => {
                const pct = (ep.count / maxEndpointCount) * 100;
                return (
                  <div key={ep.endpoint}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-zinc-400">
                        <span className="text-zinc-600 mr-3">{i + 1}</span>
                        <span className="font-mono">{ep.endpoint}</span>
                      </span>
                      <span className="text-white font-medium tabular-nums">
                        {ep.count.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-[width] duration-700 ease-out"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-zinc-600 mt-12">
          Live request counter · Updated every 8 seconds
        </p>
      </div>
    </main>
  );
}

function StatCard({
  label,
  sub,
  value,
  loading,
  pulse,
}: {
  label: string;
  sub: string;
  value: number;
  loading: boolean;
  pulse: boolean;
}) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
      <p className="text-xs tracking-wider text-zinc-500 uppercase mb-4">
        {label}
      </p>
      <p
        className={`text-4xl font-bold tracking-tight mb-2 transition-transform duration-300 ${
          pulse ? "scale-[1.02]" : "scale-100"
        }`}
      >
        {loading ? (
          <span className="text-zinc-700">—</span>
        ) : (
          <AnimatedNumber value={value} />
        )}
      </p>
      <p className="text-xs text-zinc-500">{sub}</p>
    </div>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const from = display;
    const to = value;
    const duration = 600;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span>{display.toLocaleString("en-US")}</span>;
}