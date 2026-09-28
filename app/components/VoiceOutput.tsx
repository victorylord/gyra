"use client";

import { useEffect, useRef, useState } from "react";
import { resolveVoice, useVoiceSettings, type VoiceId } from "./voiceSettings";

type VoiceOutputProps = {
  enabled: boolean;
  text: string;
  voiceName?: string;
  rate?: number;
  pitch?: number;
  onEnd?: () => void;
};

export default function VoiceOutput({
  enabled,
  text,
  voiceName,
  rate = 1,
  pitch = 1,
  onEnd,
}: VoiceOutputProps) {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);
  const { settings } = useVoiceSettings();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) setSupported(false);
  }, []);

  useEffect(() => {
    if (!enabled || !text || !supported) return;

    // Cancel any prior speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;

    const voices = window.speechSynthesis.getVoices();

    // Priority: explicit voiceName → user's voiceId setting
    if (voiceName && voices.length > 0) {
      const match = voices.find((v) => v.name === voiceName);
      if (match) utterance.voice = match;
    } else if (voices.length > 0) {
      const resolved = resolveVoice(voices, settings.voiceId as VoiceId);
      if (resolved) utterance.voice = resolved;
    }

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => {
      setSpeaking(false);
      onEnd?.();
    };
    utterance.onerror = () => setSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [enabled, text, voiceName, rate, pitch, supported, settings.voiceId]);

  if (!enabled || !supported) return null;
  return null; // Side-effect only component
}

// ============================================================
// Voice Toggle Button (inline, next to Think/Search)
// ============================================================
export function VoiceToggleButton({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
        enabled
          ? "bg-blue-600 border-blue-500 text-white"
          : "bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"
      }`}
    >
      {enabled ? "🔊" : "🔈"} Voice
    </button>
  );
}