"use client";

import { useEffect, useState } from "react";
import SettingsPage from "../SettingsPage";

const KEY = "gyra:collapse-thinking";

export default function PersonalizationPage({ onBack }: { onBack: () => void }) {
  const [collapse, setCollapse] = useState(true);

  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (v !== null) setCollapse(v === "1");
    } catch {}
  }, []);

  const toggle = () => {
    const next = !collapse;
    setCollapse(next);
    try {
      localStorage.setItem(KEY, next ? "1" : "0");
    } catch {}
  };

  return (
    <SettingsPage title="Personalization" onBack={onBack}>
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium flex-1">
            Automatically collapse thinking content
          </p>
          <button
            onClick={toggle}
            className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${
              collapse ? "bg-green-500" : "bg-[var(--border)]"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white absolute top-0.5 transition-transform ${
                collapse ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
        <p className="text-xs text-[var(--muted)] mt-3 leading-relaxed">
          When enabled, thinking content will automatically collapse after
          thinking is complete.
        </p>
      </div>
    </SettingsPage>
  );
}