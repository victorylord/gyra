"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Logo from "../Logo";
import { supabase } from "../supabase";

type Job = {
  id: string;
  request_id: string;
  prompt: string;
  status: "queued" | "in_progress" | "completed" | "error";
  video_url?: string | null;
  error?: string | null;
  created_at: string;
};

const TEMPLATES = [
  {
    id: "chibi",
    label: "Chibi",
    prompt: "Chibi-style cute character portrait, soft lighting, colorful",
    gradient: "from-pink-500/20 to-purple-500/20",
  },
  {
    id: "object",
    label: "Object Remover",
    prompt: "Cinematic shot with clean background, subject in focus",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    id: "headshot",
    label: "Professional Headshot",
    prompt:
      "Professional studio headshot, soft key light, neutral background, sharp focus",
    gradient: "from-zinc-500/20 to-zinc-700/20",
  },
  {
    id: "haze",
    label: "Haze Portrait",
    prompt: "Soft haze dreamy portrait, warm golden hour light, cinematic",
    gradient: "from-orange-500/20 to-yellow-500/20",
  },
  {
    id: "space",
    label: "Space Scene",
    prompt:
      "Cinematic space scene, nebula, a small figure standing on the edge, glowing teal particles",
    gradient: "from-teal-500/20 to-blue-500/20",
  },
];

const SUGGESTIONS = [
  "A lion walking through Lagos traffic at sunset",
  "Close-up of jollof rice steaming, cinematic",
  "Woman in colorful ankara dress walking through a market",
  "Drone shot of Victoria Island at night, neon lights",
  "A calabash on water, mystical, gold light",
  "Slow motion of rain hitting a danfo window",
];

export default function StudioPage() {
  const [tab, setTab] = useState<"ask" | "imagine" | "build">("imagine");
  const [prompt, setPrompt] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await fetch("/api/v1/video/history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data?.jobs) {
          setJobs(
            data.jobs.map((j: any) => ({
              id: j.id,
              request_id: j.request_id,
              prompt: j.prompt,
              status: j.status,
              video_url: j.video_url,
              error: j.error,
              created_at: j.created_at,
            }))
          );
          const active = data.jobs.find(
            (j: any) => j.status === "queued" || j.status === "in_progress"
          );
          if (active) pollJob(active.request_id);
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const pollJob = (requestId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/video/status/${requestId}`);
        const data = await res.json();

        if (data?.status === "completed" && data?.videoUrl) {
          setJobs((prev) =>
            prev.map((j) =>
              j.request_id === requestId
                ? { ...j, status: "completed", video_url: data.videoUrl }
                : j
            )
          );
          setGenerating(false);
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (data?.error) {
          setJobs((prev) =>
            prev.map((j) =>
              j.request_id === requestId
                ? { ...j, status: "error", error: data.error.message }
                : j
            )
          );
          setGenerating(false);
          if (pollRef.current) clearInterval(pollRef.current);
        } else {
          setJobs((prev) =>
            prev.map((j) =>
              j.request_id === requestId
                ? { ...j, status: "in_progress" }
                : j
            )
          );
        }
      } catch (e) {
        console.error("poll error", e);
      }
    }, 3000);
  };

  const submit = async (overridePrompt?: string) => {
    const p = (overridePrompt ?? prompt).trim();
    if (!p || generating) return;

    setError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setError("Please sign in first.");
      return;
    }

    setGenerating(true);
    setPrompt("");

    try {
      const res = await fetch("/api/v1/video/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gyra-user-token": token,
        },
        body: JSON.stringify({ prompt: p }),
      });
      const data = await res.json();

      if (res.status === 402) {
        setShowPaywall(true);
        setGenerating(false);
        return;
      }

      if (!res.ok || !data?.requestId) {
        setError(data?.error?.message || "Could not queue generation.");
        setGenerating(false);
        return;
      }

      setJobs((prev) => [
        {
          id: `pending-${Date.now()}`,
          request_id: data.requestId,
          prompt: p,
          status: "queued",
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);

      setReferencePreview(null);
      pollJob(data.requestId);
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
      setGenerating(false);
    }
  };

  const handlePhoto = (file: File | null) => {
    if (!file) {
      setReferencePreview(null);
      return;
    }
    setReferencePreview(URL.createObjectURL(file));
  };

  const downloadVideo = async (url: string, name: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `${name.replace(/[^a-z0-9]/gi, "_").slice(0, 40)}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 shrink-0">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={26} animated={false} />
          <span className="font-bold tracking-widest text-sm">GYRA</span>
          <span className="text-zinc-600 text-xs tracking-widest">STUDIO</span>
        </Link>
        <Link
          href="/dashboard"
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          ← Back to chat
        </Link>
      </div>

      <div className="flex items-center justify-center gap-8 pt-5 pb-4 shrink-0">
        {(["ask", "imagine", "build"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-sm font-medium capitalize transition-colors relative pb-1 ${
              tab === t ? "text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t}
            {tab === t && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "imagine" && (
          <div className="max-w-5xl mx-auto px-4 pb-48">
            <div className="mb-8">
              <p className="text-base font-semibold mb-3">Animate your photos</p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0 w-36 h-44 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-dashed border-zinc-700 hover:border-zinc-500 transition-colors flex flex-col items-center justify-center gap-2"
                >
                  <span className="text-3xl text-zinc-400">+</span>
                  <span className="text-xs text-zinc-400">Add photo</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhoto(e.target.files?.[0] || null)}
                  className="hidden"
                />
                {referencePreview && (
                  <div className="shrink-0 w-36 h-44 rounded-2xl bg-zinc-900 border border-blue-500/50 overflow-hidden relative">
                    <img
                      src={referencePreview}
                      alt="reference"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handlePhoto(null)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/80 flex items-center justify-center text-xs"
                    >
                      ✕
                    </button>
                  </div>
                )}
                {!referencePreview &&
                  [
                    "from-blue-900/40 to-black",
                    "from-purple-900/40 to-black",
                    "from-teal-900/40 to-black",
                  ].map((g, i) => (
                    <div
                      key={i}
                      className={`shrink-0 w-36 h-44 rounded-2xl bg-gradient-to-br ${g} border border-zinc-800 opacity-40`}
                    />
                  ))}
              </div>
            </div>

            <div className="mb-8">
              <p className="text-base font-semibold mb-3">Create from Template</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setPrompt(t.prompt)}
                    className={`aspect-video rounded-2xl bg-gradient-to-br ${t.gradient} border border-zinc-800 hover:border-zinc-600 transition-all flex items-end p-4 text-left group`}
                  >
                    <span className="text-sm font-medium group-hover:text-white text-zinc-300">
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-base font-semibold">Your generations</p>
                {jobs.length > 0 && (
                  <span className="text-xs text-zinc-500">
                    {jobs.length} {jobs.length === 1 ? "video" : "videos"}
                  </span>
                )}
              </div>

              {loading ? (
                <p className="text-sm text-zinc-500">Loading…</p>
              ) : jobs.length === 0 ? (
                <div className="text-center py-12 bg-zinc-950 border border-zinc-800 rounded-2xl">
                  <div className="text-4xl mb-3 opacity-40">🎬</div>
                  <p className="text-base font-medium mb-1">
                    Shape your scene, start to finish
                  </p>
                  <p className="text-sm text-zinc-500 max-w-md mx-auto px-4">
                    Describe a video. Gyra will generate it in 30–90 seconds.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {jobs.map((j) => (
                    <div
                      key={j.id}
                      className="rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden group"
                    >
                      {j.status === "completed" && j.video_url ? (
                        <video
                          src={j.video_url}
                          controls
                          loop
                          muted
                          playsInline
                          className="w-full aspect-video object-cover bg-black"
                        />
                      ) : (
                        <div className="w-full aspect-video flex items-center justify-center bg-zinc-900">
                          {j.status === "error" ? (
                            <div className="text-center px-4">
                              <p className="text-xs text-red-400 mb-1">
                                Generation failed
                              </p>
                              <p className="text-[10px] text-zinc-500">
                                {j.error || "Unknown error"}
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                              <span className="text-xs text-zinc-500">
                                {j.status === "queued"
                                  ? "Queued…"
                                  : "Generating…"}
                              </span>
                              <span className="text-[10px] text-zinc-600">
                                ~30–90s
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="p-3 flex items-start justify-between gap-3">
                        <p className="text-xs text-zinc-400 line-clamp-2 flex-1">
                          {j.prompt}
                        </p>
                        {j.status === "completed" && j.video_url && (
                          <button
                            onClick={() =>
                              downloadVideo(j.video_url!, j.prompt)
                            }
                            className="shrink-0 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors"
                            title="Download"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              />
                            </svg>
                            Save
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "ask" && (
          <div className="max-w-2xl mx-auto px-4 py-10 text-center">
            <p className="text-zinc-500 text-sm">Ask mode — coming soon.</p>
          </div>
        )}

        {tab === "build" && (
          <div className="max-w-2xl mx-auto px-4 py-10 text-center">
            <p className="text-zinc-500 text-sm">Build mode — coming soon.</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-800/50 bg-black/95 backdrop-blur px-4 py-3">
        <div className="max-w-3xl mx-auto">
          {!prompt && !generating && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
              {SUGGESTIONS.slice(0, 4).map((s) => (
                <button
                  key={s}
                  onClick={() => setPrompt(s)}
                  className="shrink-0 text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3 py-1.5 rounded-full text-zinc-400 hover:text-white transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-3 flex flex-col gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Type to imagine…"
              className="bg-transparent outline-none text-base text-white placeholder:text-zinc-500 w-full px-2"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 bg-zinc-800 px-3 py-1.5 rounded-full text-xs text-zinc-300">
                  🎬 Video
                </span>
                <span className="flex items-center gap-1 bg-zinc-800 px-3 py-1.5 rounded-full text-xs text-zinc-300">
                  720p
                </span>
                <span className="flex items-center gap-1 bg-zinc-800 px-3 py-1.5 rounded-full text-xs text-zinc-300">
                  5s
                </span>
              </div>
              <button
                onClick={() => submit()}
                disabled={generating || !prompt.trim()}
                className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors disabled:opacity-40"
              >
                {generating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="white"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 12h14M12 5l7 7-7 7"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPaywall && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-5 mx-auto">
              <span className="text-2xl">⚡</span>
            </div>
            <h2 className="text-2xl font-bold mb-3">
              Video generation is a SuperGyra feature
            </h2>
            <p className="text-zinc-400 mb-8 leading-relaxed">
              Free users can browse templates and see the Studio — but generating
              videos requires SuperGyra. Unlock unlimited chat, video generation,
              image generation, and more.
            </p>
            <Link
              href="/upgrade"
              className="block bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-zinc-200 transition-colors w-full mb-3"
            >
              Upgrade to SuperGyra →
            </Link>
            <button
              onClick={() => setShowPaywall(false)}
              className="text-zinc-500 hover:text-white text-sm transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </main>
  );
}