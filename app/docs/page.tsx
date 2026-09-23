"use client";

import { useState } from "react";

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("Home");
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const sections = [
    "Home",
    "Getting Started",
    "API Reference",
    "Models",
    "SDKs",
    "Examples",
    "Changelog",
  ];

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const CodeBlock = ({
    code,
    id,
    language,
  }: {
    code: string;
    id: string;
    language?: string;
  }) => (
    <div className="relative bg-black border border-zinc-800 rounded-xl my-4 overflow-hidden">
      {language && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-950">
          <span className="text-xs text-zinc-500 font-mono">{language}</span>
          <button
            onClick={() => copyCode(code, id)}
            className="text-xs text-zinc-500 hover:text-white bg-zinc-900 px-2 py-1 rounded-md border border-zinc-800 transition-colors"
          >
            {copied === id ? "✓ Copied" : "Copy"}
          </button>
        </div>
      )}
      {!language && (
        <button
          onClick={() => copyCode(code, id)}
          className="absolute top-2 right-2 text-xs text-zinc-500 hover:text-white bg-zinc-900 px-2 py-1 rounded-md border border-zinc-800 z-10 transition-colors"
        >
          {copied === id ? "✓ Copied" : "Copy"}
        </button>
      )}
      <pre className="p-4 text-zinc-300 leading-relaxed whitespace-pre-wrap font-mono text-xs overflow-x-auto">
        {code}
      </pre>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "Home":
        return (
          <div>
            <h1 className="text-3xl font-bold mb-4">Gyra Documentation</h1>
            <p className="text-zinc-400 mb-6 leading-relaxed">
              Welcome to the official Gyra documentation. Here you will find
              everything you need to integrate Gyra into your applications,
              understand our models, and stay up to date with the latest
              changes.
            </p>

            <div className="grid md:grid-cols-2 gap-4 my-8">
              {[
                { title: "Getting Started", desc: "Create an account and make your first API call.", target: "Getting Started" },
                { title: "API Reference", desc: "Explore every endpoint and parameter.", target: "API Reference" },
                { title: "Models", desc: "Compare Gyra-1.0, Gyra-Lite, and more.", target: "Models" },
                { title: "SDKs", desc: "Python, JavaScript, cURL, and more.", target: "SDKs" },
                { title: "Examples", desc: "LangChain, Vercel AI SDK, and real-world apps.", target: "Examples" },
                { title: "Changelog", desc: "See every update, fix, and new feature.", target: "Changelog" },
              ].map((card) => (
                <button
                  key={card.title}
                  onClick={() => setActiveSection(card.target)}
                  className="text-left bg-zinc-950 border border-zinc-800 hover:border-zinc-600 rounded-xl p-4 transition-colors"
                >
                  <p className="font-semibold mb-1">{card.title}</p>
                  <p className="text-xs text-zinc-500">{card.desc}</p>
                </button>
              ))}
            </div>

            <h2 className="text-xl font-bold mt-8 mb-3">Quick Overview</h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">
              Gyra is an advanced AI platform offering text generation,
              reasoning, code assistance, and voice capabilities. Our API is
              fast, free, and OpenAI-compatible — so you can use any existing
              SDK, or call it directly via HTTP.
            </p>
            <p className="text-sm font-semibold mb-2">Base URL</p>
            <CodeBlock id="base-url" code={`https://gyra.ng/api/v1`} language="http" />
          </div>
        );

      case "Getting Started":
        return (
          <div>
            <h1 className="text-3xl font-bold mb-4">Getting Started</h1>
            <p className="text-zinc-400 mb-6 leading-relaxed">
              Follow these steps to make your first request to Gyra.
            </p>

            <h2 className="text-xl font-bold mt-6 mb-3">Step 1 — Create your account</h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">
              Visit the API page at{" "}
              <a href="/api" className="text-blue-400 hover:underline">gyra.ng/api</a>{" "}
              and sign in with Google. You will be asked to create a team.
            </p>

            <h2 className="text-xl font-bold mt-6 mb-3">Step 2 — Generate an API key</h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">
              Once you have created your team, click "Generate API Key". Your
              key will start with <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-blue-400 text-xs">gyra_</code> and looks like this:
            </p>
            <CodeBlock id="key" code={`gyra_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`} language="api key" />
            <p className="text-red-400 text-xs">
              ⚠️ Store this key safely. You will not be able to see it again.
            </p>

            <h2 className="text-xl font-bold mt-6 mb-3">Step 3 — Make your first request</h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-2">
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

            <h2 className="text-xl font-bold mt-6 mb-3">Response</h2>
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
            <h1 className="text-3xl font-bold mb-4">API Reference</h1>
            <p className="text-zinc-400 mb-6 leading-relaxed">
              Base URL: <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-blue-400 text-xs">https://gyra.ng/api/v1</code>
            </p>

            <h2 className="text-xl font-bold mt-6 mb-2">POST /chat</h2>
            <p className="text-zinc-400 text-sm mb-4">
              Send a message to Gyra and receive a response.
            </p>

            <p className="text-sm font-semibold mt-4 mb-2">Request Body</p>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs mb-4">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-zinc-500">
                    <th className="pb-2">Field</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Description</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-300">
                  <tr className="border-t border-zinc-800">
                    <td className="py-2 font-mono text-blue-400">messages</td>
                    <td className="py-2">array</td>
                    <td className="py-2">Array of message objects with role and content.</td>
                  </tr>
                  <tr className="border-t border-zinc-800">
                    <td className="py-2 font-mono text-blue-400">model</td>
                    <td className="py-2">string</td>
                    <td className="py-2">Optional. Defaults to gyra-1.0.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-sm font-semibold mt-6 mb-2">Authorization Header</p>
            <CodeBlock
              id="auth-header"
              language="http"
              code={`Authorization: Bearer gyra_xxxxxxxxxxxxxxxx`}
            />

            <p className="text-sm font-semibold mt-6 mb-2">Example Request</p>
            <CodeBlock
              id="api-ref-example"
              language="curl"
              code={`POST https://gyra.ng/api/v1/chat
Content-Type: application/json
Authorization: Bearer gyra_xxxxx

{
  "messages": [
    { "role": "user", "content": "What is quantum computing?" }
  ]
}`}
            />

            <p className="text-sm font-semibold mt-6 mb-2">Error Responses</p>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs">
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-yellow-400 font-mono mb-1">401 invalid_api_key</p>
                  <p className="text-zinc-400">Missing or invalid API key.</p>
                </div>
                <div>
                  <p className="text-yellow-400 font-mono mb-1">400 invalid_request</p>
                  <p className="text-zinc-400">Request body must include "messages" as an array.</p>
                </div>
                <div>
                  <p className="text-yellow-400 font-mono mb-1">503 ai_unavailable</p>
                  <p className="text-zinc-400">All AI providers are temporarily unavailable.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "Models":
        return (
          <div>
            <h1 className="text-3xl font-bold mb-4">Models</h1>
            <p className="text-zinc-400 mb-6 leading-relaxed">
              Gyra offers multiple models optimized for different use cases.
            </p>

            <div className="flex flex-col gap-4">
              {[
                { name: "gyra-1.0", desc: "Our flagship model. Best for reasoning, coding, and complex tasks.", context: "128K tokens" },
                { name: "gyra-lite", desc: "Fast and lightweight. Best for quick responses and simple tasks.", context: "32K tokens" },
                { name: "gyra-vision", desc: "Multimodal model that understands images and text together.", context: "64K tokens" },
              ].map((model) => (
                <div
                  key={model.name}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl p-4"
                >
                  <p className="font-mono text-blue-400 font-semibold mb-1">
                    {model.name}
                  </p>
                  <p className="text-sm text-zinc-400 mb-2">{model.desc}</p>
                  <p className="text-xs text-zinc-500">Context: {model.context}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case "SDKs":
        return (
          <div>
            <h1 className="text-3xl font-bold mb-4">SDKs & Quickstart</h1>
            <p className="text-zinc-400 mb-6 leading-relaxed">
              Use any of the examples below to integrate Gyra into your apps in seconds.
            </p>

            <h2 className="text-xl font-bold mt-6 mb-3">cURL</h2>
            <CodeBlock
              id="curl-usage"
              language="curl"
              code={`curl https://gyra.ng/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer gyra_xxxxx" \\
  -d '{"messages": [{"role": "user", "content": "Hello Gyra!"}]}'`}
            />

            <h2 className="text-xl font-bold mt-6 mb-3">JavaScript / Node.js</h2>
            <p className="text-zinc-400 text-sm mb-2">No SDK required — just use fetch:</p>
            <CodeBlock
              id="js-usage"
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

            <p className="text-zinc-400 text-sm mt-6 mb-2">Or with the OpenAI SDK (drop-in replacement):</p>
            <CodeBlock
              id="js-openai-sdk"
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

            <h2 className="text-xl font-bold mt-6 mb-3">Python</h2>
            <p className="text-zinc-400 text-sm mb-2">Using requests:</p>
            <CodeBlock
              id="py-requests"
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

data = response.json()
print(data["choices"][0]["message"]["content"])`}
            />

            <p className="text-zinc-400 text-sm mt-6 mb-2">Or with the OpenAI Python SDK:</p>
            <CodeBlock
              id="py-openai-sdk"
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
            <h1 className="text-3xl font-bold mb-4">Examples & Integrations</h1>
            <p className="text-zinc-400 mb-6 leading-relaxed">
              Real-world examples of Gyra in popular frameworks.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-3">Vercel AI SDK</h2>
            <p className="text-zinc-400 text-sm mb-2">
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
            <p className="text-zinc-400 text-sm mb-2">
              Use Gyra as a chat model:
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
            <p className="text-zinc-400 text-sm mb-2">
              Build a Telegram bot powered by Gyra:
            </p>
            <CodeBlock
              id="telegram-bot"
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
            <p className="text-zinc-400 text-sm mb-2">
              Connect Gyra to Discord:
            </p>
            <CodeBlock
              id="discord-bot"
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
            <h1 className="text-3xl font-bold mb-4">Recent changes</h1>
            <p className="text-zinc-400 mb-6 leading-relaxed">
              Subscribe to stay updated with the latest features and fixes.
            </p>

            <div className="bg-blue-950/40 border-l-2 border-blue-500 rounded-lg p-4 mb-8">
              <p className="text-sm text-zinc-200">
                Be the first to know about the latest updates. Join the
                discussion at{" "}
                <a href="#" className="text-blue-400 hover:underline">
                  https://t.me/GenviaNews
                </a>
              </p>
            </div>

            <p className="text-2xl font-bold mb-6">2026</p>

            <div className="mb-8">
              <p className="text-lg font-bold mb-1">September 1, 2026</p>
              <p className="text-md font-semibold mb-4">Gyra v1.0</p>

              <p className="text-md font-semibold mb-3">First public release</p>

              <ul className="list-disc list-inside text-sm text-zinc-300 space-y-2 ml-2">
                <li>
                  Launched Gyra's flagship AI model{" "}
                  <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-blue-400 text-xs">
                    gyra-1.0
                  </code>
                  .
                </li>
                <li>
                  Introduced the{" "}
                  <a href="/api" className="text-blue-400 hover:underline">
                    Developer API
                  </a>{" "}
                  with free <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-blue-400 text-xs">gyra_</code> keys.
                </li>
                <li>
                  Added web and mobile chat interface at{" "}
                  <a href="/dashboard" className="text-blue-400 hover:underline">
                    gyra.ng
                  </a>
                  .
                </li>
                <li>
                  Launched comprehensive documentation at{" "}
                  <a href="/docs" className="text-blue-400 hover:underline">
                    docs.gyra.ng
                  </a>
                  .
                </li>
                <li>
                  Added support for voice input, image understanding, and
                  multi-language responses.
                </li>
                <li>
                  Introduced chat features: rename, pin, delete, and cloud
                  sync across devices.
                </li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const filteredSections = sections.filter((s) =>
    s.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      {/* TOP BAR */}
      <div className="border-b border-zinc-800/50 px-6 py-3 flex items-center justify-between sticky top-0 bg-black/95 backdrop-blur z-20">
        <a href="/" className="flex items-center gap-3">
          <div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-bold">
            G
          </div>
          <span className="font-bold tracking-tighter">Gyra Docs</span>
        </a>

        <div className="flex-1 max-w-md mx-6 hidden md:block">
          <div className="flex items-center gap-2 bg-zinc-900 rounded-full px-4 py-2">
            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
          <a href="/api" className="text-zinc-400 hover:text-white transition-colors">
            API
          </a>
          <a href="/dashboard" className="text-zinc-400 hover:text-white transition-colors">
            ← Back to Gyra
          </a>
        </div>
      </div>

      {/* BODY */}
      <div className="flex flex-1">
        {/* SIDEBAR */}
        <aside className="w-64 border-r border-zinc-800/50 p-6 hidden md:block sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-3">
            Sections
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
        </aside>

        {/* CONTENT */}
        <div className="flex-1 max-w-3xl mx-auto px-6 py-10 w-full">
          {/* Mobile section selector */}
          <div className="md:hidden mb-6 flex gap-2 overflow-x-auto pb-2">
            {sections.map((s) => (
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

          {/* FOOTER */}
          <div className="mt-16 pt-8 border-t border-zinc-800/50 flex justify-between text-xs text-zinc-600">
            <p>© 2026 Gyra AI</p>
            <div className="flex gap-4">
              <a href="/" className="hover:text-white transition-colors">Home</a>
              <a href="/api" className="hover:text-white transition-colors">API</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}