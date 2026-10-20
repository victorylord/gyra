"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Logo from "../Logo";
import { supabase } from "../supabase";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

type Tab = "chat" | "media" | "network";

type Endpoint = {
  id: string;
  category: Tab;
  method: "GET" | "POST";
  path: string;
  title: string;
  description: string;
  defaultBody: string;
  cost: number;
};

const ENDPOINTS: Endpoint[] = [
  {
    id: "chat",
    category: "chat",
    method: "POST",
    path: "/api/v1/chat",
    title: "Chat Completions",
    description: "Streaming chat with any Gyra model",
    defaultBody: JSON.stringify(
      {
        messages: [
          { role: "system", content: "You are Gyra, a helpful AI assistant." },
          { role: "user", content: "Explain quantum computing like I'm 5" },
        ],
        think: false,
        search: false,
      },
      null,
      2
    ),
    cost: 0,
  },
  {
    id: "music-search",
    category: "media",
    method: "POST",
    path: "/api/v1/media/music/search",
    title: "Music Search",
    description: "Search Spotify tracks, artists, and albums",
    defaultBody: JSON.stringify(
      { q: "Wizkid Essence", type: "track", limit: 5 },
      null,
      2
    ),
    cost: 0.9,
  },
  {
    id: "youtube-transcript",
    category: "media",
    method: "POST",
    path: "/api/v1/media/youtube/transcript",
    title: "YouTube Transcript",
    description: "Fetch public captions from any video",
    defaultBody: JSON.stringify(
      { url: "https://youtube.com/watch?v=dQw4w9WgXcQ" },
      null,
      2
    ),
    cost: 0.9,
  },
  {
    id: "tiktok-metadata",
    category: "media",
    method: "POST",
    path: "/api/v1/media/tiktok/metadata",
    title: "TikTok Metadata",
    description: "Get title, author, and thumbnail",
    defaultBody: JSON.stringify(
      { url: "https://www.tiktok.com/@tiktok/video/7010000000000000000" },
      null,
      2
    ),
    cost: 0.9,
  },
];

const CHAT_PLACEHOLDERS = [
  "Explain quantum computing like I'm 5...",
  "Write a cold email to a Nigerian fintech CEO...",
  "Debug this JavaScript: const x = [1,2,3].map(...",
  "Give me 10 business ideas for Lagos...",
  "Translate 'good morning' to Yoruba, Igbo, Hausa...",
  "Write a poem about jollof rice...",
];

export default function PlaygroundPage() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [activeEndpointId, setActiveEndpointId] = useState("chat");
  const [apiKey, setApiKey] = useState("");
  const [userKeys, setUserKeys] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [requestBody, setRequestBody] = useState(
    ENDPOINTS.find((e) => e.id === "chat")!.defaultBody
  );
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  
  // PRO FEATURE: Metrics
  const [latency, setLatency] = useState<number | null>(null);
  const [payloadSize, setPayloadSize] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [streamingCursor, setStreamingCursor] = useState(true);
  const [copied, setCopied] = useState(false);
  
  // PRO FEATURE: Code Generator State
  const [codeLang, setCodeLang] = useState<"curl" | "javascript" | "python">("curl");
  const [copiedCode, setCopiedCode] = useState(false);

  const responseRef = useRef<HTMLDivElement>(null);

  const activeEndpoint =
    ENDPOINTS.find((e) => e.id === activeEndpointId) || ENDPOINTS[0];

  // Load user + keys
  useEffect(() => {
    const init = async () => {
      const { data: auth } = await supabase.auth.getUser();
      setUser(auth.user);
      if (auth.user) {
        const { data: keys } = await supabase
          .from("api_keys")
          .select("*")
          .eq("user_id", auth.user.id)
          .eq("active", true);
        if (keys) setUserKeys(keys);
      }
    };
    init();
  }, []);

  // UI Polish: Rotate placeholders
  useEffect(() => {
    const t = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % CHAT_PLACEHOLDERS.length);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  // UI Polish: Blinking cursor
  useEffect(() => {
    const t = setInterval(() => setStreamingCursor((c) => !c), 500);
    return () => clearInterval(t);
  }, []);

  // Auto-scroll response
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [response]);

  const switchEndpoint = (id: string) => {
    const ep = ENDPOINTS.find((e) => e.id === id);
    if (!ep) return;
    setActiveEndpointId(id);
    setRequestBody(ep.defaultBody);
    setResponse("");
    setError(null);
    setLatency(null);
    setPayloadSize(null);
    setStatusCode(null);
  };

  const switchCategory = (cat: Tab) => {
    setActiveTab(cat);
    const first = ENDPOINTS.find((e) => e.category === cat);
    if (first) switchEndpoint(first.id);
  };

  // PRO FEATURE: The Run Function
  const run = async () => {
    if (loading) return;

    const keyToUse = apiKey.trim();

    if (!keyToUse) {
      setError(
        userKeys.length > 0
          ? "Select or paste an API key to run this request."
          : "You need an API key. Generate one at gyra.ng/api-keys"
      );
      return;
    }

    if (activeEndpoint.category === "media" && !keyToUse.startsWith("gyramedia_")) {
      setError("This endpoint requires a media API key (starts with gyramedia_).");
      return;
    }

    if (activeEndpoint.category === "chat" && !keyToUse.startsWith("gyra_")) {
      setError("This endpoint requires an AI API key (starts with gyra_).");
      return;
    }

    let parsedBody: any;
    try {
      parsedBody = JSON.parse(requestBody);
    } catch {
      setError("Request body must be valid JSON.");
      return;
    }

    setLoading(true);
    setResponse("");
    setError(null);
    setStatusCode(null);
    setLatency(null);
    setPayloadSize(null);
    const started = Date.now();

    try {
      const res = await fetch(activeEndpoint.path, {
        method: activeEndpoint.method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${keyToUse}`,
        },
        body: activeEndpoint.method === "POST" ? JSON.stringify(parsedBody) : undefined,
      });

      setStatusCode(res.status);
      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("text/event-stream")) {
        if (!res.body) throw new Error("No response body");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let full = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (!data) continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.token) {
                full += parsed.token;
                setResponse(full);
              }
            } catch {}
          }
        }
        if (!full) setResponse("(empty response)");
        
        // Calculate size for stream
        const sizeKB = (new Blob([full]).size / 1024).toFixed(1);
        setPayloadSize(`${sizeKB} KB`);

      } else {
        const data = await res.json();
        const responseString = JSON.stringify(data, null, 2);
        setResponse(responseString);
        
        // Calculate size for JSON
        const sizeKB = (new Blob([responseString]).size / 1024).toFixed(1);
        setPayloadSize(`${sizeKB} KB`);
      }
    } catch (err: any) {
      setError(err?.message || "Request failed.");
    }

    setLatency(Date.now() - started);
    setLoading(false);
  };

  // Keyboard Shortcut (Cmd/Ctrl + Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        run();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [requestBody, apiKey, activeEndpoint]); // Dependencies for `run`

  const copyResponse = async () => {
    try {
      await navigator.clipboard.writeText(response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // PRO FEATURE: Code Generator Logic
  const generateCode = useCallback(() => {
    const url = `https://api.gyra.ng${activeEndpoint.path}`;
    const method = activeEndpoint.method;
    const safeBody = requestBody.replace(/\n/g, ' ').replace(/\s+/g, ' ');

    if (codeLang === 'curl') {
      return `curl -X ${method} "${url}" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${safeBody}'`;
    }
    
    if (codeLang === 'javascript') {
      return `fetch("${url}", {
  method: "${method}",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify(${requestBody})
})
.then(res => res.json())
.then(data => console.log(data));`;
    }
    
    if (codeLang === 'python') {
       return `import requests

url = "${url}"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = ${requestBody}

response = requests.${method.toLowerCase()}(url, headers=headers, json=payload)
print(response.json())`;
    }
  }, [activeEndpoint, requestBody, codeLang]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(generateCode() || '');
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  };

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-blue-500/6 rounded-full blur-[200px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-30 border-b border-white/5 backdrop-blur-sm bg-black/60 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Logo size={26} animated={false} />
            <span className="font-bold tracking-widest text-sm">GYRA</span>
            <span className="text-zinc-600 text-xs tracking-widest">PLAYGROUND</span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-zinc-400">
            <Link href="/api" className="hover:text-white transition-colors">API</Link>
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
            <Link href="/console" className="hover:text-white transition-colors">Console</Link>
            <span className="hidden md:flex items-center gap-2 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400">Live</span>
            </span>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-10">
        <div className="mb-8">
          <p className="text-xs tracking-[0.3em] text-zinc-500 uppercase mb-3">Live Terminal</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-3">Test any Gyra endpoint</h1>
          <p className="text-zinc-400 max-w-2xl leading-relaxed">
            Real API calls against the live Gyra platform. No account needed — just paste any Gyra API key and hit <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] text-zinc-300 font-mono border border-zinc-700">⌘ + Enter</kbd>.
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: "chat" as const, label: "AI API", icon: "🧠" },
            { id: "media" as const, label: "Media API", icon: "🎬" },
            { id: "network" as const, label: "Network API", icon: "🌐" },
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => switchCategory(c.id)}
              disabled={c.id === "network"}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === c.id
                  ? "bg-white text-black"
                  : c.id === "network"
                  ? "bg-zinc-950 text-zinc-600 border border-zinc-900 cursor-not-allowed"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              <span>{c.icon}</span>
              {c.label}
              {c.id === "network" && <span className="text-[9px] uppercase tracking-wider">Soon</span>}
            </button>
          ))}
        </div>

        {/* Endpoint picker */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {ENDPOINTS.filter((e) => e.category === activeTab).map((e) => (
            <button
              key={e.id}
              onClick={() => switchEndpoint(e.id)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeEndpointId === e.id
                  ? "bg-blue-500/15 text-blue-300 border border-blue-500/40"
                  : "bg-zinc-950 text-zinc-500 hover:text-white border border-zinc-800"
              }`}
            >
              <span className={`text-[10px] font-mono ${e.method === "GET" ? "text-green-400" : "text-blue-400"}`}>
                {e.method}
              </span>
              {e.title}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEFT — REQUEST */}
          <div className="flex flex-col gap-5">
            {/* Endpoint info */}
            <div className="bg-zinc-950/60 backdrop-blur-sm border border-white/5 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-[10px] font-mono px-2 py-1 rounded ${activeEndpoint.method === "GET" ? "bg-green-500/10 text-green-400" : "bg-blue-500/10 text-blue-400"}`}>
                  {activeEndpoint.method}
                </span>
                <code className="text-xs font-mono text-zinc-400 truncate">{activeEndpoint.path}</code>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                {activeEndpoint.description}
                {activeEndpoint.cost > 0 && (
                  <> · <span className="text-amber-400">${activeEndpoint.cost.toFixed(2)} / request</span></>
                )}
              </p>
            </div>

            {/* API key input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] tracking-[0.2em] text-zinc-500 uppercase">API Key</label>
                {userKeys.length > 0 && (
                  <select
                    onChange={(e) => setApiKey(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] px-2 py-1 text-zinc-400 outline-none"
                  >
                    <option value="">— use one of mine —</option>
                    {userKeys.map((k) => (
                      <option key={k.id} value={k.key}>{k.name} ({k.category})</option>
                    ))}
                  </select>
                )}
              </div>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste your key — gyra_xxx or gyramedia_xxx"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-mono text-zinc-300 outline-none focus:border-blue-500 placeholder:text-zinc-700"
                spellCheck={false}
              />
              <p className="text-[10px] text-zinc-600 mt-2">
                {userKeys.length === 0 && (
                  <>No account? <Link href="/api-keys" className="text-blue-400 hover:underline">Generate a free key →</Link></>
                )}
                {userKeys.length > 0 && <>Your keys are loaded automatically when you sign in.</>}
              </p>
            </div>

            {/* Request body */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] tracking-[0.2em] text-zinc-500 uppercase">Request Body (JSON)</label>
                <span className="text-[10px] text-zinc-600 font-mono">{requestBody.length} chars</span>
              </div>
              
              <div className="relative group">
                <textarea
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  rows={14}
                  className="w-full bg-[#1e1e1e] border border-zinc-800 rounded-2xl px-4 py-3 text-xs font-mono text-green-300/90 outline-none focus:border-blue-500 resize-none leading-relaxed"
                  spellCheck={false}
                />
                {/* Visual cue that it's editable */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <span className="text-[9px] text-zinc-500 bg-zinc-900/80 px-2 py-1 rounded">Editable</span>
                </div>
              </div>
            </div>

            {/* Run */}
            <button
              onClick={run}
              disabled={loading}
              className="w-full bg-white text-black py-4 rounded-full font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Running request…
                </>
              ) : (
                <>
                  Run request
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {/* RIGHT — RESPONSE */}
          <div className="flex flex-col gap-5">
            
            {/* Status bar */}
            <div className="bg-zinc-950/60 backdrop-blur-sm border border-white/5 rounded-2xl px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4 text-[10px] uppercase tracking-wider">
                <span className="text-zinc-500">Status</span>
                {statusCode === null ? (
                  <span className="text-zinc-600 font-mono">—</span>
                ) : statusCode >= 200 && statusCode < 300 ? (
                  <span className="text-green-400 font-mono font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    {statusCode} OK
                  </span>
                ) : (
                  <span className="text-red-400 font-mono font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    {statusCode}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                {latency !== null && (
                  <span className="text-[10px] font-mono text-zinc-500">{latency}ms</span>
                )}
                {payloadSize && (
                  <span className="text-[10px] font-mono text-zinc-500">{payloadSize}</span>
                )}
              </div>
            </div>

            {/* Response viewer */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] tracking-[0.2em] text-zinc-500 uppercase">Response</label>
                {response && (
                  <button
                    onClick={copyResponse}
                    className="text-[10px] text-zinc-500 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    {copied ? "✓ Copied" : "Copy"}
                  </button>
                )}
              </div>
              <div
                ref={responseRef}
                className="flex-1 min-h-[300px] max-h-[400px] overflow-y-auto bg-[#1e1e1e] border border-zinc-800 rounded-2xl p-5 text-xs font-mono leading-relaxed"
              >
                {error ? (
                  <div className="text-red-400 whitespace-pre-wrap">{error}</div>
                ) : response ? (
                  <div className="whitespace-pre-wrap break-words text-zinc-300">
                    {response}
                    {loading && streamingCursor && (
                      <span className="inline-block w-2 h-3.5 bg-blue-400 ml-0.5 align-middle animate-pulse" />
                    )}
                  </div>
                ) : loading ? (
                  <div className="flex items-center gap-2 text-blue-400">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    <span>Waiting for response</span>
                    <span>{streamingCursor ? "▎" : " "}</span>
                  </div>
                ) : (
                  <div className="text-zinc-600">
                    <div className="mb-4 text-zinc-700">
                      <span className="text-green-500">$</span>{" "}
                      <span className="text-zinc-500">gyra {activeEndpoint.method.toLowerCase()} {activeEndpoint.path}</span>
                    </div>
                    <div className="text-zinc-700 italic">Press Run to send the request.</div>
                    <div className="mt-4 text-zinc-800">
                      {CHAT_PLACEHOLDERS[placeholderIndex]}
                      {streamingCursor ? "▎" : " "}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* PRO FEATURE: CODE GENERATOR */}
            <div className="bg-[#1e1e1e] border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-zinc-800">
                <div className="flex gap-2">
                  {['curl', 'javascript', 'python'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setCodeLang(lang as any)}
                      className={`px-3 py-1 text-[10px] rounded-md font-medium transition-colors ${
                        codeLang === lang 
                          ? 'bg-zinc-700 text-white' 
                          : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      {lang === 'javascript' ? 'Node.js' : lang.toUpperCase()}
                    </button>
                  ))}
                </div>
                <button
                  onClick={copyCode}
                  className="text-[10px] text-zinc-400 hover:text-white transition-colors"
                >
                  {copiedCode ? "✓ Copied Code" : "Copy Code"}
                </button>
              </div>
              <div className="max-h-[300px] overflow-y-auto text-xs">
                <SyntaxHighlighter
                  language={codeLang === 'javascript' ? 'javascript' : codeLang}
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    padding: '1.25rem',
                    background: 'transparent',
                  }}
                >
                  {generateCode() || ''}
                </SyntaxHighlighter>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}