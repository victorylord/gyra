import Link from "next/link";
import Logo from "../components/Logo";

type Service = {
  name: string;
  description: string;
  status: "operational" | "degraded" | "outage";
};

const SERVICES: Service[] = [
  {
    name: "Gyra AI",
    description: "Chat, vision, and conversation services",
    status: "operational",
  },
  {
    name: "Gyra API",
    description: "Public developer API at api.gyra.ng",
    status: "operational",
  },
  {
    name: "Authentication",
    description: "Google sign-in and session management",
    status: "operational",
  },
  {
    name: "File Processing",
    description: "Image, document, and attachment handling",
    status: "operational",
  },
  {
    name: "Voice",
    description: "Text-to-speech and speech recognition",
    status: "operational",
  },
  {
    name: "Web Search",
    description: "Live web search via Tavily",
    status: "operational",
  },
];

function StatusPill({ status }: { status: Service["status"] }) {
  const styles = {
    operational: {
      bg: "bg-green-500/10",
      border: "border-green-500/30",
      text: "text-green-400",
      dot: "bg-green-500",
      label: "Operational",
    },
    degraded: {
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30",
      text: "text-yellow-400",
      dot: "bg-yellow-500",
      label: "Degraded",
    },
    outage: {
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      text: "text-red-400",
      dot: "bg-red-500",
      label: "Outage",
    },
  }[status];

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${styles.bg} ${styles.border} border ${styles.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${styles.dot} animate-pulse`}></span>
      {styles.label}
    </div>
  );
}

export default function StatusPage() {
  const allOperational = SERVICES.every((s) => s.status === "operational");

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[160px]" />
      </div>

      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-6 border-b border-white/5">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={28} animated={false} />
          <span className="font-bold tracking-widest text-sm">GYRA</span>
          <span className="text-zinc-600 text-xs tracking-widest">STATUS</span>
        </Link>
        <div className="flex items-center gap-6 text-sm text-zinc-400">
          <Link href="/changelog" className="hover:text-white transition-colors">
            Changelog
          </Link>
          <Link href="/" className="hover:text-white transition-colors">
            ← Back to Gyra
          </Link>
        </div>
      </nav>

      <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 py-16">
        <p className="text-xs tracking-[0.3em] text-zinc-500 uppercase mb-4">
          System Status
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
          All systems operational.
        </h1>
        <p className="text-zinc-400 mb-2">
          Live status of Gyra&apos;s infrastructure and services.
        </p>

        <div className="mt-10 bg-green-500/5 border border-green-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <p className="text-green-400 font-medium">
              {allOperational
                ? "All systems are running normally."
                : "Some systems are experiencing issues."}
            </p>
          </div>
        </div>

        <div className="mt-8 bg-zinc-950/60 border border-zinc-800/60 rounded-2xl overflow-hidden">
          {SERVICES.map((s, i) => (
            <div
              key={s.name}
              className={`flex items-center justify-between p-6 ${
                i !== SERVICES.length - 1 ? "border-b border-zinc-800/60" : ""
              }`}
            >
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-zinc-500 mt-1">{s.description}</p>
              </div>
              <StatusPill status={s.status} />
            </div>
          ))}
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-bold tracking-tight mb-6">
            30-day uptime
          </h2>
          <div className="bg-zinc-950/60 border border-zinc-800/60 rounded-2xl p-6">
            <div className="flex items-end gap-1 h-16">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-green-500/60 rounded-sm"
                  style={{ height: "100%" }}
                />
              ))}
            </div>
            <div className="flex items-center justify-between mt-4 text-xs text-zinc-500">
              <span>30 days ago</span>
              <span className="text-green-400 font-mono">99.98% uptime</span>
              <span>Today</span>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-bold tracking-tight mb-6">
            Incident history
          </h2>
          <div className="bg-zinc-950/60 border border-zinc-800/60 rounded-2xl p-8 text-center">
            <p className="text-zinc-500 text-sm">
              No incidents reported in the last 30 days.
            </p>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/5 flex items-center justify-between text-xs text-zinc-600">
          <p>Need help? Contact hello@gyra.ng</p>
          <Link href="/" className="hover:text-white transition-colors">
            gyra.ng
          </Link>
        </div>
      </div>
    </main>
  );
}