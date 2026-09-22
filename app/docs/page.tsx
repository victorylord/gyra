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
    "Changelog",
  ];

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const CodeBlock = ({ code, id }: { code: string; id: string }) => (
    <div className="relative bg-black border border-zinc-800 rounded-xl p-4 my-4 font-mono text-xs overflow-x-auto">
      <button
        onClick={() => copyCode(code, id)}
        className="absolute top-2 right-2 text-zinc-500 hover:text-white text-xs bg-zinc-900 px-2 py-1 rounded-md border border-zinc-800"
      >
        {copied === id ? "✓ Copied" : "Copy"}
      </button>
      <pre className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
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
                {
                  title: "Getting Started",
                  desc: "Create an account and make your first API call.",
                  target: "Getting Started",
                },
                {
                  title: "API Reference",
                  desc: "Explore every endpoint and parameter.",
                  target: "API Reference",
                },
                {
                  title: "Models",
                  desc: "Compare Gyra-1.0, Gyra-Lite, and more.",
                  target: "Models",
                },
                {
                  title: "Changelog",
                  desc: "See every update, fix, and new feature.",
                  target: "Changelog",
                },
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
            <p className="text-zinc-400 text-sm leading-relaxed">
              Gyra is an advanced AI platform offering text generation,
              reasoning, code assistance, and voice capabilities. Our API is
              fast, free, and developer-friendly.
            </p>
          </div>
        );

      case "Getting Started":
        return (
          <div>
            <h1 className="text-3xl font-bold mb-4">Getting Started</h1>
            <p className="text-zinc-400 mb-6 leading-relaxed">
              Follow these steps to make your first request to Gyra.
            </p>

            <h2 className="text-xl font-bold mt-6 mb-3">
              Step 1 — Create your account
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">
              Visit the API page at{" "}
              <a href="/api" className="text-blue-400 hover:underline">
                gyra.ng/api
              </a>{" "}
              and sign in with Google. You will then be asked to create a team.
            </p>

            <h2 className="text-xl font-bold mt-6 mb-3">
              Step 2 — Generate an API key
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">
              Once you have created your team, click "Generate API Key". Your
              key will start with <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-blue-400 text-xs">gyra_</code> and looks like this:
            </p>
            <CodeBlock
              id="key"
              code={`gyra_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`}
            />
            <p className="text-red-400 text-xs">
              ⚠️ Store this key safely. You will not be able to see it again.
            </p>

            <h2 className="text-xl font-bold mt-6 mb-3">
              Step 3 — Make your first request
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-2">
              Send a POST request to the Gyra chat endpoint:
            </p>
            <CodeBlock
              id="first-request"
              code={`curl -X POST https://gyra.ng/api/chat \\
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
              code={`{
  "message": "Hi! How can I help you today?"
}`}
            />
          </div>
        );

      case "API Reference":
        return (
          <div>
            <h1 className="text-3xl font-bold mb-4">API Reference</h1>
            <p className="text-zinc-400 mb-6 leading-relaxed">
              All Gyra API endpoints. Base URL:{" "}
              <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-blue-400 text-xs">
                https://gyra.ng/api
              </code>
            </p>

            <h2 className="text-xl font-bold mt-6 mb-2">POST /chat</h2>
            <p className="text-zinc-400 text-sm mb-4">
              Send a message to Gyra and receive a response.
            </p>

            <p className="text-sm font-semibold mt-4 mb-2">Request Body</p>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs">
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
                    <td className="py-2">
                      Array of message objects with role and content.
                    </td>
                  </tr>
                  <tr className="border-t border-zinc-800">
                    <td className="py-2 font-mono text-blue-400">model</td>
                    <td className="py-2">string</td>
                    <td className="py-2">
                      Optional. Defaults to gyra-1.0.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-sm font-semibold mt-6 mb-2">Example Request</p>
            <CodeBlock
              id="api-ref-example"
              code={`POST https://gyra.ng/api/chat
Content-Type: application/json
Authorization: Bearer gyra_xxxxx

{
  "messages": [
    { "role": "user", "content": "What is quantum computing?" }
  ]
}`}
            />
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
                {
                  name: "gyra-1.0",
                  desc: "Our flagship model. Best for reasoning, coding, and complex tasks.",
                  context: "128K tokens",
                },
                {
                  name: "gyra-lite",
                  desc: "Fast and lightweight. Best for quick responses and simple tasks.",
                  context: "32K tokens",
                },
                {
                  name: "gyra-vision",
                  desc: "Multimodal model that understands images and text together.",
                  context: "64K tokens",
                },
              ].map((model) => (
                <div
                  key={model.name}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl p-4"
                >
                  <p className="font-mono text-blue-400 font-semibold mb-1">
                    {model.name}
                  </p>
                  <p className="text-sm text-zinc-400 mb-2">{model.desc}</p>
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
            <h1 className="text-3xl font-bold mb-4">SDKs</h1>
            <p className="text-zinc-400 mb-6 leading-relaxed">
              Use our official SDKs to integrate Gyra into your apps faster.
            </p>

            <h2 className="text-xl font-bold mt-6 mb-3">Python</h2>
            <CodeBlock id="python-install" code={`pip install gyra-sdk`} />
            <CodeBlock
              id="python-usage"
              code={`from gyra_sdk import Client

client = Client(api_key="gyra_xxxxx")

chat = client.chat.create(model="gyra-1.0")
chat.append(user("Hello Gyra!"))
response = chat.sample()
print(response.content)`}
            />

            <h2 className="text-xl font-bold mt-6 mb-3">JavaScript</h2>
            <CodeBlock id="js-install" code={`npm install gyra-sdk`} />
            <CodeBlock
              id="js-usage"
              code={`import Gyra from "gyra-sdk";

const gyra = new Gyra({ apiKey: "gyra_xxxxx" });

const response = await gyra.chat.send({
  messages: [{ role: "user", content: "Hello Gyra!" }]
});

console.log(response.message);`}
            />

            <h2 className="text-xl font-bold mt-6 mb-3">cURL</h2>
            <CodeBlock
              id="curl-usage"
              code={`curl -X POST https://gyra.ng/api/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer gyra_xxxxx" \\
  -d '{"messages": [{"role": "user", "content": "Hello Gyra!"}]}'`}
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
                  t.me/gyraai
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
      <div className="border-b border-zinc-800/50 px-6 py-3 flex items-center justify-between sticky top-0 bg-black z-20">
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-bold">
              G
            </div>
            <span className="font-bold tracking-tighter">Gyra Docs</span>
          </a>
        </div>

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

        <a
          href="/dashboard"
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          ← Back to Gyra Home
        </a>
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
        <div className="flex-1 max-w-3xl mx-auto px-6 py-10">
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
              <a href="/" className="hover:text-white transition-colors">
                Home
              </a>
              <a href="/api" className="hover:text-white transition-colors">
                API
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Privacy
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}