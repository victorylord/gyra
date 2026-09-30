"use client";

import { ReactNode } from "react";

export default function SettingsPage({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: ReactNode;
}) {
  return (
    <div className="absolute inset-0 bg-[var(--background)] z-[75] flex flex-col">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[var(--border)] shrink-0">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-2)] transition-colors"
          aria-label="Back"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full">
        {children}
      </div>
    </div>
  );
}