"use client";

import { useEffect, useState } from "react";
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

export default function ApiPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Onboarding state
  const [teamName, setTeamName] = useState("");
  const [teamType, setTeamType] = useState("Engineer");
  const [onboarded, setOnboarded] = useState(false);

  // Key state
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Revoke confirmation
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        // If they have keys, they're onboarded
        const { data } = await supabase
          .from("api_keys")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (data && data.length > 0) {
          setKeys(data);
          setOnboarded(true);
        }
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
      setKeys(
        keys.map((k) =>
          k.id === id ? { ...k, active: false, revoked: true } : k
        )
      );
    }
    setRevokeTarget(null);
  };

  const deleteKey = async (id: string) => {
    if (!confirm("Permanently delete this key? This cannot be undone.")) return;
    const { error } = await supabase.from("api_keys").delete().eq("id", id);
    if (!error) {
      setKeys(keys.filter((k) => k.id !== id));
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* NAV */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50 sticky top-0 bg-black/95 backdrop-blur z-30">
        <a href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-bold">
            G
          </div>
          <span className="text-lg font-bold tracking-tighter">Gyra API</span>
        </a>
        <div className="flex items-center gap-4 text-sm">
          <a href="/docs" className="text-zinc-400 hover:text-white transition-colors hidden md:inline">
            Docs
          </a>
          <a href="/dashboard" className="text-zinc-400 hover:text-white transition-colors hidden md:inline">
            Dashboard
          </a>
          {!user ? (
            <button
              onClick={handleLogin}
              className="bg-white text-black px-4 py-1.5 rounded-full font-medium hover:bg-zinc-200 transition-colors"
            >
              Sign in
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold">
                {user.email[0].toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ============ NOT LOGGED IN ============ */}
      {!user && (
        <>
          {/* HERO */}
          <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm text-zinc-500 mb-3">Gyra API</p>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                Build with Gyra.
              </h1>
              <p className="text-zinc-400 mb-8 leading-relaxed">
                Generate text and code, create images and video, build voice
                agents, and search the web in real time, all through one API.
              </p>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={handleLogin}
                  className="bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-zinc-200 transition-colors"
                >
                  Get your API key
                </button>
                <a
                  href="/docs"
                  className="bg-zinc-900 border border-zinc-800 px-6 py-3 rounded-full font-medium hover:bg-zinc-800 transition-colors"
                >
                  Read the docs
                </a>
              </div>
              <div className="flex flex-col gap-2 mt-8 text-sm text-zinc-400">
                <p>✓ Works with your existing SDK</p>
                <p>✓ Completely free — no credit card needed</p>
                <p>✓ Playground included with every account</p>
              </div>
            </div>

            {/* CODE SAMPLE */}
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

          {/* WHAT YOU CAN BUILD */}
          <section className="max-w-6xl mx-auto px-6 py-20 border-t border-zinc-800/50">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
              Everything you can build with the API
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                { icon: "</>", title: "Code", desc: "Intelligent coding models for software engineering, building apps, and orchestrating agents." },
                { icon: "≡", title: "Text generation", desc: "Powerful text and reasoning models for chat, analysis, and problem-solving." },
                { icon: "🔍", title: "Live web search", desc: "Tap into the now with real-time search, pulling fresh data from the web." },
                { icon: "📁", title: "Files & collections", desc: "Upload documents and let Gyra intelligently search and reason over them." },
                { icon: "🖼️", title: "Imagine API", desc: "Generate and edit images, and create video with native audio from one API." },
                { icon: "🎙️", title: "Voice API", desc: "Build realtime voice agents: speech-to-speech, text-to-speech, and speech-to-text." },
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

      {/* ============ LOGGED IN — DASHBOARD ============ */}
      {user && onboarded && (
        <section className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-1">Your API Keys</h1>
              <p className="text-zinc-500 text-sm">
                {keys.length} key{keys.length !== 1 ? "s" : ""} • {keys.filter(k => k.active && !k.revoked).length} active
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

          {/* NEWLY GENERATED KEY HIGHLIGHT */}
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

          {/* KEYS LIST */}
          {keys.length === 0 ? (
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-12 text-center">
              <p className="text-zinc-400 mb-4">You don't have any API keys yet.</p>
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

                  {/* STATS */}
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

          {/* QUICKSTART SNIPPET */}
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
            <a
              href="/docs"
              className="text-sm text-blue-400 hover:text-blue-300 mt-4 inline-block"
            >
              See full docs →
            </a>
          </div>
        </section>
      )}

      {/* ============ LOGGED IN — ONBOARDING ============ */}
      {user && !onboarded && (
        <section className="max-w-xl mx-auto px-6 py-20">
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

      {/* REVOKE CONFIRMATION MODAL */}
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