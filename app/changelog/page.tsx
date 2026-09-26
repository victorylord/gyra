import Link from "next/link";
import Logo from "../Logo";

type Bullet = {
  text: string;
  codeRefs?: string[]; // words to render as inline code chips
  links?: string[]; // words to render as blue links
};

type Group = {
  title: string;
  bullets: Bullet[];
};

type Entry = {
  version: string;
  date: string;
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
        version: "Gyra 1.0",
        date: "September 1, 2026",
        groups: [
          {
            title: "First public release",
            bullets: [
              { text: "Launched the Gyra platform — an intelligent, simplified AI assistant.", codeRefs: ["gyra"] },
              { text: "Introduced the public Developer API with free keys.", codeRefs: ["gyra_"] },
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
// Renders a bullet — detects codeRefs + links
// ============================================================
function BulletLine({ bullet }: { bullet: Bullet }) {
  let text = bullet.text;
  const nodes: (string | React.ReactNode)[] = [];
  let cursor = 0;
  const matches: { index: number; length: number; word: string; isCode: boolean }[] = [];

  (bullet.codeRefs || []).forEach((w) => {
    const idx = text.indexOf(w);
    if (idx >= 0) matches.push({ index: idx, length: w.length, word: w, isCode: true });
  });
  (bullet.links || []).forEach((w) => {
    const idx = text.indexOf(w);
    if (idx >= 0) matches.push({ index: idx, length: w.length, word: w, isCode: false });
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
      <span className="text-zinc-600 select-none shrink-0">•</span>
      <span className="text-zinc-300">
        {nodes.length > 0 ? nodes : text}
      </span>
    </li>
  );
}

// ============================================================
// Changelog page
// ============================================================
export default function ChangelogPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[160px]" />
      </div>

      {/* Top nav — Telegram-style horizontal nav */}
      <div className="border-b border-zinc-800/50 px-6 py-4 flex items-center justify-between sticky top-0 bg-black/95 backdrop-blur z-30">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={28} animated={false} />
          <span className="font-bold tracking-widest text-sm">GYRA</span>
          <span className="text-zinc-600 text-xs tracking-widest">
            CHANGELOG
          </span>
        </Link>
        <div className="flex items-center gap-6 text-sm text-zinc-400">
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

      <div className="relative z-10 max-w-3xl mx-auto px-6 md:px-12 py-12">
        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Gyra changelog
        </h1>

        {/* Intro paragraph */}
        <p className="text-sm text-zinc-400 leading-relaxed mb-2">
          The Gyra platform is an intelligent, simplified AI assistant built for
          people, developers, and the applications they build.
        </p>
        <p className="text-sm text-zinc-400 leading-relaxed mb-8">
          To learn how to use Gyra, please consult our{" "}
          <Link href="/docs" className="text-blue-400 hover:underline">
            documentation
          </Link>{" "}
          » You will find all changes to Gyra on this page.
        </p>

        {/* Recent changes callout */}
        <h2 className="text-lg font-semibold mt-8 mb-3">Recent changes</h2>
        <div className="border-l-2 border-blue-500 bg-blue-500/5 rounded-r-lg px-4 py-3 mb-12">
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
            to be the first to know about the latest updates and join the
            discussion at{" "}
            <a
              href="https://t.me/Gyra_AiBot"
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 hover:underline"
            >
              @Gyra_AiBot
            </a>
          </p>
        </div>

        {/* Years */}
        {CHANGELOG.map((yearBlock) => (
          <section key={yearBlock.year} className="mb-12">
            <h2 className="text-2xl font-bold tracking-tight mb-8">
              {yearBlock.year}
            </h2>

            {yearBlock.entries.map((entry) => (
              <article key={entry.date} className="mb-12 last:mb-0">
                {/* Date */}
                <h3 className="text-lg font-semibold mb-2">{entry.date}</h3>

                {/* Version */}
                <p className="text-base font-medium text-zinc-200 mb-6">
                  {entry.version}
                </p>

                {/* Groups */}
                {entry.groups.map((group) => (
                  <div key={group.title} className="mb-8 last:mb-0">
                    <h4 className="text-sm font-semibold text-white mb-3">
                      {group.title}
                    </h4>
                    <ul className="flex flex-col gap-2 ml-1">
                      {group.bullets.map((b, i) => (
                        <BulletLine key={i} bullet={b} />
                      ))}
                    </ul>
                  </div>
                ))}
              </article>
            ))}
          </section>
        ))}

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-zinc-800/60 text-xs text-zinc-600 flex flex-col md:flex-row md:items-center justify-between gap-3">
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