"use client";

import { useState } from "react";
import Link from "next/link";
import GyraMark from "../components/GyraMark";
import VideoHero from "../components/VideoHero";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const SECTIONS = [
  "Introduction",
  "Getting Started",
  "API Reference",
  "Models",
  "SDKs",
  "Examples",
  "Changelog",
  "Support",
];

// PRO FEATURE: Advanced CodeBlock with Tabs
type CodeSnippet = { language: string; label: string; code: string };

function CodeBlock({ snippets }: { snippets: CodeSnippet[] }) {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(snippets[activeTab].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-[#1e1e1e] border border-zinc-800 rounded-xl my-6 overflow-hidden shadow-2xl">
      {/* Tabs Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-[#252526] pr-2">
        <div className="flex overflow-x-auto custom-scrollbar">
          {snippets.map((snippet, idx) => (
            <button
              key={snippet.label}
              onClick={() => setActiveTab(idx)}
              className={`px-4 py-2.5 text-xs font-medium transition-colors border-r border-zinc-800/50 whitespace-nowrap ${
                activeTab === idx
                  ? "bg-[#1e1e1e] text-white border-b-2 border-b-blue-500"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-[#2d2d2d]"
              }`}
            >
              {snippet.label}
            </button>
          ))}
        </div>
        <button
          onClick={copy}
          className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-md transition-colors flex items-center gap-2 shrink-0"
        >
          {copied ? (
            <span className="text-green-400">✓ Copied</span>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      
      {/* Code Area */}
      <div className="overflow-x-auto text-[13px]">
        <SyntaxHighlighter
          language={snippets[activeTab].language}
          style={vscDarkPlus}
          customStyle={{ margin: 0, padding: "1.25rem", background: "transparent" }}
        >
          {snippets[activeTab].code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("Introduction");
  const [searchQuery, setSearchQuery] = useState("");

  const renderContent = () => {
    switch (activeSection) {
      case "Introduction":
        return (
          <div>
            <h1 className="text-4xl font-bold tracking-tighter mb-4 text-white">Gyra Documentation</h1>
            <p className="text-zinc-400 leading-relaxed mb-8 text-lg">
              Welcome to the official Gyra documentation. Gyra is a multimodal
              intelligence platform — chat, vision, files, voice, and a
              developer API, all under one intelligence layer.
            </p>

            <div className="grid md:grid-cols-2 gap-4 my-10">
              {[
                { title: "Getting Started", desc: "Create an account and make your first API call.", target: "Getting Started" },
                { title: "API Reference", desc: "Every endpoint and parameter.", target: "API Reference" },
                { title: "Models", desc: "Gyra-1, Gyra-Lite, Gyra-Vision, Gyra-Voice.", target: "Models" },
                { title: "SDKs & Examples", desc: "Python, JavaScript, cURL, and frameworks.", target: "SDKs" },
              ].map((card) => (
                <button
                  key={card.title}
                  onClick={() => setActiveSection(card.target)}
                  className="text-left bg-zinc-900/50 border border-zinc-800 hover:border-blue-500/50 rounded-xl p-5 transition-colors group"
                >
                  <p className="font-semibold mb-1 text-white group-hover:text-blue-400 transition-colors">{card.title}</p>
                  <p className="text-xs text-zinc-500">{card.desc}</p>
                </button>
              ))}
            </div>

            <h2 className="text-xl font-bold mt-10 mb-3 text-white">Base URL</h2>
            <CodeBlock snippets={[{ label: "HTTP", language: "http", code: `https://gyra.ng/api/v1` }]} />
          </div>
        );

      case "Getting Started":
        return (
          <div>
            <h1 className="text-4xl font-bold tracking-tighter mb-4 text-white">Getting Started</h1>
            <p className="text-zinc-400 leading-relaxed mb-8">Follow these steps to make your first request to Gyra.</p>

            <h2 className="text-xl font-bold mt-8 mb-3 text-white">Step 1 — Create your account</h2>
            <p className="text-sm text-zinc-400 leading-relaxed mb-4">
              Visit <Link href="/api" className="text-blue-400 hover:underline">gyra.ng/api</Link> and sign in with Google.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-3 text-white">Step 2 — Generate an API key</h2>
            <p className="text-sm text-zinc-400 leading-relaxed mb-4">Your key starts with <code className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-blue-400 text-xs">gyra_</code>.</p>

            <h2 className="text-xl font-bold mt-8 mb-3 text-white">Step 3 — Make your first request</h2>
            <CodeBlock
              snippets={[
                {
                  label: "cURL",
                  language: "bash",
                  code: `curl https://gyra.ng/api/v1/chat \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer gyra_xxxxx" \\\n  -d '{"messages": [{"role": "user", "content": "Hello Gyra!"}]}'`,
                },
                {
                  label: "Node.js",
                  language: "javascript",
                  code: `const response = await fetch("https://gyra.ng/api/v1/chat", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    "Authorization": "Bearer gyra_xxxxx"\n  },\n  body: JSON.stringify({\n    messages: [{ role: "user", content: "Hello Gyra!" }]\n  })\n});\n\nconst data = await response.json();\nconsole.log(data.choices[0].message.content);`,
                },
                {
                  label: "Python",
                  language: "python",
                  code: `import requests\n\nresponse = requests.post(\n    "https://gyra.ng/api/v1/chat",\n    headers={\n        "Content-Type": "application/json",\n        "Authorization": "Bearer gyra_xxxxx"\n    },\n    json={\n        "messages": [{"role": "user", "content": "Hello Gyra!"}]\n    }\n)\n\nprint(response.json()["choices"][0]["message"]["content"])`,
                },
              ]}
            />
          </div>
        );

      case "API Reference":
        return (
          <div>
            <h1 className="text-4xl font-bold tracking-tighter mb-4 text-white">API Reference</h1>
            <p className="text-zinc-400 leading-relaxed mb-6">
              Base URL: <code className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-blue-400 text-xs">https://gyra.ng/api/v1</code>
            </p>

            <h2 className="text-xl font-bold mt-8 mb-3 text-white">POST /chat</h2>
            <p className="text-sm text-zinc-400 leading-relaxed mb-4">Send a conversation to Gyra and receive a response.</p>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 text-xs mb-6">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-zinc-500 border-b border-zinc-800">
                    <th className="pb-3 font-semibold">Field</th>
                    <th className="pb-3 font-semibold">Type</th>
                    <th className="pb-3 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-300">
                  <tr className="border-b border-zinc-800/50">
                    <td className="py-3 font-mono text-blue-400">messages</td>
                    <td className="py-3">array</td>
                    <td className="py-3">Array of message objects.</td>
                  </tr>
                  <tr className="border-b border-zinc-800/50">
                    <td className="py-3 font-mono text-blue-400">think</td>
                    <td className="py-3">boolean</td>
                    <td className="py-3">Optional. Enables reasoning mode.</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-mono text-blue-400">search</td>
                    <td className="py-3">boolean</td>
                    <td className="py-3">Optional. Enables live web search.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      case "Models":
        return (
          <div>
            <h1 className="text-4xl font-bold tracking-tighter mb-4 text-white">Models</h1>
            <p className="text-zinc-400 leading-relaxed mb-8">Gyra offers multiple models, each tuned for different use cases.</p>
            <div className="flex flex-col gap-4">
              {[
                { name: "gyra-1.0", desc: "The flagship model. Best for reasoning and coding.", context: "128K tokens", status: "Available" },
                { name: "gyra-lite", desc: "Fast and lightweight. Best for quick responses.", context: "32K tokens", status: "Available" },
                { name: "gyra-vision", desc: "Multimodal model that understands images and text.", context: "64K tokens", status: "Available" },
                { name: "gyra-voice", desc: "Speech intelligence — TTS and STT.", context: "—", status: "Coming soon" },
              ].map((model) => (
                <div key={model.name} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-3">
                    <p className="font-mono text-blue-400 font-semibold">{model.name}</p>
                    <span className={`text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full border ${model.status === "Available" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-zinc-800/60 text-zinc-500 border-zinc-700/60"}`}>
                      {model.status}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 mb-3">{model.desc}</p>
                  <p className="text-xs text-zinc-500">Context: {model.context}</p>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div>
            <h1 className="text-4xl font-bold tracking-tighter mb-4 text-white">{activeSection}</h1>
            <p className="text-zinc-400">Content for {activeSection} goes here.</p>
          </div>
        );
    }
  };

  const filteredSections = SECTIONS.filter((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-300 flex flex-col">
      {/* Top Navigation */}
      <div className="border-b border-zinc-800/50 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#09090b]/90 backdrop-blur-md z-30">
        <Link href="/" className="flex items-center gap-3">
          <GyraMark size={30} glow={false} animated={false} />
          <span className="font-bold tracking-widest text-sm text-white">GYRA</span>
          <span className="text-zinc-600 text-xs tracking-widest border-l border-zinc-800 pl-3">DOCS</span>
        </Link>

        <div className="flex-1 max-w-md mx-6 hidden md:block">
          <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 rounded-full px-4 py-2 focus-within:border-blue-500/50 transition-colors">
            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search docs... (Cmd+K)" className="bg-transparent outline-none text-sm text-zinc-200 placeholder:text-zinc-600 flex-1" />
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <Link href="/api" className="text-zinc-400 hover:text-white transition-colors hidden md:inline">API</Link>
          <Link href="/" className="text-zinc-400 hover:text-white transition-colors">← Back</Link>
        </div>
      </div>

      <VideoHero videoSrc="/docs-hero-bg.mp4" posterSrc="/docs-hero-poster.jpg" eyebrow="Gyra Documentation" title={<>Everything you need<br />to build with Gyra.</>} description="Complete reference for the AI API, Media API, and the developer platform." cta={<div className="flex gap-4"><Link href="/api-keys" className="bg-white text-black px-7 py-3.5 rounded-full font-medium hover:bg-zinc-200 transition-colors">Get API key</Link></div>} />

      {/* Body Layout */}
      <div className="flex flex-1 max-w-[1400px] mx-auto w-full">
        {/* LEFT SIDEBAR */}
        <aside className="w-64 border-r border-zinc-800/50 p-6 hidden lg:block sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto custom-scrollbar">
          <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider mb-3">Get Started</p>
          <div className="flex flex-col gap-1 mb-8">
            {filteredSections.slice(0, 3).map((section) => (
              <button key={section} onClick={() => setActiveSection(section)} className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeSection === section ? "bg-blue-500/10 text-blue-400 font-medium" : "text-zinc-400 hover:text-white hover:bg-zinc-900"}`}>{section}</button>
            ))}
          </div>
          <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider mb-3">Essentials</p>
          <div className="flex flex-col gap-1">
            {filteredSections.slice(3).map((section) => (
              <button key={section} onClick={() => setActiveSection(section)} className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeSection === section ? "bg-blue-500/10 text-blue-400 font-medium" : "text-zinc-400 hover:text-white hover:bg-zinc-900"}`}>{section}</button>
            ))}
          </div>
        </aside>

        {/* CENTER CONTENT */}
        <div className="flex-1 max-w-4xl px-8 py-10">
          {renderContent()}
          <div className="mt-20 pt-8 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-600">
            <p>©️ 2026 Gyra · Genvia AI Company</p>
            <div className="flex gap-5">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="w-56 p-6 hidden xl:block sticky top-[73px] h-[calc(100vh-73px)]">
          <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider mb-3">On this page</p>
          <div className="flex flex-col gap-2 border-l border-zinc-800 pl-4">
            <a href="#" className="text-xs text-zinc-400 hover:text-white transition-colors">Overview</a>
            <a href="#" className="text-xs text-blue-400 font-medium transition-colors">Authentication</a>
            <a href="#" className="text-xs text-zinc-400 hover:text-white transition-colors">Request Body</a>
            <a href="#" className="text-xs text-zinc-400 hover:text-white transition-colors">Response</a>
          </div>
        </aside>
      </div>
    </main>
  );
}