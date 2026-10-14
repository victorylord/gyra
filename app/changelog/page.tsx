import Link from "next/link";
import Logo from "../Logo";

type Bullet = {
  text: string;
  codeRefs?: string[];
  links?: string[];
};

type Group = {
  title: string;
  bullets: Bullet[];
};

type Entry = {
  version: string;
  date: string;
  highlight?: string;
  groups: Group[];
};

type YearBlock = {
  year: string;
  entries: Entry[];
};

// ============================================================
// CHANGELOG DATA
// ============================================================
const CHANGELOG: YearBlock[] = [
  {
    year: "2026",
    entries: [
      {
        version: "Gyra 1.2",
        date: "October 14, 2026",
        highlight: "The developer platform release",
        groups: [
          {
            title: "New Features",
            bullets: [
              { text: "Added the Gyra Developer API platform — 4 API categories under one brand." },
              { text: "Added the Gyra Media API with 5 endpoints: YouTube transcripts, YouTube metadata, TikTok metadata, Spotify music search, and audio transcription." },
              { text: "Added per-category API key prefixes: gyra_ for AI, gyramedia_ for Media, gyranet_ for Network, gyrautils_ for Utilities." },
              { text: "Added separate credit wallets per API category — AI, Media, Network, and Utilities." },
              { text: "Added the Developer Console at gyra.ng/console with wallet balances, key management, and request history." },
              { text: "Added the Live Playground at gyra.ng/playground for testing any Gyra endpoint in real time." },
              { text: "Added the API Products page with category cards, tool previews, and pricing." },
              { text: "Added Media API documentation at gyra.ng/docs/media." },
              { text: "Added a pricing page with monthly and yearly SuperGyra plans." },
            ],
          },
          {
            title: "Developer Platform",
            bullets: [
              { text: "Category-scoped API keys with independent rate limits and usage tracking." },
              { text: "Media API pricing at $0.90 per request, with 10 free requests per month." },
              { text: "AI API pricing at free tier, with pay-per-use for video and voice." },
              { text: "Request logging with per-endpoint breakdown and status codes." },
              { text: "Server-side rate limiting — 30 requests per minute per IP, 20 per key." },
              { text: "Atomic credit deduction with refund on upstream failure." },
            ],
          },
          {
            title: "Design",
            bullets: [
              { text: "Redesigned the API landing page with a video hero and multi-category layout." },
              { text: "Added the Gyra constellation diagram — one intelligence layer, every modality." },
              { text: "Added a full-screen wallpaper background to the analytics dashboard." },
              { text: "Added per-category iconography and accent colors across the platform." },
            ],
          },
          {
            title: "Fixed",
            bullets: [
              { text: "Fixed API stats page resetting on every refresh — now persistent via Supabase." },
              { text: "Fixed endpoint counts not aligning with the daily total." },
              { text: "Fixed busiest day calculation to use real historical records." },
              { text: "Fixed media key prefix collision on the key creation page." },
            ],
          },
        ],
      },
      {
        version: "Gyra 1.1",
        date: "September 18, 2026",
        highlight: "Voice and themes",
        groups: [
          {
            title: "New Features",
            bullets: [
              { text: "Added voice output for all replies." },
              { text: "Added theme switching in the settings panel." },
              {
                text: "Added James voice for developers to integrate into their projects.",
                codeRefs: ["James"],
              },
              { text: "Added hands-free voice mode with live audio visualizer." },
              { text: "Added 4 voice personalities — Ara, James, Nova, and Sage." },
              { text: "Added a Prompt Library with curated prompts across categories." },
              { text: "Added shareable chat links with public read-only URLs." },
              { text: "Added a message context menu with copy, regenerate, read aloud, and report." },
            ],
          },
          {
            title: "Fixed",
            bullets: [
              { text: "Fixed streaming lag on slow connections." },
              { text: "Fixed chat session persistence issues on web and mobile." },
              { text: "Fixed email and password signup flow — instant access without email confirmation." },
            ],
          },
        ],
      },
      {
        version: "Gyra 1.0",
        date: "September 1, 2026",
        highlight: "The first release",
        groups: [
          {
            title: "First public release",
            bullets: [
              {
                text: "Launched the Gyra platform — an intelligent, simplified AI assistant.",
                codeRefs: ["gyra"],
              },
              {
                text: "Introduced the public Developer API with free keys.",
                codeRefs: ["gyra_"],
              },
              { text: "Added web and mobile chat with streaming responses." },
              { text: "Added Vision — image, screenshot, and diagram understanding." },
              { text: "Added File Intelligence — PDFs, images, and document analysis." },
              { text: "Added Think mode for step-by-step reasoning." },
              { text: "Added Search mode with real-time web results." },
              { text: "Added persistent conversations with cloud sync." },
              { text: "Added chat management — rename, pin, delete." },
              { text: "Added rate limiting and jailbreak detection." },
            ],
          },
          {
            title: "Developer Platform",
            bullets: [
              { text: "Published documentation at gyra.ng/docs." },
              { text: "Added interactive API Playground at gyra.ng/playground." },
              { text: "Added Developer Console with usage analytics." },
              { text: "Added public status page at gyra.ng/status." },
              { text: "Introduced Gyra API, Gyra Studio (preview), Gyra Cloud (preview)." },
            ],
          },
          {
            title: "Community",
            bullets: [
              { text: "Launched the Telegram bot at @Gyra_AiBot." },
              { text: "Opened the community channel at @GenviaNews." },
              { text: "Published official changelog and support channels." },
            ],
          },
        ],
      },
    ],
  },
];

// ============================================================
// Inline code chip
// ============================================================
function Code({ children }: { children: string }) {
  return (
    <code className="bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded text-[12px] font-mono">
      {children}
    </code>
  );
}

// ============================================================
// Bullet renderer — handles codeRefs + links
// ============================================================
function BulletLine({ bullet }: { bullet: Bullet }) {
  const text = bullet.text;
  const nodes: (string | React.ReactNode)[] = [];
  let cursor = 0;
  const matches: {
    index: number;
    length: number;
    word: string;
    isCode: boolean;
  }[] = [];

  (bullet.codeRefs || []).forEach((w) => {
    const idx = text.indexOf(w);
    if (idx >= 0)
      matches.push({ index: idx, length: w.length, word: w, isCode: true });
  });
  (bullet.links || []).forEach((w) => {
    const idx = text.indexOf(w);
    if (idx >= 0)
      matches.push({ index: idx, length: w.length, word: w, isCode: false });
  });

  matches.sort((a, b) => a.index - b.index);

  matches.forEach((m, i) => {
    if (m.index > cursor) {
      nodes.push(text.substring(cursor, m.index));
    }
    if (m.isCode) {
      nodes.push(<Code key={`c-${i}`}>{m.word}</Code>);
    } else {
      nodes.push(
        <a
          key={`l-${i}`}
          href="#"
          className="text-blue-400 hover:underline"
        >
          {m.word}
        </a>
      );
    }
    cursor = m.index + m.length;
  });

  if (cursor < text.length) nodes.push(text.substring(cursor));

  return (
    <li className="flex gap-3 leading-relaxed">
      <span className="text-zinc-700 select-none shrink-0 mt-1 text-[8px]">
        ●
      </span>
      <span className="text-zinc-400">{nodes.length > 0 ? nodes : text}</span>
    </li>
  );
}

// ============================================================
// Version badge — coloured by minor version
// ============================================================
function VersionBadge({ version }: { version: string }) {
  const match = version.match(/(\d+)\.(\d+)/);
  const minor = match ? parseInt(match[2], 10) : 0;

  const colors =
    minor >= 2
      ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
      : minor === 1
      ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
      : "bg-zinc-800/60 text-zinc-400 border-zinc-700/60";

  return (
    <span
      className={`text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full border ${colors}`}
    >
      {version}
    </span>
  );
}

// ============================================================
// Changelog page
// ============================================================
export default function ChangelogPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-blue-500/5 rounded-full blur-[180px]" />
      </div>

      {/* Top nav */}
      <div className="relative z-30 border-b border-zinc-800/50 px-6 py-4 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={28} animated={false} />
          <span className="font-bold tracking-widest text-sm">GYRA</span>
          <span className="text-zinc-600 text-xs tracking-widest">
            CHANGELOG
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
          <Link href="/docs" className="hover:text-white transition-colors">
            Docs
          </Link>
          <Link href="/api" className="hover:text-white transition-colors">
            API
          </Link>
          <Link href="/status" className="hover:text-white transition-colors">
            Status
          </Link>
          <Link href="/" className="hover:text-white transition-colors">
            ← Back
          </Link>
        </div>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 md:px-12 py-16">
        {/* Header */}
        <div className="mb-12">
          <p className="text-xs tracking-[0.3em] text-zinc-500 uppercase mb-4">
            Changelog
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-5">
            What&apos;s new in Gyra
          </h1>
          <p className="text-zinc-400 leading-relaxed mb-2">
            The Gyra platform is an intelligent, simplified AI assistant built
            for people, developers, and the applications they build.
          </p>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Every change we ship lives here. Newest first. For developer docs,
            see the{" "}
            <Link href="/docs" className="text-blue-400 hover:underline">
              documentation
            </Link>
            .
          </p>
        </div>

        {/* Recent changes callout */}
        <div className="mb-14 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 flex items-start gap-4">
          <span className="text-2xl">📢</span>
          <div className="flex-1">
            <p className="text-sm text-zinc-300 leading-relaxed">
              Subscribe to{" "}
              <a
                href="https://t.me/GenviaNews"
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline"
              >
                @GenviaNews
              </a>{" "}
              for release announcements, and join the community at{" "}
              <a
                href="https://t.me/Gyra_AiBot"
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline"
              >
                @Gyra_AiBot
              </a>
              .
            </p>
          </div>
        </div>

        {/* Years */}
        {CHANGELOG.map((yearBlock) => (
          <section key={yearBlock.year} className="mb-20">
            {/* Year heading */}
            <div className="flex items-center gap-4 mb-10">
              <h2 className="text-3xl font-bold tracking-tight">
                {yearBlock.year}
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-zinc-800 to-transparent" />
            </div>

            {/* Entries */}
            <div className="flex flex-col gap-16">
              {yearBlock.entries.map((entry) => (
                <article key={entry.date} className="relative">
                  {/* Entry header */}
                  <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                    <div>
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <VersionBadge version={entry.version} />
                        {entry.highlight && (
                          <span className="text-xs text-zinc-500 italic">
                            {entry.highlight}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-semibold tracking-tight">
                        {entry.date}
                      </h3>
                    </div>
                  </div>

                  {/* Groups */}
                  <div className="flex flex-col gap-8 pl-1">
                    {entry.groups.map((group) => (
                      <div key={group.title}>
                        <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-blue-400" />
                          {group.title}
                        </h4>
                        <ul className="flex flex-col gap-2.5 ml-3">
                          {group.bullets.map((b, i) => (
                            <BulletLine key={i} bullet={b} />
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}

        {/* Footer */}
        <div className="mt-24 pt-8 border-t border-zinc-800/60 text-xs text-zinc-600 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <p>© 2026 Gyra · Genvia AI Company</p>
          <div className="flex flex-wrap gap-5">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/docs" className="hover:text-white transition-colors">
              Docs
            </Link>
            <Link href="/api" className="hover:text-white transition-colors">
              API
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}