"use client";

import { useState } from "react";

export default function CodeBlock({
  language,
  code,
  label,
}: {
  language: string;
  code: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-black/60">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="text-[11px] text-zinc-500 font-mono tracking-wide">
            {label || language}
          </span>
        </div>
        <button
          onClick={copy}
          className="text-[11px] text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-2.5 py-1 rounded-md border border-zinc-800 transition-colors flex items-center gap-1.5"
        >
          {copied ? (
            <>
              <svg
                className="w-3 h-3 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Copied
            </>
          ) : (
            "Copy"
          )}
        </button>
      </div>
      <pre className="p-4 text-xs md:text-sm font-mono text-zinc-300 overflow-x-auto leading-relaxed">
        {code}
      </pre>
    </div>
  );
}