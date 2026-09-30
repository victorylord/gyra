import Link from "next/link";
import Logo from "../../Logo";

type PageProps = { params: Promise<{ id: string }> };

async function getShare(id: string) {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL || "https://gyra.ng";
  try {
    const res = await fetch(`${base}/api/v1/share/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function SharedChatPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getShare(id);

  if (!data) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-3">Share not found</h1>
          <p className="text-zinc-500 text-sm mb-6">
            This link may have been revoked or never existed.
          </p>
          <Link
            href="/"
            className="bg-white text-black px-6 py-2.5 rounded-full font-medium hover:bg-zinc-200 transition-colors"
          >
            Go to Gyra
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="border-b border-zinc-800/50 px-6 py-4 flex items-center justify-between sticky top-0 bg-black/95 backdrop-blur z-30">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={26} animated={false} />
          <span className="font-bold tracking-widest text-sm">GYRA</span>
          <span className="text-zinc-600 text-xs tracking-widest">
            SHARED CHAT
          </span>
        </Link>
        <Link
          href="/"
          className="text-sm bg-white text-black px-4 py-2 rounded-full font-medium hover:bg-zinc-200 transition-colors"
        >
          Try Gyra →
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">{data.title}</h1>
        <p className="text-xs text-zinc-500 mb-8">
          Shared {new Date(data.createdAt).toLocaleDateString()} · read-only
        </p>

        <div className="flex flex-col gap-4">
          {data.messages.map((m: any, i: number) => (
            <div
              key={i}
              className={`p-4 rounded-xl max-w-[85%] leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-blue-600 self-end text-white"
                  : "bg-zinc-800 self-start text-zinc-200"
              }`}
            >
              {m.content}
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-zinc-800/60 text-center">
          <p className="text-zinc-500 text-sm mb-4">
            Want to chat like this? Gyra is free to try.
          </p>
          <Link
            href="/"
            className="inline-block bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-zinc-200 transition-colors"
          >
            Start with Gyra
          </Link>
        </div>
      </div>
    </main>
  );
}