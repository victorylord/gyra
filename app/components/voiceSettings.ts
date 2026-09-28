"use client";

import { useEffect, useState } from "react";

export type VoiceId = "ara" | "james";

export type VoiceSettings = {
  voiceId: VoiceId;
  rate: number;
  pitch: number;
};

const STORAGE_KEY = "gyra:voice-settings";

const DEFAULTS: VoiceSettings = {
  voiceId: "ara",
  rate: 1.05,
  pitch: 1,
};

function read(): VoiceSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      voiceId: parsed.voiceId === "james" ? "james" : "ara",
      rate: typeof parsed.rate === "number" ? parsed.rate : DEFAULTS.rate,
      pitch: typeof parsed.pitch === "number" ? parsed.pitch : DEFAULTS.pitch,
    };
  } catch {
    return DEFAULTS;
  }
}

export function useVoiceSettings() {
  const [settings, setSettings] = useState<VoiceSettings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSettings(read());
    setLoaded(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setSettings(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = (patch: Partial<VoiceSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      // Also broadcast to same-tab listeners
      window.dispatchEvent(new Event("gyra:voice-settings-changed"));
      return next;
    });
  };

  // Listen for same-tab changes from other components
  useEffect(() => {
    const onChange = () => setSettings(read());
    window.addEventListener("gyra:voice-settings-changed", onChange);
    return () =>
      window.removeEventListener("gyra:voice-settings-changed", onChange);
  }, []);

  return { settings, update, loaded };
}

/**
 * Resolve a browser SpeechSynthesis voice for a given Gyra voice ID.
 * Browser voice names vary wildly per OS/browser, so we try:
 *   1. Exact alias matches (per platform)
 *   2. Fuzzy keyword matches
 *   3. English fallback
 */
export function resolveVoice(
  voices: SpeechSynthesisVoice[],
  voiceId: VoiceId
): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  const aliases: Record<VoiceId, RegExp[]> = {
    ara: [
      /^Google US English$/i,
      /Microsoft Aria Online \(Natural\)/i,
      /Microsoft Jenny Online \(Natural\)/i,
      /Samantha/i,
      /Microsoft Zira/i,
      /Google UK English Female/i,
      /Female/i,
      /Aria|Ara/i,
    ],
    james: [
      /^Google UK English Male$/i,
      /Microsoft Guy Online \(Natural\)/i,
      /Microsoft Ryan Online \(Natural\)/i,
      /Microsoft Christopher Online \(Natural\)/i,
      /Daniel/i,
      /Alex/i,
      /Microsoft David/i,
      /Male/i,
      /James/i,
    ],
  };

  const english = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  const pool = english.length ? english : voices;

  for (const rx of aliases[voiceId]) {
    const hit = pool.find((v) => rx.test(v.name));
    if (hit) return hit;
  }

  return pool[0] ?? null;
}