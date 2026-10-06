"use client";

import { useEffect, useState } from "react";

export default function AnimatedNumber({
  value,
  duration = 800,
  className = "",
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const from = display;
    const to = value;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return (
    <span className={className}>
      {display.toLocaleString("en-US")}
    </span>
  );
}