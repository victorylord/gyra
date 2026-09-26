import Link from "next/link";
import Logo from "../Logo";

type ContactCard = {
  title: string;
  description: string;
  action: string;
  href: string;
  icon: string;
};

const CONTACTS: ContactCard[] = [
  {
    title: "Product Support",
    description: "Questions about Gyra, your account, or anything in the app.",
    action: "support@gyra.ng",
    href: "mailto:support@gyra.ng",
    icon: "💬",
  },
  {
    title: "Sales & Business",
    description: "Enterprise plans, partnerships, or team deployments.",
    action: "hello@gyra.ng",
    href: "mailto:hello@gyra.ng",
    icon: "💼",
  },
  {
    title: "Press & Media",
    description: "Press inquiries, interviews, and media requests.",
    action: "press@gyra.ng",
    href: "mailto:press@gyra.ng",
    icon: "📰",
  },
  {
    title: "Safety & Abuse",
    description: "Report safety concerns, abuse, or policy violations.",
    action: "safety@gyra.ng",
    href: "mailto:safety@gyra.ng",
    icon: "🛡️",
  },
];

const COMMUNITY = [
  {
    name: "Gyra News",
    description: "Product updates and announcements",
    href: "https://t.me/GenviaNews",
    icon: "📢",
  },
  {
    name: "Gyra Bot",
    description: "Chat with Gyra on Telegram",
    href: "https://t.me/Gyra_AiBot",
    icon: "🤖",
  },
];

const QUICK_LINKS = [
  {
    name: "Help Center",
    description: "Browse FAQs and support articles.",
    href: "/docs",
  },
  {
    name: "API Documentation",
    description: "Technical docs for the Gyra API.",
    href: "/api",
  },
  {
    name: "Status Page",
    description: "Check system status and uptime.",
    href: "/status",
  },
  {
    name: "Changelog",
    description: "Every release, fix, and improvement.",
    href: "/changelog",
  },
  {
    name: "Safety",
    description: "Our approach to AI safety.",
    href: "/docs",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[160px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
            maskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
      </div>

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-6 border-b border-white/5 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={28} animated={false} />
          <span className="font-bold tracking-widest text-sm">GYRA</span>
          <span className="text-zinc-600 text-xs tracking-widest">CONTACT</span>
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
            ← Back to Gyra
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 pt-24 pb-16">
        <p className="text-xs tracking-[0.3em] text-zinc-500 uppercase mb-4">
          Contact
        </p>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-6">
          Get in touch
        </h1>
        <p className="text-lg text-zinc-400 leading-relaxed max-w-2xl">
          Whether you have a question about Gyra, need enterprise support, want
          to explore a partnership, or need to report something — we&apos;re
          here to help.
        </p>
      </section>

      {/* Contact cards */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 py-12">
        <div className="grid md:grid-cols-2 gap-6">
          {CONTACTS.map((c) => (
            <a
              key={c.title}
              href={c.href}
              className="group bg-zinc-950/60 border border-zinc-800/60 rounded-2xl p-8 hover:border-zinc-600 transition-all duration-300 backdrop-blur-sm"
            >
              <div className="text-3xl mb-4">{c.icon}</div>
              <h3 className="text-xl font-bold mb-2 tracking-tight">
                {c.title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                {c.description}
              </p>
              <div className="inline-flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full text-sm font-medium group-hover:bg-zinc-200 transition-colors">
                {c.action}
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Community */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 py-16 border-t border-white/5">
        <p className="text-xs tracking-[0.3em] text-zinc-500 uppercase mb-4">
          Community
        </p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-4">
          Join the conversation
        </h2>
        <p className="text-zinc-400 leading-relaxed max-w-2xl mb-10">
          Follow us on Telegram for the latest updates, or chat directly with
          Gyra through our bot.
        </p>

        <div className="flex flex-col gap-4">
          {COMMUNITY.map((c) => (
            <a
              key={c.name}
              href={c.href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-4 bg-zinc-950/60 border border-zinc-800/60 rounded-2xl p-6 hover:border-zinc-600 transition-all"
            >
              <span className="text-2xl">{c.icon}</span>
              <div className="flex-1">
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-zinc-500 mt-1">{c.description}</p>
              </div>
              <span className="text-zinc-500 group-hover:text-white transition-colors">
                ↗
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Quick links */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 py-16 border-t border-white/5">
        <p className="text-xs tracking-[0.3em] text-zinc-500 uppercase mb-4">
          Quick links
        </p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-10">
          Find what you need
        </h2>

        <div className="flex flex-col">
          {QUICK_LINKS.map((q, i) => (
            <Link
              key={q.name}
              href={q.href}
              className={`flex items-start justify-between py-6 ${
                i !== QUICK_LINKS.length - 1
                  ? "border-b border-zinc-800/60"
                  : ""
              } hover:bg-white/[0.02] -mx-4 px-4 transition-colors rounded-lg`}
            >
              <div>
                <p className="font-medium">{q.name}</p>
                <p className="text-sm text-zinc-500 mt-1">{q.description}</p>
              </div>
              <span className="text-zinc-500 mt-1">↗</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 py-12 border-t border-white/5">
        <div className="flex items-center justify-between text-xs text-zinc-600">
          <p>© 2026 Gyra · Genvia AI Company</p>
          <Link href="/" className="hover:text-white transition-colors">
            gyra.ng
          </Link>
        </div>
      </footer>
    </main>
  );
}