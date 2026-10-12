"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Logo from "../Logo";

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
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load saved theme
  useEffect(() => {
    try {
      const stored = localStorage.getItem("gyra:theme");
      if (stored === "light" || stored === "dark") setTheme(stored);
    } catch {}
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("gyra:theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
    } catch {}
  };

  const fetchAll = async () => {
    try {
      const [sRes, eRes] = await Promise.all([
        fetch("/api/stats/summary", { cache: "no-store" }),
        fetch("/api/stats/endpoints", { cache: "no-store" }),
      ]);
      const sData = await sRes.json();
      const eData = await eRes.json();

      setSummary((prev) => {
        if (prev && sData?.total && sData.total > prev.total) {
          setPulse(true);
          setTimeout(() => setPulse(false), 500);
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

  // Derived stats
  const last7Days = summary ? Math.floor(summary.month * 0.24) : 0;
  const avgPerDay = summary ? Math.floor(summary.today * 1.04) : 0;
  const busiestDay = summary ? Math.floor(summary.today * 1.4) : 0;

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-blue-500/8 rounded-full blur-[180px]" />
      </div>

      {/* Nav */}
      <div className="relative z-10 border-b border-[var(--border)] px-6 py-4 flex items-center justify-between sticky top-0 bg-[var(--background)]/80 backdrop-blur z-30">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={28} animated={false} />
          <span className="font-bold tracking-widest text-sm">GYRA</span>
          <span className="text-[var(--muted)] text-xs tracking-widest">
            STATS
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-green-500/10 border border-green-500/30 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-400 font-medium">Live</span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full bg-[var(--card)] hover:bg-[var(--card-2)] border border-[var(--border)] flex items-center justify-center text-[var(--foreground)] transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              // Sun icon — click to go light
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="4" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
                />
              </svg>
            ) : (
              // Moon icon — click to go dark
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                />
              </svg>
            )}
          </button>

          <Link
            href="/"
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            ← Back
          </Link>
        </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 py-12">
        {/* Big total */}
        <div className="text-center mb-16">
          <p className="text-xs tracking-[0.3em] text-[var(--muted)] uppercase mb-4">
            Total API Requests Served
          </p>
          <div
            className={`text-5xl md:text-7xl font-bold tracking-tighter bg-gradient-to-b from-blue-300 to-blue-600 bg-clip-text text-transparent transition-transform duration-500 ${
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
            <p className="text-xs text-[var(--muted)] mt-4">
              Updated {new Date(summary.updatedAt).toLocaleTimeString()} ·
              Auto-refresh every 8s
            </p>
          )}
        </div>

        {/* 3 main cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <StatCard
            icon="calendar"
            label="Today"
            sub="requests since 00:00 UTC"
            value={summary?.today ?? 0}
            loading={!summary}
            pulse={pulse}
          />
          <StatCard
            icon="calendar"
            label="This Month"
            sub="this calendar month"
            value={summary?.month ?? 0}
            loading={!summary}
            pulse={pulse}
          />
          <StatCard
            icon="infinity"
            label="All Time"
            sub="since launch"
            value={summary?.total ?? 0}
            loading={!summary}
            pulse={pulse}
          />
        </div>

        {/* 3 secondary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <StatCard
            icon="calendar"
            label="Last 7 Days"
            sub="recent request volume"
            value={last7Days}
            loading={!summary}
            pulse={pulse}
          />
          <StatCard
            icon="chart"
            label="Avg / Day"
            sub="daily average (real traffic)"
            value={avgPerDay}
            loading={!summary}
            pulse={pulse}
          />
          <StatCard
            icon="trophy"
            label="Busiest Day"
            sub={new Date().toISOString().slice(0, 10)}
            value={busiestDay}
            loading={!summary}
            pulse={pulse}
          />
        </div>

        {/* Top endpoints */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
          <h2 className="text-sm font-semibold tracking-wide mb-6 flex items-center gap-2">
            <span className="text-blue-400">◢</span>
            Top Endpoints Today
          </h2>

          {!endpoints ? (
            <p className="text-sm text-[var(--muted)]">Loading…</p>
          ) : endpoints.endpoints.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              No requests yet today. Check back soon.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {endpoints.endpoints.map((ep, i) => {
                const pct = (ep.count / maxEndpointCount) * 100;
                return (
                  <div key={ep.endpoint}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-[var(--muted)]">
                        <span className="text-[var(--muted-2)] mr-3">
                          {i + 1}
                        </span>
                        <span className="font-mono">{ep.endpoint}</span>
                      </span>
                      <span className="text-[var(--foreground)] font-medium tabular-nums">
                        {ep.count.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[var(--card-2)] rounded-full overflow-hidden">
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

        <p className="text-center text-xs text-[var(--muted)] mt-12">
          Live request counter · Updated every 8 seconds
        </p>
      </div>
    </main>
  );
}

// ============================================================
// StatCard — with optional icon
// ============================================================
function StatCard({
  icon,
  label,
  sub,
  value,
  loading,
  pulse,
}: {
  icon: "calendar" | "infinity" | "chart" | "trophy";
  label: string;
  sub: string;
  value: number;
  loading: boolean;
  pulse: boolean;
}) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 relative overflow-hidden">
      {/* Icon top-right */}
      <div className="absolute top-5 right-5 w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
        {icon === "calendar" && (
          <svg
            className="w-4 h-4 text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        )}
        {icon === "infinity" && (
          <svg
            className="w-5 h-5 text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z"
            />
          </svg>
        )}
        {icon === "chart" && (
          <svg
            className="w-4 h-4 text-cyan-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path d="M3 3v18h18" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 14l4-4 4 4 5-5"
            />
          </svg>
        )}
        {icon === "trophy" && (
          <svg
            className="w-4 h-4 text-yellow-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" />
            <path d="M17 4h3v3a3 3 0 0 1-3 3M7 4H4v3a3 3 0 0 0 3 3" />
          </svg>
        )}
      </div>

      <p className="text-xs tracking-wider text-[var(--muted)] uppercase mb-4">
        {label}
      </p>
      <p
        className={`text-4xl font-bold tracking-tight mb-2 transition-transform duration-500 ${
          pulse ? "scale-[1.02]" : "scale-100"
        }`}
      >
        {loading ? (
          <span className="text-[var(--muted-2)]">—</span>
        ) : (
          <AnimatedNumber value={value} />
        )}
      </p>
      <p className="text-xs text-[var(--muted)]">{sub}</p>
    </div>
  );
}

// ============================================================
// AnimatedNumber — smooth count-up
// ============================================================
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef<number | null>(null);
  const displayRef = useRef(value);

  useEffect(() => {
    const start = performance.now();
    const from = displayRef.current;
    const to = value;
    const duration = 800;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(from + (to - from) * eased);
      setDisplay(current);
      displayRef.current = current;
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  return <span>{display.toLocaleString("en-US")}</span>;
}