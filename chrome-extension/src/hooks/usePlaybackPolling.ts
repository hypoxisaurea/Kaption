import { useState, useEffect, useCallback } from "react";
import { getCurrentPlaybackState } from "services/chromeVideo";
import usePolling from "./usePolling";

export interface UsePlaybackPollingOptions {
  sortedCheckpoints: any[];
  enabled?: boolean;
  onTimeUpdate?: (currentTime: number) => void;
}

export function usePlaybackPolling({
  sortedCheckpoints,
  enabled = true,
  onTimeUpdate,
}: UsePlaybackPollingOptions) {
  const [visibleUntilIndex, setVisibleUntilIndex] = useState<number>(-1);
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(true);

  const findCheckpointIndex = useCallback(
    (currentTime: number): number => {
      let lo = 0;
      let hi = sortedCheckpoints.length - 1;
      let last = -1;

      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (sortedCheckpoints[mid].timestamp_seconds <= currentTime + 0.05) {
          last = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }

      return last;
    },
    [sortedCheckpoints]
  );

  const updateVisibleIndex = useCallback(async () => {
    try {
      const state = await getCurrentPlaybackState();
      if (state && Number.isFinite(state.currentTime)) {
        const currentTime = state.currentTime;
        const newIndex = findCheckpointIndex(currentTime);

        if (newIndex >= 0) {
          setVisibleUntilIndex((prev) => (newIndex > prev ? newIndex : prev));
          onTimeUpdate?.(currentTime);
        }
      }
    } catch (error) {
      console.warn("Playback polling failed:", error);
    }
  }, [findCheckpointIndex, onTimeUpdate]);

  // Initial offset calculation
  useEffect(() => {
    if (!enabled || !sortedCheckpoints.length || visibleUntilIndex >= 0) return;

    (async () => {
      try {
        const state = await getCurrentPlaybackState();
        if (!state) return;

        const newIndex = findCheckpointIndex(state.currentTime);
        if (newIndex >= 0) {
          setVisibleUntilIndex(newIndex);
          window.setTimeout(() => setIsBootstrapping(false), 800);
        } else {
          setIsBootstrapping(false);
        }
      } catch (error) {
        console.warn("Initial playback state failed:", error);
        setIsBootstrapping(false);
      }
    })();
  }, [enabled, sortedCheckpoints, visibleUntilIndex, findCheckpointIndex]);

  useEffect(() => {
    if (isBootstrapping && visibleUntilIndex >= 0) {
      window.setTimeout(() => setIsBootstrapping(false), 400);
    }
  }, [isBootstrapping, visibleUntilIndex]);

  // Polling
  usePolling(updateVisibleIndex, {
    interval: 500,
    enabled: enabled && !isBootstrapping,
  });

  // Reset when disabled
  useEffect(() => {
    if (!enabled) {
      setVisibleUntilIndex(sortedCheckpoints.length - 1);
    }
  }, [enabled, sortedCheckpoints.length]);

  return {
    visibleUntilIndex,
    setVisibleUntilIndex,
    isBootstrapping,
    setIsBootstrapping,
  };
}

export default usePlaybackPolling;
