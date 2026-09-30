"use client";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  danger = true,
  onConfirm,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-[85] flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-[var(--card)] border border-[var(--border)] rounded-3xl overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            {message}
          </p>
        </div>
        <div className="border-t border-[var(--border)] grid grid-cols-2">
          <button
            onClick={onClose}
            className="py-3.5 text-sm font-medium text-[var(--muted)] hover:bg-[var(--card-2)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`py-3.5 text-sm font-medium border-l border-[var(--border)] hover:bg-[var(--card-2)] transition-colors ${
              danger ? "text-red-500" : "text-blue-500"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}