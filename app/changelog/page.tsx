import Link from "next/link";
import Logo from "../components/Logo";

type Change = {
  type: "added" | "improved" | "fixed" | "changed";
  text: string;
};

type Release = {
  version: string;
  date: string;
  title: string;
  summary: string;
  changes: Change[];
  status?: "current" | "stable" | "legacy";
};

const RELEASES: Release[] = [
  {
    version: "1.0.0",
    date: "September 1, 2026",
    title: "Gyra v1.0 — First public release",
    summary:
      "The first public release of Gyra. A complete AI platform — chat, vision, files, developer API, and everything in between.",
    status: "current",
    changes: [
      { type: "added", text: "Gyra-1.0 flagship model with reasoning and conversation" },
      { type: "added", text: "Vision — image, screenshot, and diagram understanding" },
      { type: "added", text: "File Intelligence — read and analyze PDFs, images, and documents" },
      { type: "added", text: "Developer API with free gyra_ API keys" },
      { type: "added", text: "Complete documentation at gyra.ng/docs" },
      { type: "added", text: "Admin dashboard with reports and broadcasts" },
      { type: "added", text: "Telegram bot — @Gyra_AiBot" },
      { type: "added", text: "Persistent conversations with cloud sync" },
      { type: "added", text: "Chat management — rename, pin, delete" },
      { type: "added", text: "Rate limiting and jailbreak protection" },
    ],
  },
];

const TYPE_STYLE = {
  added: { bg: "bg-green-500/10", text: "text-green-400", label: "Added" },
  improved: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Improved" },
  fixed: { bg: "bg-yellow-500/10", text: "text-yellow-400", label: "Fixed" },
  changed: { bg: "bg-purple-500/10", text: "text-purple-400", label: "Changed" },
};

export default function ChangelogPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[160px]" />
      </div>

      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-6 border-b border-white/5">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={28} animated={false} />
          <span className="font-bold tracking-widest text-sm">GYRA</span>
          <span className="text-zinc-600 text-xs tracking-widest">
            CHANGELOG
          </span>
        </Link>
        <div className="flex items-center gap-6 text-sm text-zinc-400">
          <Link href="/status" className="hover:text-white transition-colors">
            Status
          </Link>
          <Link href="/docs" className="hover:text-white transition-colors">
            Docs
          </Link>
          <Link href="/" className="hover:text-white transition-colors">
            ← Back to Gyra
          </Link>
        </div>
      </nav>

      <div className="relative z-10 max-w-3xl mx-auto px-6 md:px-12 py-16">
        <p className="text-xs tracking-[0.3em] text-zinc-500 uppercase mb-4">
          Changelog
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">
          Every change, in the open.
        </h1>
        <p className="text-zinc-400 mb-16 leading-relaxed">
          A transparent record of what&apos;s new in Gyra. Every release, fix,
          and improvement — documented for users and developers.
        </p>

        <div className="flex flex-col gap-16">
          {RELEASES.map((release) => (
            <div key={release.version} className="relative">
              <div className="absolute left-0 top-2 bottom-0 w-px bg-gradient-to-b from-blue-500/40 to-transparent hidden md:block" />

              <div className="md:pl-8">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className="font-mono text-sm text-blue-400">
                    {release.version}
                  </span>
                  <span className="text-zinc-600 text-xs">·</span>
                  <span className="text-zinc-500 text-xs">{release.date}</span>
                  {release.status === "current" && (
                    <span className="text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Current
                    </span>
                  )}
                </div>

                <h2 className="text-2xl font-bold tracking-tight mb-3">
                  {release.title}
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed mb-8">
                  {release.summary}
                </p>

                <div className="flex flex-col gap-3">
                  {release.changes.map((change, i) => {
                    const style = TYPE_STYLE[change.type];
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <span
                          className={`text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full mt-0.5 font-medium ${style.bg} ${style.text} whitespace-nowrap`}
                        >
                          {style.label}
                        </span>
                        <span className="text-sm text-zinc-300 leading-relaxed">
                          {change.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 pt-8 border-t border-white/5 text-center">
          <p className="text-xs text-zinc-600">
            Follow{" "}
            <a
              href="https://t.me/Gyra_AiBot"
              target="_blank"
              rel="noreferrer"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              @Gyra_AiBot
            </a>{" "}
            for updates
          </p>
        </div>
      </div>
    </main>
  );
}