"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "../Logo";
import { supabase } from "../supabase";

const MODELS = [
  { id: "gyra-1.0", label: "Gyra 1.0", desc: "Flagship intelligence" },
  { id: "gyra-lite", label: "Gyra Lite", desc: "Fast responses" },
  { id: "gyra-vision", label: "Gyra Vision", desc: "Image understanding" },
];

const DEFAULT_SYSTEM =
  "You are Gyra, an advanced AI assistant created by Genvia AI Company, owned by Victory Lord. Be helpful, direct, and accurate.";

type Message = { role: "user" | "assistant" | "system"; content: string };

export default function PlaygroundPage() {
  const [user, setUser] = useState<any>(null);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [activeKey, setActiveKey] = useState<string>("");
  const [model, setModel] = useState(MODELS[0].id);
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM);
  const [userInput, setUserInput] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [think, setThink] = useState(false);
  const [search, setSearch] = useState(false);

  const [response, setResponse] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [loading, setLoading] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user || null);
      if (data.user) {
        const { data: keys } = await supabase
          .from("api_keys")
          .select("*")
          .eq("user_id", data.user.id)
          .eq("active", true);
        if (keys && keys.length > 0) {
          setApiKeys(keys);
          setActiveKey(keys[0].key);
        }
      }
    };
    init();
  }, []);

  const run = async () => {
    if (!activeKey) {
      setError("You need an API key to run the playground. Generate one at gyra.ng/api");
      return;
    }
    if (!userInput.trim()) return;

    setLoading(true);
    setError(null);
    setResponse("");
    setReasoning("");
    setLatency(null);
    const started = Date.now();

    const messages: Message[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userInput },
    ];

    try {
      const res = await fetch("/api/v1/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeKey}`,
        },
        body: JSON.stringify({ messages, think, search }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";
      let reason = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed.startsWith("data:")) {
            try {
              const parsed = JSON.parse(trimmed.slice(5).trim());
              if (parsed.reasoning) {
                reason += parsed.reasoning;
                setReasoning(reason);
              }
              if (parsed.token) {
                full += parsed.token;
                setResponse(full);
              }
            } catch (e) {}
          } else {
            // Non-streaming JSON response (fallback)
            try {
              const parsed = JSON.parse(trimmed);
              if (parsed.choices?.[0]?.message?.content) {
                full = parsed.choices[0].message.content;
                setResponse(full);
              }
              if (parsed.error) {
                setError(parsed.error.message || "Request failed");
              }
            } catch (e) {}
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }

    setLatency(Date.now() - started);
    setLoading(false);
  };

  const curlCode = `curl https://gyra.ng/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${activeKey || "gyra_xxxxx"}" \\
  -d '{
    "messages": [
      { "role": "system", "content": "${systemPrompt.replace(/"/g, '\\"')}" },
      { "role": "user", "content": "${userInput.replace(/"/g, '\\"')}" }
    ],
    "think": ${think}
  }'`;

  const jsCode = `const response = await fetch("https://gyra.ng/api/v1/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer ${activeKey || "gyra_xxxxx"}"
  },
  body: JSON.stringify({
    messages: [
      { role: "system", content: ${JSON.stringify(systemPrompt)} },
      { role: "user", content: ${JSON.stringify(userInput)} }
    ],
    think: ${think}
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);`;

  const pyCode = `import requests

response = requests.post(
    "https://gyra.ng/api/v1/chat",
    headers={
        "Content-Type": "application/json",
        "Authorization": "Bearer ${activeKey || "gyra_xxxxx"}"
    },
    json={
        "messages": [
            {"role": "system", "content": ${JSON.stringify(systemPrompt)}},
            {"role": "user", "content": ${JSON.stringify(userInput)}}
        ],
        "think": ${think ? "True" : "False"}
    }
)

print(response.json()["choices"][0]["message"]["content"])`;

  const copyTo = (text: string, tab: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tab);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[160px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-6 border-b border-white/5 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={28} animated={false} />
          <span className="font-bold tracking-widest text-sm">GYRA</span>
          <span className="text-zinc-600 text-xs tracking-widest">
            PLAYGROUND
          </span>
        </Link>
        <div className="flex items-center gap-6 text-sm text-zinc-400">
          <Link href="/docs" className="hover:text-white transition-colors">
            Docs
          </Link>
          <Link href="/api" className="hover:text-white transition-colors">
            API Keys
          </Link>
          <Link href="/" className="hover:text-white transition-colors">
            ← Back
          </Link>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-12">
        <div className="mb-10">
          <p className="text-xs tracking-[0.3em] text-zinc-500 uppercase mb-3">
            Playground
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
            Test Gyra in real time
          </h1>
          <p className="text-zinc-400 max-w-2xl leading-relaxed">
            Experiment with the Gyra API — pick a model, write a prompt, and
            see live responses. Copy the code for your language of choice.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* LEFT — CONFIG */}
          <div className="flex flex-col gap-6">
            {/* API Key */}
            <div>
              <label className="block text-xs tracking-wider text-zinc-500 uppercase mb-2">
                API Key
              </label>
              {user && apiKeys.length > 0 ? (
                <select
                  value={activeKey}
                  onChange={(e) => setActiveKey(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                >
                  {apiKeys.map((k) => (
                    <option key={k.id} value={k.key}>
                      {k.name} — {k.key.substring(0, 12)}••••
                    </option>
                  ))}
                </select>
              ) : (
                <Link
                  href="/api"
                  className="block bg-zinc-950 border border-zinc-800 hover:border-zinc-600 rounded-xl px-4 py-3 text-sm text-blue-400 transition-colors"
                >
                  Generate a free API key →
                </Link>
              )}
            </div>

            {/* Model */}
            <div>
              <label className="block text-xs tracking-wider text-zinc-500 uppercase mb-2">
                Model
              </label>
              <div className="grid grid-cols-3 gap-2">
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setModel(m.id)}
                    className={`text-left bg-zinc-950 border rounded-xl px-4 py-3 transition-colors ${
                      model === m.id
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-zinc-800 hover:border-zinc-600"
                    }`}
                  >
                    <p className="text-sm font-medium">{m.label}</p>
                    <p className="text-[10px] text-zinc-500 mt-1">{m.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* System prompt */}
            <div>
              <label className="block text-xs tracking-wider text-zinc-500 uppercase mb-2">
                System Instructions
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {/* User input */}
            <div>
              <label className="block text-xs tracking-wider text-zinc-500 uppercase mb-2">
                Your Message
              </label>
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                rows={4}
                placeholder="Ask Gyra anything..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 resize-none placeholder:text-zinc-600"
              />
            </div>

            {/* Parameters */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs tracking-wider text-zinc-500 uppercase mb-2">
                  Temperature: {temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs tracking-wider text-zinc-500 uppercase mb-2">
                  Max Tokens: {maxTokens}
                </label>
                <input
                  type="range"
                  min="64"
                  max="4096"
                  step="64"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="flex gap-2">
              <button
                onClick={() => setThink(!think)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm border transition-colors ${
                  think
                    ? "bg-blue-500/15 border-blue-500 text-blue-300"
                    : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                🧠 Think
              </button>
              <button
                onClick={() => setSearch(!search)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm border transition-colors ${
                  search
                    ? "bg-blue-500/15 border-blue-500 text-blue-300"
                    : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                🌐 Search
              </button>
            </div>

            {/* Run button */}
            <button
              onClick={run}
              disabled={loading || !userInput.trim()}
              className="w-full bg-white text-black py-4 rounded-full font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {loading ? "Running..." : "Run →"}
            </button>
          </div>

          {/* RIGHT — OUTPUT */}
          <div className="flex flex-col gap-6">
            {/* Response */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs tracking-wider text-zinc-500 uppercase">
                  Response
                </label>
                {latency !== null && (
                  <span className="text-xs text-zinc-500 font-mono">
                    {latency}ms
                  </span>
                )}
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 min-h-[200px] text-sm leading-relaxed">
                {error ? (
                  <p className="text-red-400">{error}</p>
                ) : response ? (
                  <p className="text-zinc-200 whitespace-pre-wrap">
                    {response}
                  </p>
                ) : loading ? (
                  <div className="flex items-center gap-2 text-zinc-500">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    Gyra is thinking...
                  </div>
                ) : (
                  <p className="text-zinc-600">
                    Your response will appear here.
                  </p>
                )}
              </div>
            </div>

            {/* Reasoning (if Think is on) */}
            {reasoning && (
              <div>
                <label className="block text-xs tracking-wider text-zinc-500 uppercase mb-2">
                  💭 Reasoning
                </label>
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 text-xs text-zinc-400 italic leading-relaxed max-h-[200px] overflow-y-auto">
                  {reasoning}
                </div>
              </div>
            )}

            {/* Code examples */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs tracking-wider text-zinc-500 uppercase">
                  Copy as code
                </label>
              </div>
              <div className="flex gap-2 mb-3">
                {[
                  { tab: "curl", label: "cURL" },
                  { tab: "js", label: "JavaScript" },
                  { tab: "py", label: "Python" },
                ].map((t) => (
                  <button
                    key={t.tab}
                    onClick={() =>
                      copyTo(
                        t.tab === "curl" ? curlCode : t.tab === "js" ? jsCode : pyCode,
                        t.tab
                      )
                    }
                    className="text-xs bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-full px-4 py-2 transition-colors"
                  >
                    {copiedTab === t.tab ? "✓ Copied!" : `Copy ${t.label}`}
                  </button>
                ))}
              </div>

              <div className="bg-black border border-zinc-800 rounded-xl overflow-hidden">
                <pre className="p-4 text-[10px] font-mono text-zinc-400 overflow-x-auto whitespace-pre max-h-[220px]">
                  {jsCode}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}