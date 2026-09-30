"use client";

import { ReactNode } from "react";

export default function SettingsGroup({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-6">
      {title && (
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] px-1 mb-2">
          {title}
        </p>
      )}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl divide-y divide-[var(--border)] overflow-hidden">
        {children}
      </div>
    </div>
  );
}