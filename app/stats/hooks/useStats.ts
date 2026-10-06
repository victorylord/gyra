"use client";

import { useEffect, useRef, useState } from "react";

export function usePolling<T>(url: string, intervalMs = 20_000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchOnce = async () => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        const json = await res.json();
        if (!mountedRef.current) return;
        if (!res.ok) {
          setError(json?.error?.message || "Failed to load");
        } else {
          setData(json);
          setError(null);
        }
      } catch (e: any) {
        if (mountedRef.current) setError(e?.message || "Network error");
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    fetchOnce();
    const id = setInterval(fetchOnce, intervalMs);

    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [url, intervalMs]);

  return { data, error, loading };
}