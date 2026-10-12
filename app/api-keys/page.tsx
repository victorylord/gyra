"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "../Logo";
import { supabase, getAccessToken } from "../supabase";

type ApiKey = {
  id: string;
  name: string;
  keyPreview: string;
  active: boolean;
  created_at: string;
  last_used: string | null;
  request_count: number;
};

type NewKey = {
  id: string;
  key: string;
  name: string;
  created_at: string;
};

export default function ApiKeysPage() {
  const [user, setUser] = useState<any>(null);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<NewKey | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);

  const load = async () => {
    const token = await getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    const res = await fetch("/api/keys", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) setKeys(data.keys || []);
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    load();
  }, []);

  const createKey = async () => {
    const name = prompt("Name this key (e.g. 'Production', 'Test'):");
    if (name === null) return;
    setCreating(true);

    const token = await getAccessToken();
    if (!token) {
      setCreating(false);
      return;
    }

    const res = await fetch("/api/keys", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: name || "Default key" }),
    });

    const data = await res.json();
    setCreating(false);

    if (res.ok && data?.key) {
      setNewKey(data);
      load();
    } else {
      alert(data?.error?.message || "Could not create key.");
    }
  };

  const revoke = async (id: string) => {
    setConfirmRevokeId(null);
    const token = await getAccessToken();
    if (!token) return;

    const res = await fetch(`/api/keys/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) load();
    else alert("Could not revoke key.");
  };

  const copyKey = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // ============================================================
  // Not signed in
  // ============================================================
  if (!user && !loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-3">Sign in to get an API key</h1>
          <p className="text-zinc-500 text-sm mb-6">
            API keys are tied to your Gyra account. Log in to continue.
          </p>
          <Link
            href="/dashboard"
            className="bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-zinc-200 transition-colors inline-block"
          >
            Sign in →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-blue-500/8 rounded-full blur-[180px]" />
      </div>

      {/* Nav */}
      <div className="relative z-10 border-b border-zinc-800/50 px-6 py-4 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={26} animated={false} />
          <span className="font-bold tracking-widest text-sm">GYRA</span>
          <span className="text-zinc-600 text-xs tracking-widest">API KEYS</span>
        </Link>
        <Link
          href="/api"
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          ← Back to API
        </Link>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-3">
            API Keys
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Create keys to access the Gyra API. Keys are shown only once — copy
            and store them securely. Revoke any key instantly if compromised.
          </p>
        </div>

        {/* New key banner */}
        {newKey && (
          <div className="mb-8 bg-blue-500/5 border border-blue-500/30 rounded-2xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <span className="text-2xl">🔑</span>
              <div className="flex-1">
                <p className="font-semibold mb-1">
                  Your new API key is ready
                </p>
                <p className="text-xs text-blue-300/80">
                  Copy it now. You won't see it again.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-black border border-blue-500/30 rounded-xl p-3 mb-4">
              <code className="text-xs font-mono text-blue-200 break-all flex-1">
                {newKey.key}
              </code>
              <button
                onClick={() => copyKey(newKey.key)}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg shrink-0 font-medium transition-colors"
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>

            <button
              onClick={() => setNewKey(null)}
              className="text-xs text-zinc-500 hover:text-white transition-colors"
            >
              I've saved it →
            </button>
          </div>
        )}

        {/* Create button */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm font-medium text-zinc-400">
            {keys.length} {keys.length === 1 ? "key" : "keys"}
          </p>
          <button
            onClick={createKey}
            disabled={creating}
            className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {creating ? "Creating…" : "+ Create new key"}
          </button>
        </div>

        {/* Keys list */}
        {loading ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : keys.length === 0 ? (
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-12 text-center">
            <div className="text-4xl mb-3 opacity-40">🔑</div>
            <p className="font-medium mb-1">No API keys yet</p>
            <p className="text-xs text-zinc-500 mb-6">
              Create your first key to start building with Gyra.
            </p>
            <button
              onClick={createKey}
              className="bg-white text-black px-6 py-3 rounded-full text-sm font-medium hover:bg-zinc-200 transition-colors"
            >
              Create key
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {keys.map((k) => (
              <div
                key={k.id}
                className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <p className="font-semibold text-sm">{k.name}</p>
                      {k.active ? (
                        <span className="text-[10px] uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-semibold">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase tracking-wider bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full font-semibold">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-zinc-500 truncate">
                      {k.keyPreview}
                    </p>
                  </div>

                  <button
                    onClick={() => setConfirmRevokeId(k.id)}
                    className="shrink-0 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Revoke
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-zinc-500 pt-3 border-t border-zinc-900">
                  <span>
                    Created{" "}
                    {new Date(k.created_at).toLocaleDateString()}
                  </span>
                  <span>
                    {k.last_used
                      ? `Last used ${new Date(
                          k.last_used
                        ).toLocaleDateString()}`
                      : "Never used"}
                  </span>
                  <span>
                    {k.request_count.toLocaleString()} request
                    {k.request_count === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Security tips */}
        <div className="mt-12 bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
          <p className="text-sm font-semibold mb-4 flex items-center gap-2">
            <span>🛡️</span> Security best practices
          </p>
          <ul className="flex flex-col gap-3 text-sm text-zinc-400">
            <li className="flex items-start gap-3">
              <span className="text-zinc-600 mt-0.5">•</span>
              <span>
                Never share your API key in public — GitHub, screenshots, or
                client-side code.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-zinc-600 mt-0.5">•</span>
              <span>
                Store keys in environment variables (e.g.{" "}
                <code className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-xs font-mono text-blue-300">
                  GYRA_API_KEY
                </code>
                ).
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-zinc-600 mt-0.5">•</span>
              <span>
                Create separate keys for each environment — dev, staging, prod.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-zinc-600 mt-0.5">•</span>
              <span>
                Revoke immediately if a key is exposed. Rotation is instant.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Confirm revoke modal */}
      {confirmRevokeId && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-5 mx-auto">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold mb-3">Revoke this key?</h2>
            <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
              Any application using this key will stop working immediately.
              This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRevokeId(null)}
                className="flex-1 border border-zinc-800 hover:border-zinc-600 py-3 rounded-full text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => revoke(confirmRevokeId)}
                className="flex-1 bg-red-600 hover:bg-red-500 py-3 rounded-full text-sm font-medium transition-colors"
              >
                Revoke key
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}