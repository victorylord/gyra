"use client";

import { useCallback, useRef } from "react";

type Options = {
  /** ms to hold before triggering (default 500) */
  delay?: number;
  /** ms movement allowed before cancelling (default 10) */
  moveTolerance?: number;
};

/**
 * Long-press detection for both touch and pointer events.
 * Returns event handlers to spread onto the target element.
 */
export function useLongPress(
  onLongPress: (e: React.MouseEvent | React.TouchEvent) => void,
  onClick?: (e: React.MouseEvent | React.TouchEvent) => void,
  options: Options = {}
) {
  const { delay = 500, moveTolerance = 10 } = options;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const triggeredRef = useRef(false);

  const start = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      triggeredRef.current = false;
      const point =
        "touches" in e ? e.touches[0] : (e as React.MouseEvent);
      startPosRef.current = { x: point.clientX, y: point.clientY };

      timerRef.current = setTimeout(() => {
        triggeredRef.current = true;
        onLongPress(e);
      }, delay);
    },
    [delay, onLongPress]
  );

  const move = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!startPosRef.current) return;
      const point =
        "touches" in e ? e.touches[0] : (e as React.MouseEvent);
      const dx = point.clientX - startPosRef.current.x;
      const dy = point.clientY - startPosRef.current.y;
      if (Math.hypot(dx, dy) > moveTolerance) {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    },
    [moveTolerance]
  );

  const end = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (!triggeredRef.current && onClick) {
        onClick(e);
      }
      startPosRef.current = null;
    },
    [onClick]
  );

  return {
    onMouseDown: start,
    onMouseMove: move,
    onMouseUp: end,
    onMouseLeave: end,
    onTouchStart: start,
    onTouchMove: move,
    onTouchEnd: end,
    onContextMenu: (e: React.MouseEvent) => {
      // Right-click also opens the menu on desktop
      e.preventDefault();
      onLongPress(e);
    },
  };
}