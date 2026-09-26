"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "../Logo";
import { supabase } from "../supabase";

type ApiKey = {
  id: string;
  key: string;
  name: string;
  active: boolean;
  revoked: boolean;
  request_count: number;
  last_used: string | null;
  created_at: string;
};

type UsageRecord = {
  id: string;
  api_key_id: string;
  endpoint: string;
  status: number;
  latency_ms: number;
  created_at: string;
};

export default function ApiPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Onboarding
  const [teamName, setTeamName] = useState("");
  const [teamType, setTeamType] = useState("Engineer");
  const [onboarded, setOnboarded] = useState(false);

  // Keys
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);

  // Analytics
  const [usage, setUsage] = useState<UsageRecord[]>([]);
  const [activeKeyStats, setActiveKeyStats] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase
          .from("api_keys")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (data && data.length > 0) {
          setKeys(data);
          setOnboarded(true);
          setActiveKeyStats(data[0].id);
        }

        // Load usage records (last 30 days)
        const { data: usageData } = await supabase
          .from("api_usage")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(500);
        if (usageData) setUsage(usageData);
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api` },
    });
  };

  const createTeam = async () => {
    if (!teamName.trim()) return;
    setOnboarded(true);
  };

  const generateKey = async () => {
    if (!user) return;
    setGenerating(true);
    const randomPart = Array.from({ length: 32 }, () =>
      "abcdefghijklmnopqrstuvwxyz0123456789".charAt(Math.floor(Math.random() * 36))
    ).join("");
    const newKey = `gyra_${randomPart}`;

    const { data, error } = await supabase
      .from("api_keys")
      .insert([
        {
          user_id: user.id,
          key: newKey,
          name: teamName || "default",
          active: true,
          revoked: false,
          request_count: 0,
        },
      ])
      .select()
      .single();

    setGenerating(false);
    if (error) {
      alert("Failed to generate key. Please try again.");
      return;
    }
    setKeys([data, ...keys]);
    setNewlyGeneratedKey(newKey);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const revokeKey = async (id: string) => {
    const { error } = await supabase
      .from("api_keys")
      .update({ active: false, revoked: true, revoked_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) {
      setKeys(keys.map((k) => (k.id === id ? { ...k, active: false, revoked: true } : k)));
    }
    setRevokeTarget(null);
  };

  const deleteKey = async (id: string) => {
    if (!confirm("Permanently delete this key?")) return;
    const { error } = await supabase.from("api_keys").delete().eq("id", id);
    if (!error) setKeys(keys.filter((k) => k.id !== id));
  };

  const formatDate = (d: string | null) => {
    if (!d) return "Never";
    const date = new Date(d);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // ============================================================
  // ANALYTICS CALCULATIONS
  // ============================================================
  const usageForActiveKey = activeKeyStats
    ? usage.filter((u) => u.api_key_id === activeKeyStats)
    : usage;

  const totalRequests = usageForActiveKey.length;
  const avgLatency =
    usageForActiveKey.length > 0
      ? Math.round(
          usageForActiveKey.reduce((a, u) => a + (u.latency_ms || 0), 0) /
            usageForActiveKey.length
        )
      : 0;
  const errorCount = usageForActiveKey.filter((u) => u.status >= 400).length;
  const errorRate =
    totalRequests > 0 ? ((errorCount / totalRequests) * 100).toFixed(1) : "0.0";

  // Requests per day (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
  const requestsPerDay = last7Days.map((day) => ({
    day,
    count: usage.filter((u) => u.created_at.startsWith(day)).length,
  }));
  const maxPerDay = Math.max(1, ...requestsPerDay.map((r) => r.count));

  // Last 10 requests
  const recentRequests = usage.slice(0, 10);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[160px]" />
      </div>

      {/* NAV */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-6 border-b border-white/5 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={28} animated={false} />
          <span className="font-bold tracking-widest text-sm">GYRA</span>
          <span className="text-zinc-600 text-xs tracking-widest">API</span>
        </Link>
        <div className="flex items-center gap-6 text-sm text-zinc-400">
          <Link href="/docs" className="hover:text-white transition-colors">
            Docs
          </Link>
          <Link
            href="/playground"
            className="hover:text-white transition-colors"
          >
            Playground
          </Link>
          <Link href="/status" className="hover:text-white transition-colors">
            Status
          </Link>
          {!user ? (
            <button
              onClick={handleLogin}
              className="bg-white text-black px-4 py-1.5 rounded-full font-medium hover:bg-zinc-200 transition-colors"
            >
              Sign in
            </button>
          ) : (
            <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold">
              {user.email[0].toUpperCase()}
            </div>
          )}
        </div>
      </nav>

      {/* NOT LOGGED IN */}
      {!user && (
        <>
          <section className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-20 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs tracking-[0.3em] text-zinc-500 uppercase mb-3">
                Gyra API
              </p>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
                Build with Gyra.
              </h1>
              <p className="text-zinc-400 mb-8 leading-relaxed">
                Generate text and code, analyze images, and build voice agents
                — all through one clean API. Free keys, OpenAI-compatible
                responses.
              </p>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={handleLogin}
                  className="bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-zinc-200 transition-colors"
                >
                  Get your API key
                </button>
                <Link
                  href="/docs"
                  className="bg-zinc-900 border border-zinc-800 px-6 py-3 rounded-full font-medium hover:bg-zinc-800 transition-colors"
                >
                  Read the docs
                </Link>
              </div>
              <div className="flex flex-col gap-2 mt-8 text-sm text-zinc-400">
                <p>✓ Works with your existing SDK</p>
                <p>✓ Completely free — no credit card needed</p>
                <p>✓ Playground included with every account</p>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 font-mono text-xs overflow-x-auto">
              <div className="flex items-center gap-1.5 mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
              </div>
              <pre className="text-zinc-300 leading-relaxed">
{`import os
from gyra_sdk import Client

client = Client(api_key=os.getenv("GYRA_API_KEY"))

chat = client.chat.create(model="gyra-1.0")
chat.append(user("Explain quantum computing"))
response = chat.sample()
print(response.content)`}
              </pre>
            </div>
          </section>

          <section className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-20 border-t border-white/5">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
              Everything you can build with the API
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                { icon: "</>", title: "Code", desc: "Intelligent coding models for software engineering and automation." },
                { icon: "≡", title: "Text generation", desc: "Powerful text and reasoning models for chat, analysis, and research." },
                { icon: "🔍", title: "Live web search", desc: "Real-time search via Tavily, pulling fresh data from the web." },
                { icon: "📁", title: "Files & documents", desc: "Upload documents and let Gyra reason over them." },
                { icon: "🖼️", title: "Imagine API", desc: "Generate and edit images from a single API call." },
                { icon: "🎙️", title: "Voice API", desc: "Build realtime voice agents with speech-to-speech." },
              ].map((f) => (
                <div key={f.title} className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-400 shrink-0">
                    {f.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{f.title}</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* LOGGED IN — DASHBOARD */}
      {user && onboarded && (
        <section className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tighter mb-1">
                Developer Console
              </h1>
              <p className="text-zinc-500 text-sm">
                {keys.length} key{keys.length !== 1 ? "s" : ""} ·{" "}
                {keys.filter((k) => k.active && !k.revoked).length} active
              </p>
            </div>
            <button
              onClick={generateKey}
              disabled={generating}
              className="bg-white text-black px-5 py-2.5 rounded-full font-medium text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {generating ? "Generating..." : "+ New Key"}
            </button>
          </div>

          {/* Newly generated key */}
          {newlyGeneratedKey && (
            <div className="bg-blue-950/40 border border-blue-500/30 rounded-2xl p-6 mb-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <p className="text-sm font-medium text-blue-200">
                  New key generated — copy it now
                </p>
              </div>
              <div className="bg-black border border-zinc-800 rounded-xl p-4 mb-3 font-mono text-xs break-all text-zinc-300">
                {newlyGeneratedKey}
              </div>
              <button
                onClick={() => copyToClipboard(newlyGeneratedKey, "new")}
                className="w-full bg-white text-black py-2.5 rounded-full font-medium text-sm hover:bg-zinc-200 transition-colors"
              >
                {copied === "new" ? "✓ Copied!" : "Copy API Key"}
              </button>
              <p className="text-xs text-red-400 text-center mt-3">
                ⚠️ Store this key safely. You will not see it again.
              </p>
              <button
                onClick={() => setNewlyGeneratedKey(null)}
                className="text-xs text-zinc-500 hover:text-white mt-3 mx-auto block transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* ANALYTICS SECTION */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Requests", value: totalRequests, color: "text-blue-400" },
              { label: "Avg Latency", value: `${avgLatency}ms`, color: "text-green-400" },
              { label: "Error Rate", value: `${errorRate}%`, color: errorCount > 0 ? "text-yellow-400" : "text-green-400" },
              { label: "Active Keys", value: keys.filter((k) => k.active && !k.revoked).length, color: "text-purple-400" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5"
              >
                <p className="text-[10px] tracking-wider text-zinc-500 uppercase mb-2">
                  {stat.label}
                </p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* CHART + RECENT REQUESTS */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Chart */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm font-semibold">Requests · Last 7 days</p>
              </div>
              <div className="flex items-end gap-2 h-32 mb-3">
                {requestsPerDay.map((r) => (
                  <div key={r.day} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-blue-500/60 hover:bg-blue-400 rounded-t transition-colors"
                      style={{
                        height: `${Math.max(4, (r.count / maxPerDay) * 100)}%`,
                      }}
                    />
                    <span className="text-[10px] text-zinc-600">
                      {new Date(r.day).toLocaleDateString("en-US", {
                        weekday: "short",
                      })}
                    </span>
                  </div>
                ))}
              </div>
              {totalRequests === 0 && (
                <p className="text-xs text-zinc-600 text-center mt-2 italic">
                  No requests yet — start using your API key
                </p>
              )}
            </div>

            {/* Recent requests */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
              <p className="text-sm font-semibold mb-4">Recent Requests</p>
              {recentRequests.length === 0 ? (
                <p className="text-xs text-zinc-600 italic">
                  No requests yet.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {recentRequests.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between text-xs py-2 border-b border-zinc-800/50 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            r.status < 400 ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                        <span className="font-mono text-zinc-400">
                          {r.endpoint}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-zinc-500">
                        <span>{r.latency_ms}ms</span>
                        <span>{formatDate(r.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* API KEYS LIST */}
          <h2 className="text-xl font-bold mb-4 mt-12">Your API Keys</h2>
          {keys.length === 0 ? (
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-12 text-center">
              <p className="text-zinc-400 mb-4">
                You don&apos;t have any API keys yet.
              </p>
              <button
                onClick={generateKey}
                className="bg-white text-black px-5 py-2.5 rounded-full font-medium text-sm"
              >
                Generate your first key
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {keys.map((k) => (
                <div
                  key={k.id}
                  className={`bg-zinc-950 border rounded-2xl p-5 transition-colors ${
                    k.revoked
                      ? "border-red-500/30 opacity-60"
                      : "border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold">{k.name}</p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            k.revoked
                              ? "bg-red-500/20 text-red-400"
                              : "bg-green-500/20 text-green-400"
                          }`}
                        >
                          {k.revoked ? "Revoked" : "Active"}
                        </span>
                      </div>
                      <p className="font-mono text-xs text-zinc-500 break-all">
                        {k.key.substring(0, 16)}••••••••••••••••
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {!k.revoked && (
                        <button
                          onClick={() => copyToClipboard(k.key, k.id)}
                          className="text-xs px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full hover:bg-zinc-800 transition-colors"
                        >
                          {copied === k.id ? "✓ Copied" : "Copy"}
                        </button>
                      )}
                      {!k.revoked ? (
                        <button
                          onClick={() => setRevokeTarget(k.id)}
                          className="text-xs px-3 py-1.5 bg-red-600/20 border border-red-600/50 text-red-400 rounded-full hover:bg-red-600/30 transition-colors"
                        >
                          Revoke
                        </button>
                      ) : (
                        <button
                          onClick={() => deleteKey(k.id)}
                          className="text-xs px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-full hover:bg-zinc-800 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-800/50">
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                        Requests
                      </p>
                      <p className="text-lg font-bold">{k.request_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                        Last Used
                      </p>
                      <p className="text-sm font-medium text-zinc-300">
                        {formatDate(k.last_used)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                        Created
                      </p>
                      <p className="text-sm font-medium text-zinc-300">
                        {formatDate(k.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quickstart */}
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-4">Quickstart</h2>
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 font-mono text-xs overflow-x-auto">
              <pre className="text-zinc-300 leading-relaxed">
{`curl https://gyra.ng/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{"messages":[{"role":"user","content":"Hello Gyra!"}]}'`}
              </pre>
            </div>
            <div className="flex gap-4 mt-4">
              <Link
                href="/docs"
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                See full docs →
              </Link>
              <Link
                href="/playground"
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Try the playground →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ONBOARDING */}
      {user && !onboarded && (
        <section className="relative z-10 max-w-xl mx-auto px-6 py-20">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-2xl font-bold mb-2">Create your team</h2>
            <p className="text-zinc-400 text-sm mb-6">
              Give your team a name to get started.
            </p>
            <label className="block text-sm text-zinc-400 mb-2">Team name</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Victory's team"
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 mb-6"
            />
            <label className="block text-sm text-zinc-400 mb-2">
              What best describes you?
            </label>
            <div className="flex flex-wrap gap-2 mb-6">
              {["Hobbyist", "Student", "Engineer", "Business", "Other"].map((type) => (
                <button
                  key={type}
                  onClick={() => setTeamType(type)}
                  className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                    teamType === type
                      ? "bg-white text-black border-white"
                      : "bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-600"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <button
              onClick={createTeam}
              disabled={!teamName.trim()}
              className="w-full bg-white text-black py-3 rounded-full font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {/* REVOKE MODAL */}
      {revokeTarget && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-red-500/30 rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-xl font-bold mb-3">Revoke this key?</h3>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              Any application using this key will immediately stop working.
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRevokeTarget(null)}
                className="flex-1 bg-zinc-900 border border-zinc-800 py-3 rounded-full font-medium text-sm hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => revokeKey(revokeTarget)}
                className="flex-1 bg-red-600 hover:bg-red-500 py-3 rounded-full font-medium text-sm transition-colors"
              >
                Revoke
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}