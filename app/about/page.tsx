import Link from "next/link";
import Logo from "../Logo";

export const metadata = {
  title: "About Gyra — Ownership, Team, and Mission",
  description:
    "Gyra is an AI platform built by Genvia AI Company, founded by Victory Lord. Learn about the team, mission, and vision behind Gyra.",
  alternates: {
    canonical: "https://gyra.ng/about",
  },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[160px]" />
      </div>

      {/* Top nav */}
      <div className="relative z-10 border-b border-zinc-800/50 px-6 py-4 flex items-center justify-between sticky top-0 bg-black/95 backdrop-blur">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={28} animated={false} />
          <span className="font-bold tracking-widest text-sm">GYRA</span>
          <span className="text-zinc-600 text-xs tracking-widest">ABOUT</span>
        </Link>
        <Link
          href="/"
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          ← Back
        </Link>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 md:px-12 py-16">
        <p className="text-xs tracking-[0.3em] text-zinc-500 uppercase mb-4">
          About
        </p>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-8">
          About Gyra
        </h1>

        <p className="text-lg text-zinc-300 leading-relaxed mb-8">
          Gyra is an intelligent, simplified AI assistant built by{" "}
          <strong className="text-white">Genvia AI Company</strong>, founded
          by <strong className="text-white">Victory Lord</strong> in 2026.
          Gyra unifies conversation, vision, files, and voice under a single
          intelligence layer — designed for people, developers, and the
          applications they build.
        </p>

        <h2 className="text-2xl font-semibold mt-12 mb-4 text-white">
          Ownership
        </h2>
        <p className="text-zinc-400 leading-relaxed mb-4">
          Gyra is owned and operated by{" "}
          <strong className="text-white">Genvia AI Company</strong>. The
          platform was founded by{" "}
          <strong className="text-white">Victory Lord</strong>, who leads
          product, engineering, and research.
        </p>
        <p className="text-zinc-400 leading-relaxed mb-4">
          The Gyra platform spans four products:{" "}
          <strong className="text-white">Gyra AI</strong> (the consumer
          interface),{" "}
          <strong className="text-white">Gyra API</strong> (the developer
          platform), <strong className="text-white">Gyra Studio</strong>{" "}
          (preview), and <strong className="text-white">Gyra Cloud</strong>{" "}
          (preview). All share the same intelligence layer.
        </p>

        <h2 className="text-2xl font-semibold mt-12 mb-4 text-white">
          Mission
        </h2>
        <p className="text-zinc-400 leading-relaxed mb-4">
          Gyra exists to make advanced intelligence accessible — for
          individuals, builders, and the applications they ship. We believe
          the next wave of software is built by people who shouldn&apos;t
          need to become AI experts to use AI well.
        </p>

        <h2 className="text-2xl font-semibold mt-12 mb-4 text-white">
          Contact
        </h2>
        <ul className="text-zinc-400 leading-relaxed space-y-3">
          <li>
            Support:{" "}
            <a
              href="mailto:support@gyra.ng"
              className="text-blue-400 hover:underline"
            >
              support@gyra.ng
            </a>
          </li>
          <li>
            Telegram bot:{" "}
            <a
              href="https://t.me/Gyra_AiBot"
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 hover:underline"
            >
              @Gyra_AiBot
            </a>
          </li>
          <li>
            Community:{" "}
            <a
              href="https://t.me/GenviaNews"
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 hover:underline"
            >
              @GenviaNews
            </a>
          </li>
          <li>
            Developer platform:{" "}
            <Link href="/api" className="text-blue-400 hover:underline">
              gyra.ng/api
            </Link>
          </li>
          <li>
            Documentation:{" "}
            <Link href="/docs" className="text-blue-400 hover:underline">
              gyra.ng/docs
            </Link>
          </li>
        </ul>

        <div className="mt-16 pt-8 border-t border-zinc-800/60 text-xs text-zinc-600">
          <p>© 2026 Gyra · Genvia AI Company. All rights reserved.</p>
        </div>
      </div>
    </main>
  );
}