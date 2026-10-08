"use client";

import { useRef, useState } from "react";

export type Template = {
  id: string;
  label: string;
  category: string;
  prompt: string;
  description: string;
  previewBefore: string;
  previewAfter: string;
  model: string;
  credits: number;
};

export default function TemplateModal({
  template,
  onClose,
  onUse,
}: {
  template: Template;
  onClose: () => void;
  onUse: (prompt: string, imageBase64: string | null) => void;
}) {
  const [tab, setTab] = useState<"photo" | "style">("photo");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [style, setStyle] = useState<string>("chibi");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | null) => {
    if (!file) {
      setImagePreview(null);
      setImageBase64(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setImageBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const STYLES = [
    { id: "chibi", label: "Chibi" },
    { id: "comic", label: "Comic" },
    { id: "3d", label: "3D" },
    { id: "70s", label: "70s Street" },
    { id: "80s-anime", label: "80s Anime" },
    { id: "film", label: "Sunday Film" },
  ];

  const handleUse = () => {
    const finalPrompt =
      tab === "style"
        ? `${template.prompt}. Style: ${style}.`
        : template.prompt;
    onUse(finalPrompt, imageBase64);
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <h2 className="text-base font-semibold">{template.label}</h2>
        <button
          onClick={() => {
            const url = window.location.href;
            if (navigator.share) {
              navigator
                .share({ title: `Gyra · ${template.label}`, url })
                .catch(() => {});
            } else {
              navigator.clipboard.writeText(url);
            }
          }}
          className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          aria-label="Share"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-lg mx-auto w-full">
        {/* Before / After */}
        <div className="relative rounded-3xl overflow-hidden bg-zinc-950 border border-zinc-800 mb-6">
          <div className="grid grid-cols-3 h-64">
            <img
              src={template.previewBefore}
              alt="before"
              className="w-full h-full object-cover"
            />
            <div className="relative">
              <img
                src={template.previewAfter}
                alt="after"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-transparent" />
            </div>
            <img
              src={template.previewAfter}
              alt="after-2"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-zinc-400 leading-relaxed mb-6">
          {template.description}
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(["photo", "style"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
                tab === t
                  ? "bg-white text-black"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              Your {t}
            </button>
          ))}
        </div>

        {/* Upload */}
        {tab === "photo" && (
          <div className="mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-zinc-800">
                <img
                  src={imagePreview}
                  alt="preview"
                  className="w-full aspect-square object-cover"
                />
                <button
                  onClick={() => handleFile(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/80 backdrop-blur flex items-center justify-center text-white text-sm hover:bg-black"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-2xl bg-zinc-950 border border-dashed border-zinc-700 hover:border-zinc-500 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors text-3xl"
              >
                +
              </button>
            )}
          </div>
        )}

        {/* Style picker */}
        {tab === "style" && (
          <div className="flex flex-wrap gap-2 mb-6">
            {STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className={`px-4 py-2 rounded-full text-sm border transition-all ${
                  style === s.id
                    ? "bg-white text-black border-white"
                    : "bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Cost */}
        <div className="flex items-center gap-2 text-xs text-blue-300 mb-4">
          <span>💎</span>
          <span>This costs ${template.credits.toFixed(2)} per generation</span>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="border-t border-zinc-800/50 px-4 py-4 bg-black shrink-0">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleUse}
            className="w-full bg-white text-black py-4 rounded-full font-semibold hover:bg-zinc-200 transition-colors"
          >
            Use This Template
          </button>
        </div>
      </div>
    </div>
  );
}