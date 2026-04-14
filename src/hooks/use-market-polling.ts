"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface PollingResult<T> {
  data: T | null;
  isLoading: boolean;
  lastUpdated: Date | null;
}

/**
 * Polls a server action at a regular interval.
 * Pauses when the tab is hidden (Page Visibility API).
 */
export function useMarketPolling<T>(
  fetcher: () => Promise<T>,
  intervalMs: number = 5000
): PollingResult<T> & { refresh: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const poll = useCallback(async () => {
    if (document.hidden) return;
    setIsLoading(true);
    try {
      const result = await fetcherRef.current();
      setData(result);
      setLastUpdated(new Date());
    } catch {
      // Silently fail polling
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    poll();

    intervalRef.current = setInterval(poll, intervalMs);

    const handleVisibility = () => {
      if (!document.hidden) {
        // Tab became visible, fetch immediately
        poll();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [poll, intervalMs]);

  return { data, isLoading, lastUpdated, refresh: poll };
}
