"use client";

import { useEffect, useState } from "react";
import SettingsPage from "../SettingsPage";

const STORAGE_KEY = "gyra:font-size";
const FOLLOW_KEY = "gyra:font-size-follow-system";
const DEFAULT_SIZE = 1;
const MIN = 0.85;
const MAX = 1.25;

const PRESETS: { value: number; label: string }[] = [
  { value: 0.85, label: "Small" },
  { value: 0.925, label: "" },
  { value: 1.0, label: "Default" },
  { value: 1.1, label: "" },
  { value: 1.25, label: "Large" },
];

function applyFontSize(size: number) {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--font-scale", String(size));
}

export default function FontSizePage({ onBack }: { onBack: () => void }) {
  const [follow, setFollow] = useState(true);
  const [size, setSize] = useState(DEFAULT_SIZE);

  useEffect(() => {
    try {
      const f = localStorage.getItem(FOLLOW_KEY);
      const s = localStorage.getItem(STORAGE_KEY);
      if (f !== null) setFollow(f === "1");
      if (s !== null) setSize(parseFloat(s));
    } catch {}
  }, []);

  useEffect(() => {
    if (follow) {
      applyFontSize(DEFAULT_SIZE);
    } else {
      applyFontSize(size);
    }
  }, [follow, size]);

  const updateFollow = (v: boolean) => {
    setFollow(v);
    try {
      localStorage.setItem(FOLLOW_KEY, v ? "1" : "0");
    } catch {}
  };

  const updateSize = (v: number) => {
    setSize(v);
    try {
      localStorage.setItem(STORAGE_KEY, String(v));
    } catch {}
  };

  return (
    <SettingsPage title="Font size" onBack={onBack}>
      <div className="flex justify-end mb-6">
        <span className="bg-[var(--card-2)] border border-[var(--border)] rounded-full px-4 py-2 text-xs">
          Preview font size
        </span>
      </div>

      <p className="text-sm text-[var(--muted)] leading-relaxed mb-8">
        You can adjust the font size by dragging the slider below.
      </p>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-8">
          <p className="text-sm font-medium">Follow system</p>
          <button
            onClick={() => updateFollow(!follow)}
            className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${
              follow ? "bg-green-500" : "bg-[var(--border)]"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white absolute top-0.5 transition-transform ${
                follow ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-[var(--muted)] shrink-0">A</span>
          <div className="flex-1 relative">
            <input
              type="range"
              min={MIN}
              max={MAX}
              step={0.01}
              value={size}
              disabled={follow}
              onChange={(e) => updateSize(parseFloat(e.target.value))}
              className="w-full accent-blue-500 disabled:opacity-40"
            />
            <div className="flex justify-between mt-1">
              {PRESETS.map((p) => (
                <span
                  key={p.value}
                  className={`text-[10px] ${
                    Math.abs(size - p.value) < 0.02 && !follow
                      ? "text-blue-500 font-medium"
                      : "text-[var(--muted)]"
                  }`}
                >
                  {p.label}
                </span>
              ))}
            </div>
          </div>
          <span className="text-lg text-[var(--muted)] shrink-0">A</span>
        </div>
      </div>

      <p className="text-xs text-[var(--muted)] mt-6 leading-relaxed">
        When "Follow system" is on, Gyra uses your device's font size setting.
        Turn it off to control the size yourself.
      </p>
    </SettingsPage>
  );
}