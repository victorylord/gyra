"use client";

import { useEffect, useState } from "react";

type LogoProps = {
  size?: number;
  showWordmark?: boolean;
  animated?: boolean;
};

export default function Logo({
  size = 120,
  showWordmark = false,
  animated = true,
}: LogoProps) {
  const [glow, setGlow] = useState(0);

  useEffect(() => {
    if (!animated) return;
    const interval = setInterval(() => {
      setGlow((p) => (p + 1) % 3);
    }, 2500);
    return () => clearInterval(interval);
  }, [animated]);

  const glowSize = animated ? 20 + glow * 8 : 20;
  const glowOpacity = animated ? 0.3 + glow * 0.15 : 0.3;

  return (
    <div className="flex flex-col items-center">
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 30% 30%, #1f2937, #000000)",
          boxShadow: `0 0 ${glowSize}px rgba(59, 130, 246, ${glowOpacity})`,
          transition: "box-shadow 2s ease-in-out",
          position: "relative",
        }}
      >
        <span
          style={{
            fontSize: size * 0.6,
            fontWeight: 700,
            letterSpacing: "-0.05em",
            background:
              "linear-gradient(135deg, #e5e7eb 0%, #9ca3af 40%, #f3f4f6 60%, #4b5563 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            lineHeight: 1,
          }}
        >
          G
        </span>
        <div
          style={{
            position: "absolute",
            inset: size * 0.12,
            borderRadius: "50%",
            border: "2px solid rgba(59, 130, 246, 0.6)",
            boxShadow: `0 0 ${glowSize / 2}px rgba(59, 130, 246, ${
              glowOpacity + 0.3
            })`,
            transition: "box-shadow 2s ease-in-out",
          }}
        />
      </div>
      {showWordmark && (
        <div
          className="mt-6 font-bold tracking-widest text-white"
          style={{ fontSize: size * 0.28, letterSpacing: "0.15em" }}
        >
          GYRA
        </div>
      )}
    </div>
  );
}