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
  const [glowPhase, setGlowPhase] = useState(0);

  useEffect(() => {
    if (!animated) return;
    const interval = setInterval(() => {
      setGlowPhase((p) => (p + 1) % 3);
    }, 2500);
    return () => clearInterval(interval);
  }, [animated]);

  const gradientId = `gyra-gradient-${size}`;
  const glowId = `gyra-glow-${size}`;

  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: animated
            ? `drop-shadow(0 0 ${20 + glowPhase * 8}px rgba(59, 130, 246, ${
                0.3 + glowPhase * 0.15
              }))`
            : "drop-shadow(0 0 20px rgba(59, 130, 246, 0.3))",
          transition: "filter 2s ease-in-out",
        }}
      >
        <defs>
          {/* Metallic gradient for the G frame */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e5e7eb" />
            <stop offset="30%" stopColor="#9ca3af" />
            <stop offset="50%" stopColor="#f3f4f6" />
            <stop offset="70%" stopColor="#6b7280" />
            <stop offset="100%" stopColor="#1f2937" />
          </linearGradient>

          {/* Blue glow for the inner ring */}
          <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#1e40af" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer G ring — segmented metallic frame */}
        <path
          d="M 100 20 A 80 80 0 0 1 175 65 L 130 90 L 100 55 L 60 80 A 45 45 0 1 0 100 145 L 100 118 L 145 118 L 145 145 A 80 80 0 0 1 100 20 Z"
          fill={`url(#${gradientId})`}
          stroke="#1f2937"
          strokeWidth="0.5"
        />

        {/* Segmentation lines on the outer G */}
        <g stroke="#0f172a" strokeWidth="0.8" opacity="0.7">
          <line x1="55" y1="80" x2="80" y2="55" />
          <line x1="175" y1="65" x2="150" y2="85" />
          <line x1="30" y1="110" x2="55" y2="95" />
          <line x1="100" y1="145" x2="100" y2="165" />
          <line x1="145" y1="118" x2="165" y2="130" />
          <line x1="170" y1="140" x2="155" y2="155" />
        </g>

        {/* Inner neural network area */}
        <g>
          {/* Inner dark circle */}
          <circle cx="100" cy="100" r="48" fill="#050810" />

          {/* Blue glow ring */}
          <circle
            cx="100"
            cy="100"
            r="48"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            opacity="0.9"
            style={{
              filter: animated
                ? `drop-shadow(0 0 ${8 + glowPhase * 4}px rgba(59, 130, 246, 0.9))`
                : "drop-shadow(0 0 8px rgba(59, 130, 246, 0.9))",
              transition: "filter 2s ease-in-out",
            }}
          />

          {/* Neural network nodes and edges */}
          <g stroke="#60a5fa" strokeWidth="0.5" opacity="0.7">
            {/* Edges */}
            <line x1="70" y1="90" x2="90" y2="75" />
            <line x1="90" y1="75" x2="115" y2="70" />
            <line x1="115" y1="70" x2="130" y2="88" />
            <line x1="70" y1="90" x2="85" y2="105" />
            <line x1="85" y1="105" x2="100" y2="95" />
            <line x1="100" y1="95" x2="115" y2="70" />
            <line x1="100" y1="95" x2="130" y2="88" />
            <line x1="100" y1="95" x2="115" y2="115" />
            <line x1="130" y1="88" x2="125" y2="110" />
            <line x1="125" y1="110" x2="115" y2="115" />
            <line x1="85" y1="105" x2="100" y2="125" />
            <line x1="100" y1="125" x2="115" y2="115" />
            <line x1="75" y1="115" x2="85" y2="105" />
            <line x1="75" y1="115" x2="100" y2="125" />
          </g>

          {/* Nodes */}
          <g fill="#93c5fd">
            <circle cx="70" cy="90" r="2" />
            <circle cx="90" cy="75" r="2.5" />
            <circle cx="115" cy="70" r="2" />
            <circle cx="130" cy="88" r="2.5" />
            <circle cx="85" cy="105" r="2" />
            <circle cx="100" cy="95" r="3" fill="#dbeafe" />
            <circle cx="125" cy="110" r="2" />
            <circle cx="115" cy="115" r="2.5" />
            <circle cx="100" cy="125" r="2" />
            <circle cx="75" cy="115" r="2" />
          </g>
        </g>
      </svg>

      {showWordmark && (
        <div
          className="mt-6 text-white tracking-widest font-bold"
          style={{
            fontSize: size * 0.28,
            letterSpacing: "0.15em",
            fontFamily:
              "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
          }}
        >
          GYRA
        </div>
      )}
    </div>
  );
}