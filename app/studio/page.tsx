"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Logo from "../Logo";
import { fal } from "@fal-ai/client";

fal.config({ proxyUrl: "/api/fal/proxy" });

type Job = {
  id: string;
  prompt: string;
  status: "queued" | "in_progress" | "completed" | "error";
  videoUrl?: string;
  error?: string;
};

export default function StudioPage() {
  const [tab, setTab] = useState<"ask" | "imagine" | "build">("imagine");
  const [prompt, setPrompt] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [generating, setGenerating] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const submit = async () => {
    const p = prompt.trim();
    if (!p || generating) return;

    setGenerating(true);
    const placeholder: Job = {
      id: `pending-${Date.now()}`,
      prompt: p,
      status: "queued",
    };
    setJobs((prev) => [placeholder, ...prev]);
    setPrompt("");

    try {
      const res = await fetch("/api/v1/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p }),
      });
      const data = await res.json();

      if (!res.ok || !data?.requestId) {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === placeholder.id
              ? { ...j, status: "error", error: data?.error?.message }
              : j
          )
        );
        setGenerating(false);
        return;
      }

      setJobs((prev) =>
        prev.map((j) =>
          j.id === placeholder.id ? { ...j, id: data.requestId } : j
        )
      );

      pollJob(data.requestId);
    } catch (err: any) {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === placeholder.id
            ? { ...j, status: "error", error: err?.message }
            : j
        )
      );
      setGenerating(false);
    }
  };

  const pollJob = (id: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/video/status/${id}`);
        const data = await res.json();

        if (data?.status === "completed" && data?.videoUrl) {
          setJobs((prev) =>
            prev.map((j) =>
              j.id === id
                ? { ...j, status: "completed", videoUrl: data.videoUrl }
                : j
            )
          );
          setGenerating(false);
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (data?.status === "error") {
          setJobs((prev) =>
            prev.map((j) =>
              j.id === id
                ? { ...j, status: "error", error: data?.error?.message }
                : j
            )
          );
          setGenerating(false);
          if (pollRef.current) clearInterval(pollRef.current);
        } else {
          setJobs((prev) =>
            prev.map((j) =>
              j.id === id ? { ...j, status: "in_progress" } : j
            )
          );
        }
      } catch (e) {
        console.error("poll error", e);
      }
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const TEMPLATES = [
    { label: "Chibi", prompt: "Chibi-style cute character portrait" },
    { label: "Object Remover", prompt: "Remove the object in the center" },
    { label: "Professional Headshot", prompt: "Professional studio headshot" },
    { label: "Haze Portrait", prompt: "Soft haze dreamy portrait" },
  ];

  return (
    <main className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Top nav */}
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

      {/* Tabs */}
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

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {tab === "imagine" && (
          <div className="max-w-4xl mx-auto px-4 pb-40">
            {/* Templates */}
            <div className="mb-6">
              <p className="text-lg font-semibold mb-3">Create from Template</p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.label}
                    onClick={() => setPrompt(t.prompt)}
                    className="shrink-0 w-32 h-40 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors flex items-end p-3 text-left"
                  >
                    <span className="text-xs font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Jobs */}
            {jobs.length > 0 && (
              <div className="mb-6">
                <p className="text-lg font-semibold mb-3">Your generations</p>
                <div className="grid grid-cols-2 gap-3">
                  {jobs.map((j) => (
                    <div
                      key={j.id}
                      className="rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden"
                    >
                      {j.status === "completed" && j.videoUrl ? (
                        <video
                          src={j.videoUrl}
                          controls
                          autoPlay
                          loop
                          muted
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 flex items-center justify-center bg-zinc-900">
                          {j.status === "error" ? (
                            <span className="text-xs text-red-400 px-3 text-center">
                              {j.error || "Failed"}
                            </span>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                              <span className="text-[10px] text-zinc-500">
                                {j.status === "queued"
                                  ? "Queued…"
                                  : "Generating…"}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="p-3">
                        <p className="text-xs text-zinc-400 line-clamp-2">
                          {j.prompt}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {jobs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-2xl font-semibold mb-2">
                  Shape your scene, start to finish
                </p>
                <p className="text-sm text-zinc-500 max-w-md mx-auto">
                  Describe a video. Gyra will generate it in about 30–60
                  seconds.
                </p>
              </div>
            )}
          </div>
        )}

        {tab === "ask" && (
          <div className="max-w-2xl mx-auto px-4 py-10 text-center text-zinc-500">
            Ask mode — coming soon.
          </div>
        )}

        {tab === "build" && (
          <div className="max-w-2xl mx-auto px-4 py-10 text-center text-zinc-500">
            Build mode — coming soon.
          </div>
        )}
      </div>

      {/* Prompt bar */}
      <div className="border-t border-zinc-800/50 bg-black px-4 py-3 shrink-0">
        <div className="max-w-3xl mx-auto bg-zinc-900 border border-zinc-800 rounded-3xl p-3 flex flex-col gap-2">
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
              <button className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-full text-xs text-zinc-300 transition-colors">
                🎬 Video
              </button>
              <button className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-full text-xs text-zinc-300 transition-colors">
                1080p
              </button>
              <button className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-full text-xs text-zinc-300 transition-colors">
                6s
              </button>
              <button className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-full text-xs text-zinc-300 transition-colors">
                🔊 On
              </button>
            </div>
            <button
              onClick={submit}
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
    </main>
  );
}