"use client";

import { useEffect, useRef, useState } from "react";
import { VOICE_OPTIONS } from "./voiceOptions";
import { useVoiceSettings } from "../voiceSettings";

export default function VoiceCarousel({ onConfirm }: { onConfirm: () => void }) {
  const { settings, update } = useVoiceSettings();
  const [index, setIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync initial index to current selection
  useEffect(() => {
    const i = VOICE_OPTIONS.findIndex((v) => v.id === settings.voiceId);
    if (i >= 0) setIndex(i);
  }, [settings.voiceId]);

  const current = VOICE_OPTIONS[index];

  const preview = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const line =
      current.id === "ara"
        ? "Hi, I'm Ara. Warm and natural."
        : current.id === "james"
        ? "Hi, I'm James. Deep and confident."
        : current.id === "nova"
        ? "Hi, I'm Nova. Bright and playful."
        : "Hi, I'm Sage. Calm and measured.";
    const u = new SpeechSynthesisUtterance(line);
    u.rate = settings.rate;
    u.pitch = settings.pitch;
    window.speechSynthesis.speak(u);
  };

  // Auto-preview on slide change
  useEffect(() => {
    const t = setTimeout(() => preview(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  return (
    <div className="absolute inset-0 bg-[var(--background)] z-[75] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 shrink-0">
        <div className="w-9" />
        <h2 className="text-base font-semibold tracking-tight">Voice</h2>
        <button
          onClick={onConfirm}
          className="w-9 h-9 rounded-full bg-[var(--card-2)] hover:bg-[var(--border)] flex items-center justify-center transition-colors"
          aria-label="Close"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Carousel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div
          ref={containerRef}
          className="w-full max-w-xs flex flex-col items-center"
        >
          {/* Blob avatar */}
          <div
            className="w-56 h-36 rounded-[4rem] mb-8 transition-all duration-500"
            style={{
              background: current.gradient,
              filter: "blur(2px)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            }}
          />
          <h3 className="text-2xl font-semibold mb-1">{current.name}</h3>
          <p className="text-sm text-[var(--muted)] mb-10">
            {current.tagline}
          </p>
        </div>

        {/* Dots */}
        <div className="flex items-center gap-2 mb-10">
          {VOICE_OPTIONS.map((v, i) => (
            <button
              key={v.id}
              onClick={() => {
                setIndex(i);
                update({ voiceId: v.id });
              }}
              aria-label={`Select ${v.name}`}
              className={`w-2 h-2 rounded-full transition-all ${
                i === index
                  ? "bg-blue-500 w-4"
                  : "bg-[var(--muted-2)] hover:bg-[var(--muted)]"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Confirm */}
      <div className="px-6 pb-8 shrink-0">
        <button
          onClick={() => {
            update({ voiceId: current.id });
            onConfirm();
          }}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-full font-semibold transition-colors"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}