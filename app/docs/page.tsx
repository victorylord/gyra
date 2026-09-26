"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "../Logo";

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

type CodeBlockProps = {
  code: string;
  id: string;
  language?: string;
};

function CodeBlock({ code, id, language }: CodeBlockProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="relative bg-black border border-zinc-800 rounded-xl my-4 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-950">
        <span className="text-xs text-zinc-500 font-mono">
          {language || "code"}
        </span>
        <button
          onClick={copy}
          className="text-xs text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-2.5 py-1 rounded-md border border-zinc-800 transition-colors"
        >
          {copied === id ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-4 text-xs font-mono text-zinc-200 overflow-x-auto whitespace-pre">
        {code}
      </pre>
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
            <h1 className="text-4xl font-bold tracking-tighter mb-4">
              Gyra Documentation
            </h1>
            <p className="text-zinc-400 leading-relaxed mb-8">
              Welcome to the official Gyra documentation. Gyra is a multimodal
              intelligence platform — chat, vision, files, voice, and a
              developer API, all under one intelligence layer.
            </p>

            <div className="grid md:grid-cols-2 gap-4 my-10">
              {[
                {
                  title: "Getting Started",
                  desc: "Create an account and make your first API call.",
                  target: "Getting Started",
                },
                {
                  title: "API Reference",
                  desc: "Every endpoint and parameter.",
                  target: "API Reference",
                },
                {
                  title: "Models",
                  desc: "Gyra-1, Gyra-Lite, Gyra-Vision, Gyra-Voice.",
                  target: "Models",
                },
                {
                  title: "SDKs & Examples",
                  desc: "Python, JavaScript, cURL, and frameworks.",
                  target: "SDKs",
                },
              ].map((card) => (
                <button
                  key={card.title}
                  onClick={() => setActiveSection(card.target)}
                  className="text-left bg-zinc-950 border border-zinc-800 hover:border-zinc-600 rounded-xl p-5 transition-colors"
                >
                  <p className="font-semibold mb-1">{card.title}</p>
                  <p className="text-xs text-zinc-500">{card.desc}</p>
                </button>
              ))}
            </div>

            <h2 className="text-xl font-bold mt-10 mb-3">Base URL</h2>
            <CodeBlock
              id="base-url"
              language="http"
              code={`https://gyra.ng/api/v1`}
            />

            <h2 className="text-xl font-bold mt-10 mb-3">What is Gyra?</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Gyra is an advanced AI platform built by Genvia AI Company.
              The platform is divided into:
            </p>
            <ul className="text-sm text-zinc-400 leading-relaxed mt-4 flex flex-col gap-2 list-disc list-inside ml-4">
              <li>
                <strong className="text-white">Gyra AI</strong> — the
                consumer interface at gyra.ng
              </li>
              <li>
                <strong className="text-white">Gyra API</strong> — developer
                infrastructure at gyra.ng/api
              </li>
              <li>
                <strong className="text-white">Gyra Core</strong> — the model
                layer (in development)
              </li>
              <li>
                <strong className="text-white">Gyra Studio</strong> — a
                visual builder for AI apps (coming soon)
              </li>
            </ul>
          </div>
        );

      case "Getting Started":
        return (
          <div>
            <h1 className="text-4xl font-bold tracking-tighter mb-4">
              Getting Started
            </h1>
            <p className="text-zinc-400 leading-relaxed mb-8">
              Follow these steps to make your first request to Gyra.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-3">
              Step 1 — Create your account
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed mb-4">
              Visit{" "}
              <Link href="/api" className="text-blue-400 hover:underline">
                gyra.ng/api
              </Link>{" "}
              and sign in with Google. You will be asked to create a team.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-3">
              Step 2 — Generate an API key
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed mb-4">
              Once your team is created, click <strong>Generate API Key</strong>.
              Your key starts with{" "}
              <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-blue-400 text-xs">
                gyra_
              </code>{" "}
              and looks like this:
            </p>
            <CodeBlock
              id="key"
              language="api key"
              code={`gyra_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`}
            />
            <p className="text-red-400 text-xs">
              ⚠️ Store this key safely. You will not be able to see it again.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-3">
              Step 3 — Make your first request
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed mb-2">
              Send a POST request to the Gyra chat endpoint:
            </p>
            <CodeBlock
              id="first-request"
              language="curl"
              code={`curl https://gyra.ng/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer gyra_xxxxx" \\
  -d '{
    "messages": [
      { "role": "user", "content": "Hello Gyra!" }
    ]
  }'`}
            />

            <h2 className="text-xl font-bold mt-8 mb-3">Response</h2>
            <CodeBlock
              id="first-response"
              language="json"
              code={`{
  "id": "chatcmpl-1758604800000",
  "object": "chat.completion",
  "model": "gyra-1.0",
  "provider": "huggingface",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today? 😊"
      }
    }
  ]
}`}
            />
          </div>
        );

      case "API Reference":
        return (
          <div>
            <h1 className="text-4xl font-bold tracking-tighter mb-4">
              API Reference
            </h1>
            <p className="text-zinc-400 leading-relaxed mb-6">
              Base URL:{" "}
              <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-blue-400 text-xs">
                https://gyra.ng/api/v1
              </code>
            </p>

            <h2 className="text-xl font-bold mt-8 mb-3">POST /chat</h2>
            <p className="text-sm text-zinc-400 leading-relaxed mb-4">
              Send a conversation to Gyra and receive a response.
            </p>

            <p className="text-sm font-semibold mt-6 mb-3">
              Request Body
            </p>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 text-xs mb-6">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-zinc-500">
                    <th className="pb-3">Field</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Description</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-300">
                  <tr className="border-t border-zinc-800">
                    <td className="py-3 font-mono text-blue-400">messages</td>
                    <td className="py-3">array</td>
                    <td className="py-3">
                      Array of message objects with role and content.
                    </td>
                  </tr>
                  <tr className="border-t border-zinc-800">
                    <td className="py-3 font-mono text-blue-400">think</td>
                    <td className="py-3">boolean</td>
                    <td className="py-3">
                      Optional. Enables reasoning mode for complex problems.
                    </td>
                  </tr>
                  <tr className="border-t border-zinc-800">
                    <td className="py-3 font-mono text-blue-400">search</td>
                    <td className="py-3">boolean</td>
                    <td className="py-3">
                      Optional. Enables live web search via Tavily.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-sm font-semibold mt-6 mb-3">
              Authorization Header
            </p>
            <CodeBlock
              id="auth-header"
              language="http"
              code={`Authorization: Bearer gyra_xxxxxxxxxxxxxxxx`}
            />

            <p className="text-sm font-semibold mt-6 mb-3">
              Error Responses
            </p>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 text-xs flex flex-col gap-4">
              <div>
                <p className="text-yellow-400 font-mono mb-1">
                  401 invalid_api_key
                </p>
                <p className="text-zinc-400">Missing or invalid API key.</p>
              </div>
              <div>
                <p className="text-yellow-400 font-mono mb-1">
                  400 invalid_request
                </p>
                <p className="text-zinc-400">
                  Request body must include &quot;messages&quot; as an array.
                </p>
              </div>
              <div>
                <p className="text-yellow-400 font-mono mb-1">
                  429 rate_limited
                </p>
                <p className="text-zinc-400">
                  You have exceeded the rate limit (100 requests per minute per
                  key).
                </p>
              </div>
              <div>
                <p className="text-yellow-400 font-mono mb-1">
                  503 ai_unavailable
                </p>
                <p className="text-zinc-400">
                  All AI providers are temporarily unavailable.
                </p>
              </div>
            </div>
          </div>
        );

      case "Models":
        return (
          <div>
            <h1 className="text-4xl font-bold tracking-tighter mb-4">Models</h1>
            <p className="text-zinc-400 leading-relaxed mb-8">
              Gyra offers multiple models, each tuned for different use cases.
            </p>

            <div className="flex flex-col gap-4">
              {[
                {
                  name: "gyra-1.0",
                  desc: "The flagship model. Best for reasoning, coding, and complex tasks.",
                  context: "128K tokens",
                  status: "Available",
                },
                {
                  name: "gyra-lite",
                  desc: "Fast and lightweight. Best for quick responses and simple tasks.",
                  context: "32K tokens",
                  status: "Available",
                },
                {
                  name: "gyra-vision",
                  desc: "Multimodal model that understands images and text together.",
                  context: "64K tokens",
                  status: "Available",
                },
                {
                  name: "gyra-voice",
                  desc: "Speech intelligence — text-to-speech and speech-to-text.",
                  context: "—",
                  status: "Coming soon",
                },
                {
                  name: "gyra-code",
                  desc: "Specialized programming intelligence.",
                  context: "—",
                  status: "Coming soon",
                },
              ].map((model) => (
                <div
                  key={model.name}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl p-6"
                >
                  <div className="flex items-start justify-between mb-3">
                    <p className="font-mono text-blue-400 font-semibold">
                      {model.name}
                    </p>
                    <span
                      className={`text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full border ${
                        model.status === "Available"
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : "bg-zinc-800/60 text-zinc-500 border-zinc-700/60"
                      }`}
                    >
                      {model.status}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 mb-3">{model.desc}</p>
                  <p className="text-xs text-zinc-500">
                    Context: {model.context}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );

      case "SDKs":
        return (
          <div>
            <h1 className="text-4xl font-bold tracking-tighter mb-4">
              SDKs & Quickstart
            </h1>
            <p className="text-zinc-400 leading-relaxed mb-8">
              Use any of these examples to integrate Gyra into your app in
              seconds.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-3">cURL</h2>
            <CodeBlock
              id="curl"
              language="bash"
              code={`curl https://gyra.ng/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer gyra_xxxxx" \\
  -d '{"messages": [{"role": "user", "content": "Hello Gyra!"}]}'`}
            />

            <h2 className="text-xl font-bold mt-8 mb-3">JavaScript</h2>
            <CodeBlock
              id="js"
              language="javascript"
              code={`const response = await fetch("https://gyra.ng/api/v1/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer gyra_xxxxx"
  },
  body: JSON.stringify({
    messages: [
      { role: "user", content: "Hello Gyra!" }
    ]
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);`}
            />

            <h2 className="text-xl font-bold mt-8 mb-3">
              JavaScript (OpenAI SDK)
            </h2>
            <CodeBlock
              id="js-openai"
              language="javascript"
              code={`import OpenAI from "openai";

const gyra = new OpenAI({
  apiKey: "gyra_xxxxx",
  baseURL: "https://gyra.ng/api/v1"
});

const response = await gyra.chat.completions.create({
  model: "gyra-1.0",
  messages: [{ role: "user", content: "Hello Gyra!" }]
});

console.log(response.choices[0].message.content);`}
            />

            <h2 className="text-xl font-bold mt-8 mb-3">Python</h2>
            <CodeBlock
              id="py"
              language="python"
              code={`import requests

response = requests.post(
    "https://gyra.ng/api/v1/chat",
    headers={
        "Content-Type": "application/json",
        "Authorization": "Bearer gyra_xxxxx"
    },
    json={
        "messages": [
            {"role": "user", "content": "Hello Gyra!"}
        ]
    }
)

print(response.json()["choices"][0]["message"]["content"])`}
            />

            <h2 className="text-xl font-bold mt-8 mb-3">
              Python (OpenAI SDK)
            </h2>
            <CodeBlock
              id="py-openai"
              language="python"
              code={`from openai import OpenAI

gyra = OpenAI(
    api_key="gyra_xxxxx",
    base_url="https://gyra.ng/api/v1"
)

response = gyra.chat.completions.create(
    model="gyra-1.0",
    messages=[
        {"role": "user", "content": "Hello Gyra!"}
    ]
)

print(response.choices[0].message.content)`}
            />
          </div>
        );

      case "Examples":
        return (
          <div>
            <h1 className="text-4xl font-bold tracking-tighter mb-4">
              Examples & Integrations
            </h1>
            <p className="text-zinc-400 leading-relaxed mb-8">
              Real-world examples of Gyra in popular frameworks.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-3">Vercel AI SDK</h2>
            <p className="text-sm text-zinc-400 leading-relaxed mb-3">
              Build streaming chat UIs in Next.js:
            </p>
            <CodeBlock
              id="vercel-ai"
              language="typescript"
              code={`import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const gyra = createOpenAI({
  apiKey: process.env.GYRA_API_KEY,
  baseURL: "https://gyra.ng/api/v1"
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: gyra("gyra-1.0"),
    messages,
  });

  return result.toDataStreamResponse();
}`}
            />

            <h2 className="text-xl font-bold mt-8 mb-3">LangChain</h2>
            <p className="text-sm text-zinc-400 leading-relaxed mb-3">
              Use Gyra as a chat model in any LangChain workflow:
            </p>
            <CodeBlock
              id="langchain"
              language="python"
              code={`from langchain_openai import ChatOpenAI

gyra = ChatOpenAI(
    model="gyra-1.0",
    api_key="gyra_xxxxx",
    base_url="https://gyra.ng/api/v1"
)

response = gyra.invoke("Explain recursion in one sentence.")
print(response.content)`}
            />

            <h2 className="text-xl font-bold mt-8 mb-3">Telegram Bot</h2>
            <CodeBlock
              id="telegram"
              language="javascript"
              code={`const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

bot.on("message", async (msg) => {
  const res = await fetch("https://gyra.ng/api/v1/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": \`Bearer \${process.env.GYRA_API_KEY}\`
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: msg.text }]
    })
  });
  const data = await res.json();
  bot.sendMessage(msg.chat.id, data.choices[0].message.content);
});`}
            />

            <h2 className="text-xl font-bold mt-8 mb-3">Discord Bot</h2>
            <CodeBlock
              id="discord"
              language="javascript"
              code={`import { Client, GatewayIntentBits } from "discord.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  const res = await fetch("https://gyra.ng/api/v1/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": \`Bearer \${process.env.GYRA_API_KEY}\`
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: msg.content }]
    })
  });

  const data = await res.json();
  msg.reply(data.choices[0].message.content);
});

client.login(process.env.DISCORD_TOKEN);`}
            />
          </div>
        );

      case "Changelog":
        return (
          <div>
            <h1 className="text-4xl font-bold tracking-tighter mb-4">
              Changelog
            </h1>
            <p className="text-zinc-400 leading-relaxed mb-8">
              Every release, fix, and improvement to Gyra.
            </p>

            <Link
              href="/changelog"
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors mb-8"
            >
              View the full changelog →
            </Link>

            <div className="bg-blue-950/40 border-l-2 border-blue-500 rounded-lg p-5 mt-4">
              <p className="text-sm text-zinc-200">
                Be the first to know about the latest updates. Join the
                discussion on Telegram at{" "}
                <a
                  href="https://t.me/GenviaNews"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  @GenviaNews
                </a>
              </p>
            </div>
          </div>
        );

      case "Support":
        return (
          <div>
            <h1 className="text-4xl font-bold tracking-tighter mb-4">Support</h1>
            <p className="text-zinc-400 leading-relaxed mb-8">
              Need help? We&apos;re here.
            </p>

            <div className="flex flex-col gap-4">
              {[
                {
                  label: "Product Support",
                  email: "support@gyra.ng",
                  desc: "Questions about Gyra or your account.",
                },
                {
                  label: "Sales & Business",
                  email: "hello@gyra.ng",
                  desc: "Enterprise, partnerships, and teams.",
                },
                {
                  label: "Press & Media",
                  email: "press@gyra.ng",
                  desc: "Press inquiries and media requests.",
                },
                {
                  label: "Safety & Abuse",
                  email: "safety@gyra.ng",
                  desc: "Report safety concerns or policy violations.",
                },
              ].map((c) => (
                <a
                  key={c.email}
                  href={`mailto:${c.email}`}
                  className="bg-zinc-950 border border-zinc-800 hover:border-zinc-600 rounded-xl p-6 transition-colors"
                >
                  <p className="font-semibold mb-1">{c.label}</p>
                  <p className="text-xs text-zinc-500 mb-2">{c.desc}</p>
                  <p className="font-mono text-sm text-blue-400">{c.email}</p>
                </a>
              ))}
            </div>

            <div className="mt-10 pt-8 border-t border-zinc-800/60">
              <p className="text-sm text-zinc-400 mb-3">
                Or reach us on Telegram:
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://t.me/Gyra_AiBot"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-full px-4 py-2 text-sm transition-colors"
                >
                  @Gyra_AiBot
                </a>
                <a
                  href="https://t.me/GenviaNews"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-full px-4 py-2 text-sm transition-colors"
                >
                  @GenviaNews
                </a>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const filteredSections = SECTIONS.filter((s) =>
    s.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      {/* Top bar */}
      <div className="border-b border-zinc-800/50 px-6 py-4 flex items-center justify-between sticky top-0 bg-black/95 backdrop-blur z-30">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={28} animated={false} />
          <span className="font-bold tracking-widest text-sm">GYRA</span>
          <span className="text-zinc-600 text-xs tracking-widest">DOCS</span>
        </Link>

        <div className="flex-1 max-w-md mx-6 hidden md:block">
          <div className="flex items-center gap-2 bg-zinc-900 rounded-full px-4 py-2">
            <svg
              className="w-4 h-4 text-zinc-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search docs..."
              className="bg-transparent outline-none text-sm text-zinc-300 placeholder:text-zinc-500 flex-1"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <Link
            href="/api"
            className="text-zinc-400 hover:text-white transition-colors hidden md:inline"
          >
            API
          </Link>
          <Link
            href="/"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            ← Back
          </Link>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 border-r border-zinc-800/50 p-6 hidden md:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-3">
            Contents
          </p>
          <div className="flex flex-col gap-1">
            {filteredSections.map((section) => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeSection === section
                    ? "bg-zinc-800 text-white font-medium"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                }`}
              >
                {section}
              </button>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-zinc-800/60">
            <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-3">
              Resources
            </p>
            <div className="flex flex-col gap-1">
              <Link
                href="/api"
                className="text-left px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              >
                API Keys →
              </Link>
              <Link
                href="/status"
                className="text-left px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              >
                Status →
              </Link>
              <Link
                href="/changelog"
                className="text-left px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              >
                Changelog →
              </Link>
              <Link
                href="/contact"
                className="text-left px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              >
                Contact →
              </Link>
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 max-w-3xl mx-auto px-6 py-10 w-full">
          {/* Mobile section selector */}
          <div className="md:hidden mb-6 flex gap-2 overflow-x-auto pb-2">
            {SECTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setActiveSection(s)}
                className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
                  activeSection === s
                    ? "bg-white text-black font-medium"
                    : "bg-zinc-900 text-zinc-400"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {renderContent()}

          {/* Footer */}
          <div className="mt-20 pt-8 border-t border-zinc-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-zinc-600">
            <p>© 2026 Gyra · Genvia AI Company</p>
            <div className="flex flex-wrap gap-5">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/api" className="hover:text-white transition-colors">
                API
              </Link>
              <Link
                href="/contact"
                className="hover:text-white transition-colors"
              >
                Contact
              </Link>
              <Link
                href="/privacy"
                className="hover:text-white transition-colors"
              >
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}