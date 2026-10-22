"use client";

type AttachmentMenuProps = {
  onCamera: () => void;
  onGallery: () => void;
  onFiles: () => void;
  onClose: () => void;
  recentImages?: string[];
  onSelectRecent?: (base64: string) => void;
};

export default function AttachmentMenu({
  onCamera,
  onGallery,
  onFiles,
  onClose,
  recentImages = [],
  onSelectRecent,
}: AttachmentMenuProps) {
  return (
    <>
      {/* Dim backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[55]"
        onClick={onClose}
      />

      {/* Menu */}
      <div className="absolute bottom-24 left-0 w-full bg-[#212121] border border-zinc-800 rounded-3xl p-5 shadow-2xl z-[60] animate-in slide-in-from-bottom-5 fade-in duration-200">
        
        {/* Recent Images Row */}
        {recentImages.length > 0 && (
          <div className="mb-6">
            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
              {recentImages.map((img, i) => (
                <div 
                  key={i} 
                  onClick={() => onSelectRecent && onSelectRecent(img)}
                  className="relative w-20 h-24 rounded-xl overflow-hidden shrink-0 cursor-pointer border border-zinc-700 hover:border-blue-500 transition-colors"
                >
                  <img src={img} alt="recent" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Buttons Grid */}
        <div className="grid grid-cols-3 gap-3">
          {/* Camera */}
          <button
            onClick={onCamera}
            className="flex flex-col items-center justify-center gap-3 bg-zinc-800/80 hover:bg-zinc-700 rounded-2xl p-5 transition-colors"
          >
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-medium text-white">Camera</span>
          </button>

          {/* Photo */}
          <button
            onClick={onGallery}
            className="flex flex-col items-center justify-center gap-3 bg-zinc-800/80 hover:bg-zinc-700 rounded-2xl p-5 transition-colors"
          >
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium text-white">Photo</span>
          </button>

          {/* Document */}
          <button
            onClick={onFiles}
            className="flex flex-col items-center justify-center gap-3 bg-zinc-800/80 hover:bg-zinc-700 rounded-2xl p-5 transition-colors"
          >
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span className="text-sm font-medium text-white">Document</span>
          </button>
        </div>
      </div>
    </>
  );
}