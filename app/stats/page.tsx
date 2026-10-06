"use client";

import Link from "next/link";
import { usePolling } from "./hooks/useStats";
import AnimatedNumber from "./components/AnimatedNumber";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

type Timeseries = {
  series: { date: string; count: number }[];
  updatedAt: string;
};

export default function StatsPage() {
  const summary = usePolling<Summary>("/api/stats/summary", 20_000);
  const endpoints = usePolling<Endpoints>("/api/stats/endpoints", 20_000);
  const timeseries = usePolling<Timeseries>("/api/stats/timeseries", 20_000);

  const maxEndpointCount = Math.max(
    1,
    ...(endpoints.data?.endpoints.map((e) => e.count) || [1])
  );

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-blue-500/10 rounded-full blur-[180px]" />
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
        <Link
          href="/"
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          ← Back
        </Link>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 py-12">
        {/* Big total */}
        <div className="text-center mb-16">
          <p className="text-xs tracking-[0.3em] text-zinc-500 uppercase mb-4">
            Total API Requests Served
          </p>
          <div className="text-5xl md:text-7xl font-bold tracking-tighter bg-gradient-to-b from-blue-300 to-blue-600 bg-clip-text text-transparent">
            {summary.loading ? (
              <span className="opacity-40">—</span>
            ) : (
              <AnimatedNumber value={summary.data?.total || 0} />
            )}
          </div>
          {summary.data?.updatedAt && (
            <p className="text-xs text-zinc-600 mt-4">
              Updated {new Date(summary.data.updatedAt).toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* 3 cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <StatCard
            label="Today"
            sub="requests since 00:00 UTC"
            value={summary.data?.today ?? 0}
            loading={summary.loading}
          />
          <StatCard
            label="This Month"
            sub="this calendar month"
            value={summary.data?.month ?? 0}
            loading={summary.loading}
          />
          <StatCard
            label="All Time"
            sub="since launch"
            value={summary.data?.total ?? 0}
            loading={summary.loading}
          />
        </div>

        {/* Chart */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold tracking-wide flex items-center gap-2">
              <span className="text-blue-400">◢</span>
              Requests · Last 30 Days
            </h2>
            <span className="text-xs text-zinc-500">
              {timeseries.data?.series.reduce((a, b) => a + b.count, 0) || 0} total
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={timeseries.data?.series || []}
                margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="#3f3f46"
                  tick={{ fill: "#71717a", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(d: string) => d.slice(5)}
                />
                <YAxis
                  stroke="#3f3f46"
                  tick={{ fill: "#71717a", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#09090b",
                    border: "1px solid #27272a",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#a1a1aa" }}
                  itemStyle={{ color: "#60a5fa" }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#grad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top endpoints */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-sm font-semibold tracking-wide mb-6 flex items-center gap-2">
            <span className="text-blue-400">◢</span>
            Top Endpoints Today
          </h2>

          {endpoints.loading ? (
            <p className="text-sm text-zinc-500">Loading…</p>
          ) : endpoints.data?.endpoints.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No requests yet today. Check back soon.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {endpoints.data?.endpoints.map((ep, i) => {
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
          Refreshes every 20 seconds · Data collected server-side
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
}: {
  label: string;
  sub: string;
  value: number;
  loading: boolean;
}) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
      <p className="text-xs tracking-wider text-zinc-500 uppercase mb-4">
        {label}
      </p>
      <p className="text-4xl font-bold tracking-tight mb-2">
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