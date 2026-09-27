"use client";

type AttachmentMenuProps = {
  onCamera: () => void;
  onGallery: () => void;
  onFiles: () => void;
  onClose: () => void;
};

export default function AttachmentMenu({
  onCamera,
  onGallery,
  onFiles,
  onClose,
}: AttachmentMenuProps) {
  return (
    <>
      {/* Dim backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[55]"
        onClick={onClose}
      />

      {/* Menu */}
      <div className="absolute bottom-24 left-4 z-[60] bg-zinc-900 border border-zinc-800 rounded-2xl p-2 shadow-2xl w-56">
        <button
          onClick={onCamera}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 rounded-xl transition-colors text-left"
        >
          <span className="text-xl">📷</span>
          <span className="text-sm font-medium">Camera</span>
        </button>
        <button
          onClick={onGallery}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 rounded-xl transition-colors text-left"
        >
          <span className="text-xl">🖼️</span>
          <span className="text-sm font-medium">Gallery</span>
        </button>
        <button
          onClick={onFiles}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 rounded-xl transition-colors text-left"
        >
          <span className="text-xl">📎</span>
          <span className="text-sm font-medium">Files</span>
        </button>
      </div>
    </>
  );
}