"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Logo from "../Logo";

type Summary = {
  total: number;
  today: number;
  month: number;
  uniqueToday: number;
  avgPerDay: number;
  busiestDay: number;
  busiestDayDate: string;
  updatedAt: string;
};

type Endpoints = {
  endpoints: { endpoint: string; count: number }[];
  todayTotal: number;
  updatedAt: string;
};

export default function StatsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [endpoints, setEndpoints] = useState<Endpoints | null>(null);
  const [pulse, setPulse] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  return (
    <main className="min-h-screen text-white relative">
      {/* ============================================================
          FULL-SCREEN WALLPAPER
          ============================================================ */}
      <div
        aria-hidden
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/stats-bg.jpg')",
          backgroundAttachment: "fixed",
        }}
      />

      {/* Dark navy overlay for readability */}
      <div
        aria-hidden
        className="fixed inset-0 z-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(2,6,23,0.82) 0%, rgba(2,6,23,0.88) 40%, rgba(2,6,23,0.94) 100%)",
        }}
      />

      {/* Subtle vignette top + bottom */}
      <div
        aria-hidden
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* ============================================================
          NAV — above everything
          ============================================================ */}
      <div className="relative z-30 border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 bg-black/40 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={28} animated={false} />
          <span className="font-bold tracking-widest text-sm text-white">
            GYRA
          </span>
          <span className="text-white/40 text-xs tracking-widest">STATS</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-green-500/15 border border-green-500/40 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-300 font-medium">Live</span>
          </div>

          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
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
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            ← Back
          </Link>
        </div>
      </div>

      {/* ============================================================
          CONTENT
          ============================================================ */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 py-12">
        {/* Big total */}
        <div className="text-center mb-16">
          <p className="text-xs tracking-[0.3em] text-white/50 uppercase mb-4">
            Total API Requests Served
          </p>
          <div
            className={`text-5xl md:text-7xl font-bold tracking-tighter bg-gradient-to-b from-cyan-200 via-blue-400 to-blue-600 bg-clip-text text-transparent transition-transform duration-500 drop-shadow-[0_0_40px_rgba(59,130,246,0.35)] ${
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
            <p className="text-xs text-white/40 mt-4">
              Updated {new Date(summary.updatedAt).toLocaleTimeString()} ·
              Auto-refresh every 8s
            </p>
          )}
        </div>

        {/* Main 3 */}
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

        {/* Secondary 3 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <StatCard
            icon="calendar"
            label="Last 7 Days"
            sub="recent request volume"
            value={summary?.today ?? 0}
            loading={!summary}
            pulse={pulse}
          />
          <StatCard
            icon="chart"
            label="Avg / Day"
            sub="daily average (real traffic)"
            value={summary?.avgPerDay ?? 0}
            loading={!summary}
            pulse={pulse}
          />
          <StatCard
            icon="trophy"
            label="Busiest Day"
            sub={summary?.busiestDayDate || "—"}
            value={summary?.busiestDay ?? 0}
            loading={!summary}
            pulse={pulse}
          />
        </div>

        {/* Top endpoints */}
        <div className="bg-black/55 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h2 className="text-sm font-semibold tracking-wide mb-6 flex items-center gap-2 text-white">
            <span className="text-blue-400">◢</span>
            Top Endpoints Today
          </h2>

          {!endpoints ? (
            <p className="text-sm text-white/50">Loading…</p>
          ) : endpoints.endpoints.length === 0 ? (
            <p className="text-sm text-white/50">
              No requests yet today. Check back soon.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {endpoints.endpoints.map((ep, i) => {
                const pct = (ep.count / maxEndpointCount) * 100;
                return (
                  <div key={ep.endpoint}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-white/60">
                        <span className="text-white/30 mr-3">{i + 1}</span>
                        <span className="font-mono">{ep.endpoint}</span>
                      </span>
                      <span className="text-white font-medium tabular-nums">
                        {ep.count.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-[width] duration-700 ease-out"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-white/40 mt-12">
          Live request counter · Updated every 8 seconds
        </p>
      </div>
    </main>
  );
}

// ============================================================
// StatCard — glassmorphism over the wallpaper
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
    <div className="relative overflow-hidden rounded-2xl p-6 border border-white/10 bg-black/45 backdrop-blur-xl">
      {/* subtle top glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="absolute top-5 right-5 w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
        {icon === "calendar" && (
          <svg
            className="w-4 h-4 text-blue-300"
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
            className="w-5 h-5 text-green-300"
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
            className="w-4 h-4 text-cyan-300"
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
            className="w-4 h-4 text-yellow-300"
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

      <p className="text-xs tracking-wider text-white/50 uppercase mb-4">
        {label}
      </p>
      <p
        className={`text-4xl font-bold tracking-tight mb-2 text-white transition-transform duration-500 ${
          pulse ? "scale-[1.02]" : "scale-100"
        }`}
      >
        {loading ? (
          <span className="text-white/30">—</span>
        ) : (
          <AnimatedNumber value={value} />
        )}
      </p>
      <p className="text-xs text-white/50">{sub}</p>
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