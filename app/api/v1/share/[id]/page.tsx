import Link from "next/link";

export default async function SharedChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gyra.ng';
  const res = await fetch(`${baseUrl}/api/v1/share/${id}`, {
    cache: 'no-store'
  });
  
  const data = await res.json();

  if (!res.ok || data.error) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <h1 className="text-2xl font-bold mb-4">Link Unavailable</h1>
        <p className="text-zinc-400 mb-6 text-center">{data.error || "This shared chat could not be found or has been revoked."}</p>
        <Link href="/" className="bg-white text-black px-6 py-2 rounded-full font-medium hover:bg-zinc-200 transition-colors">
          Go to Gyra
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-2xl">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 border-b border-zinc-800 pb-4">
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xl text-white">
            G
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{data.title}</h1>
            <p className="text-xs text-zinc-500">Shared via Gyra AI</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex flex-col gap-6 mb-12">
          {data.messages.map((msg: any, i: number) => (
            <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`px-5 py-3 rounded-3xl max-w-[85%] text-[15px] leading-relaxed ${
                msg.role === "user" 
                  ? "bg-[#2f2f2f] text-white" 
                  : "bg-transparent text-zinc-100"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="text-center border-t border-zinc-800 pt-8">
          <p className="text-zinc-400 mb-4">Want to chat with AI like this?</p>
          <Link href="/dashboard" className="bg-white text-black px-8 py-3 rounded-full font-semibold hover:bg-zinc-200 transition-colors">
            Try Gyra AI Free →
          </Link>
        </div>
      </div>
    </div>
  );
}