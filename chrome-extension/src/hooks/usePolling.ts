import { useEffect, useRef } from "react";

export interface UsePollingOptions {
  interval?: number;
  enabled?: boolean;
  immediate?: boolean;
}

export function usePolling(
  callback: () => void | Promise<void>,
  { interval = 1000, enabled = true, immediate = false }: UsePollingOptions = {}
) {
  const callbackRef = useRef(callback);
  const intervalRef = useRef<number | null>(null);
  const destroyedRef = useRef(false);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    destroyedRef.current = false;

    const tick = async () => {
      if (destroyedRef.current) return;
      try {
        await callbackRef.current();
      } catch (error) {
        console.warn("Polling callback failed:", error);
      }
    };

    if (immediate) {
      tick();
    }

    intervalRef.current = window.setInterval(tick, interval);

    return () => {
      destroyedRef.current = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, immediate]);

  return {
    start: () => {
      if (!intervalRef.current && enabled) {
        destroyedRef.current = false;
        intervalRef.current = window.setInterval(async () => {
          if (destroyedRef.current) return;
          try {
            await callbackRef.current();
          } catch (error) {
            console.warn("Polling callback failed:", error);
          }
        }, interval);
      }
    },
    stop: () => {
      destroyedRef.current = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    },
  };
}

export default usePolling;
