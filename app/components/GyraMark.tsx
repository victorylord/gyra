"use client";

import { useEffect, useState } from "react";

type Props = {
  size?: number;
  glow?: boolean;
  animated?: boolean;
  className?: string;
};

/**
 * Renders the ACTUAL Gyra logo image extracted from favicon.ico.
 * Source file: /public/gyra-mark.png (or .svg)
 * Falls back to /icon.png if the primary isn't found.
 */
export default function GyraMark({
  size = 48,
  glow = false,
  animated = false,
  className = "",
}: Props) {
  const [src, setSrc] = useState("/gyra-mark.png");
  const [glowPulse, setGlowPulse] = useState(0);

  // Pulse animation for the glow
  useEffect(() => {
    if (!animated || !glow) return;
    const id = setInterval(() => {
      setGlowPulse((p) => (p + 1) % 3);
    }, 2500);
    return () => clearInterval(id);
  }, [animated, glow]);

  const glowSize = animated ? 20 + glowPulse * 8 : 20;
  const glowOpacity = animated ? 0.35 + glowPulse * 0.15 : 0.35;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {glow && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none transition-all duration-[2000ms]"
          style={{
            boxShadow: `0 0 ${glowSize * (size / 100)}px rgba(59, 130, 246, ${glowOpacity})`,
            transform: "scale(1.15)",
          }}
        />
      )}

      <img
        src={src}
        alt="Gyra"
        width={size}
        height={size}
        className="relative w-full h-full object-contain select-none pointer-events-none"
        draggable={false}
        onError={() => {
          // Fall back to /icon.png if gyra-mark.png not found
          if (src === "/gyra-mark.png") setSrc("/icon.png");
        }}
      />
    </div>
  );
}