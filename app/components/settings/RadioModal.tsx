"use client";

import { useEffect, useRef } from "react";

export type RadioOption<T extends string> = {
  id: T;
  label: string;
  hint?: string;
};

type Props<T extends string> = {
  open: boolean;
  title: string;
  icon?: string;
  options: RadioOption<T>[];
  value: T;
  onSelect: (id: T) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export default function RadioModal<T extends string>({
  open,
  title,
  icon,
  options,
  value,
  onSelect,
  onClose,
  onConfirm,
}: Props<T>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-[80] flex items-center justify-center p-6"
      onClick={(e) => {
        if (e.target === ref.current?.parentElement) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={ref}
        className="relative w-full max-w-sm bg-[var(--card-2)] border border-[var(--border)] rounded-3xl overflow-hidden"
      >
        <div className="pt-6 pb-4 flex flex-col items-center">
          {icon && <span className="text-2xl mb-2">{icon}</span>}
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {options.map((opt) => {
            const selected = opt.id === value;
            return (
              <button
                key={opt.id}
                onClick={() => onSelect(opt.id)}
                className="w-full flex items-center gap-4 px-6 py-3.5 text-left hover:bg-[var(--border)]/40 transition-colors"
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selected
                      ? "border-[var(--foreground)]"
                      : "border-[var(--muted)]"
                  }`}
                >
                  {selected && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--foreground)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{opt.label}</p>
                  {opt.hint && (
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      {opt.hint}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="border-t border-[var(--border)]">
          <button
            onClick={onConfirm}
            className="w-full py-4 text-center text-sm font-medium text-blue-500 hover:bg-[var(--border)]/40 transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}