"use client";

import { useEffect, useState } from "react";

type ToastKind = "success" | "error" | "info";

type ToastState = {
  message: string;
  kind: ToastKind;
} | null;

let toastSetter: ((t: ToastState) => void) | null = null;

export function showToast(message: string, kind: ToastKind = "info") {
  if (toastSetter) toastSetter({ message, kind });
}

export default function ToastContainer() {
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    toastSetter = setToast;
    return () => {
      toastSetter = null;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  if (!toast) return null;

  const color =
    toast.kind === "success"
      ? "bg-green-600"
      : toast.kind === "error"
      ? "bg-red-600"
      : "bg-zinc-800";

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] pointer-events-none">
      <div
        className={`${color} text-white text-sm px-5 py-3 rounded-full shadow-2xl border border-white/10 backdrop-blur`}
      >
        {toast.message}
      </div>
    </div>
  );
}