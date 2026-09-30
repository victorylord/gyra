"use client";

import { useEffect, useRef } from "react";

type Action =
  | "copy"
  | "select"
  | "regenerate"
  | "like"
  | "dislike"
  | "read"
  | "share"
  | "report";

type MenuState = {
  x: number;
  y: number;
  messageIndex: number;
  role: "user" | "assistant";
  content: string;
} | null;

type Props = {
  menu: MenuState;
  onClose: () => void;
  onAction: (action: Action, messageIndex: number, content: string) => void;
  reactions: Record<number, "like" | "dislike">;
};

const ITEMS: {
  action: Action;
  label: string;
  icon: string;
  forAssistant?: boolean;
}[] = [
  { action: "copy", label: "Copy", icon: "📋" },
  { action: "select", label: "Select text", icon: "🅰️" },
  { action: "regenerate", label: "Regenerate", icon: "🔄", forAssistant: true },
  { action: "like", label: "Like", icon: "👍", forAssistant: true },
  { action: "dislike", label: "Dislike", icon: "👎", forAssistant: true },
  { action: "read", label: "Read aloud", icon: "🔊", forAssistant: true },
  { action: "share", label: "Share", icon: "↗️" },
  { action: "report", label: "Report", icon: "🚩" },
];

export default function MessageContextMenu({
  menu,
  onClose,
  onAction,
  reactions,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;

    const onDocClick = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    // Delay so the same tap that opened the menu doesn't immediately close it
    const t = setTimeout(() => {
      document.addEventListener("mousedown", onDocClick as EventListener);
      document.addEventListener("touchstart", onDocClick as EventListener);
    }, 0);

    document.addEventListener("keydown", onKey);

    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", onDocClick as EventListener);
      document.removeEventListener("touchstart", onDocClick as EventListener);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu, onClose]);

  if (!menu) return null;

  // Keep the menu inside the viewport
  const menuWidth = 220;
  const menuHeight = 380;
  const pad = 12;
  const vw = typeof window !== "undefined" ? window.innerWidth : 400;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const left = Math.max(pad, Math.min(menu.x, vw - menuWidth - pad));
  const top = Math.max(pad, Math.min(menu.y, vh - menuHeight - pad));

  const visibleItems = ITEMS.filter(
    (item) => !item.forAssistant || menu.role === "assistant"
  );

  return (
    <div
      ref={ref}
      style={{ position: "fixed", left, top, width: menuWidth }}
      className="z-[150] bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden py-1"
    >
      {visibleItems.map((item, i) => {
        const active =
          (item.action === "like" &&
            reactions[menu.messageIndex] === "like") ||
          (item.action === "dislike" &&
            reactions[menu.messageIndex] === "dislike");

        const isDivider = item.action === "read" || item.action === "report";

        return (
          <div key={item.action}>
            {isDivider && i > 0 && <div className="h-px bg-zinc-800 my-1" />}
            <button
              onClick={() => {
                onAction(item.action, menu.messageIndex, menu.content);
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                active
                  ? "text-blue-400 bg-blue-500/10"
                  : item.action === "report"
                  ? "text-red-400 hover:bg-zinc-800"
                  : "text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              <span className="w-5 text-center">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

export type { Action, MenuState };