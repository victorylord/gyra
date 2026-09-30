"use client";

import { ReactNode } from "react";

type Props = {
  icon?: ReactNode;
  label: string;
  value?: string;
  hint?: string;
  danger?: boolean;
  onClick?: () => void;
  rightSlot?: ReactNode;
  showChevron?: boolean;
};

export default function SettingsRow({
  icon,
  label,
  value,
  hint,
  danger,
  onClick,
  rightSlot,
  showChevron = true,
}: Props) {
  const isButton = !!onClick;

  const content = (
    <div className="flex items-center gap-3 w-full px-4 py-3.5 text-left">
      {icon && (
        <span className="w-6 flex items-center justify-center text-zinc-400 shrink-0">
          {icon}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${
            danger ? "text-red-500" : "text-[var(--foreground)]"
          }`}
        >
          {label}
        </p>
        {hint && (
          <p className="text-xs text-[var(--muted)] mt-0.5">{hint}</p>
        )}
      </div>
      {value && (
        <span className="text-sm text-[var(--muted)] truncate max-w-[40%]">
          {value}
        </span>
      )}
      {rightSlot}
      {showChevron && !rightSlot && (
        <svg
          className="w-4 h-4 text-[var(--muted)] shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
      )}
    </div>
  );

  if (!isButton) {
    return <div className="w-full">{content}</div>;
  }

  return (
    <button
      onClick={onClick}
      className="w-full transition-colors hover:bg-[var(--card-2)]/60 rounded-xl"
    >
      {content}
    </button>
  );
}