"use client";

import { useEffect, useState } from "react";

export type VoiceId = "ara" | "james" | "nova" | "sage";

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

const VALID_IDS: VoiceId[] = ["ara", "james", "nova", "sage"];

function read(): VoiceSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      voiceId: VALID_IDS.includes(parsed.voiceId) ? parsed.voiceId : "ara",
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
      window.dispatchEvent(new Event("gyra:voice-settings-changed"));
      return next;
    });
  };

  useEffect(() => {
    const onChange = () => setSettings(read());
    window.addEventListener("gyra:voice-settings-changed", onChange);
    return () =>
      window.removeEventListener("gyra:voice-settings-changed", onChange);
  }, []);

  return { settings, update, loaded };
}

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
    nova: [
      /Microsoft Michelle Online \(Natural\)/i,
      /Google UK English Female/i,
      /Microsoft Zira/i,
      /Female/i,
      /Nova/i,
    ],
    sage: [
      /Microsoft Eric Online \(Natural\)/i,
      /Google US English/i,
      /Microsoft David/i,
      /Male/i,
      /Sage/i,
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