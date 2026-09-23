"use client";

import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function ApiPage() {
  const [user, setUser] = useState<any>(null);
  const [teamName, setTeamName] = useState("");
  const [teamType, setTeamType] = useState("Engineer");
  const [createdTeam, setCreatedTeam] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api` },
    });
  };

  const createTeam = async () => {
    if (!teamName.trim()) return;
    setCreatedTeam(true);
  };

  const generateKey = async () => {
  if (!user) return;
  const randomPart = Array.from({ length: 32 }, () =>
    "abcdefghijklmnopqrstuvwxyz0123456789".charAt(
      Math.floor(Math.random() * 36)
    )
  ).join("");
  const newKey = `gyra_${randomPart}`;

  
  const { error } = await supabase.from("api_keys").insert([
    {
      user_id: user.id,
      key: newKey,
      name: teamName || "default",
    },
  ]);

  if (error) {
    alert("Failed to generate key. Please try again.");
    return;
  }

  setApiKey(newKey);
};

  const copyKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white">
      {/* NAV */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-bold">
            G
          </div>
          <span className="text-lg font-bold tracking-tighter">Gyra API</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <a href="#" className="text-zinc-400 hover:text-white">Docs</a>
          <a href="#" className="text-zinc-400 hover:text-white">Pricing</a>
          {!user ? (
            <button
              onClick={handleLogin}
              className="bg-white text-black px-4 py-1.5 rounded-full font-medium hover:bg-zinc-200 transition-colors"
            >
              Sign in
            </button>
          ) : (
            <span className="text-zinc-400 text-xs">{user.email}</span>
          )}
        </div>
      </nav>

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
          <div className="flex gap-3">
            <button
              onClick={() =>
                document
                  .getElementById("get-key")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-zinc-200 transition-colors"
            >
              Get your API key
            </button>
            <a
              href="/docs"
              className="bg-zinc-900 border border-zinc-800 px-6 py-3 rounded-full font-medium hover:bg-zinc-800 transition-colors inline-block"
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

      {/* GET API KEY SECTION */}
      <section id="get-key" className="max-w-2xl mx-auto px-6 py-20">
        {!user ? (
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Get your API key</h2>
            <p className="text-zinc-400 mb-8">
              Sign in to generate your free API key.
            </p>
            <button
              onClick={handleLogin}
              className="bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-zinc-200 transition-colors"
            >
              Continue with Google
            </button>
          </div>
        ) : !createdTeam ? (
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
              {["Hobbyist", "Student", "Engineer", "Business", "Other"].map(
                (type) => (
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
                )
              )}
            </div>
            <button
              onClick={createTeam}
              className="w-full bg-white text-black py-3 rounded-full font-medium hover:bg-zinc-200 transition-colors"
            >
              Continue
            </button>
          </div>
        ) : !apiKey ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Welcome, {teamName}</h2>
            <p className="text-zinc-400 mb-8">
              You're all set. Generate your free API key now.
            </p>
            <button
              onClick={generateKey}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-medium transition-colors"
            >
              Generate API Key
            </button>
          </div>
        ) : (
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <p className="text-sm text-zinc-400">
                Your API key has been generated
              </p>
            </div>
            <div className="bg-black border border-zinc-800 rounded-xl p-4 mb-4">
              <p className="font-mono text-xs text-zinc-400 break-all">
                {apiKey}
              </p>
            </div>
            <button
              onClick={copyKey}
              className="w-full bg-white text-black py-3 rounded-full font-medium hover:bg-zinc-200 transition-colors mb-4"
            >
              {copied ? "✓ Copied!" : "Copy API Key"}
            </button>
            <p className="text-xs text-red-400 text-center">
              ⚠️ Store this key safely. You will not see it again.
            </p>

            <div className="mt-8 pt-6 border-t border-zinc-800">
              <p className="text-sm text-zinc-400 mb-3">Your keys</p>
              <div className="flex items-center justify-between bg-zinc-900 rounded-xl p-3">
                <div>
                  <p className="text-sm font-medium">production</p>
                  <p className="text-xs text-zinc-500 font-mono">
                    {apiKey.substring(0, 12)}••••••••••
                  </p>
                </div>
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-semibold">
                  Active
                </span>
              </div>
            </div>
          </div>
        )}
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
    </main>
  );
}