import { useEffect, useMemo, useRef, useState } from "react";
import { AnalyzeResponse, getCurrentPlaybackState } from "services/chromeVideo";

export interface UseProgressiveCheckpointsOptions {
  analysisData: AnalyzeResponse | null;
  enabled?: boolean;
}

export interface UseProgressiveCheckpointsResult {
  sortedCheckpoints: any[];
  visibleUntilIndex: number;
  isBootstrapping: boolean;
  setEnabledProgressive: (v: boolean) => void;
  isProgressiveMode: boolean;
}

export default function useProgressiveCheckpoints({
  analysisData,
  enabled = true,
}: UseProgressiveCheckpointsOptions): UseProgressiveCheckpointsResult {
  const [isProgressiveMode, setIsProgressiveMode] = useState<boolean>(enabled);
  const [visibleUntilIndex, setVisibleUntilIndex] = useState<number>(-1);
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(true);
  const prevVisibleIndexRef = useRef<number>(-1);

  const sortedCheckpoints = useMemo(() => {
    const cps = analysisData?.checkpoints ?? [];
    return [...cps].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds);
  }, [analysisData?.checkpoints]);

  // 초기 오프셋 계산
  useEffect(() => {
    if (!isProgressiveMode) return;
    if (!sortedCheckpoints.length) return;
    if (visibleUntilIndex >= 0) return;

    (async () => {
      try {
        const state = await getCurrentPlaybackState();
        if (!state) return;
        const t = state.currentTime;
        let lo = 0;
        let hi = sortedCheckpoints.length - 1;
        let last = -1;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          if (sortedCheckpoints[mid].timestamp_seconds <= t + 0.05) {
            last = mid;
            lo = mid + 1;
          } else {
            hi = mid - 1;
          }
        }
        if (last >= 0) {
          setVisibleUntilIndex(last);
          window.setTimeout(() => setIsBootstrapping(false), 800);
        } else {
          setIsBootstrapping(false);
        }
      } catch {}
    })();
  }, [isProgressiveMode, sortedCheckpoints, visibleUntilIndex]);

  useEffect(() => {
    if (isBootstrapping && visibleUntilIndex >= 0) {
      window.setTimeout(() => setIsBootstrapping(false), 400);
    }
  }, [isBootstrapping, visibleUntilIndex]);

  // 폴링
  useEffect(() => {
    if (!analysisData || !sortedCheckpoints.length) return;
    if (!isProgressiveMode) {
      setVisibleUntilIndex(sortedCheckpoints.length - 1);
      return;
    }
    let timerId: number | null = null;
    let destroyed = false;
    const tick = async () => {
      if (destroyed) return;
      try {
        const state = await getCurrentPlaybackState();
        if (state && Number.isFinite(state.currentTime)) {
          const t = state.currentTime;
          let lo = 0,
            hi = sortedCheckpoints.length - 1,
            last = -1;
          while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (sortedCheckpoints[mid].timestamp_seconds <= t + 0.05) {
              last = mid;
              lo = mid + 1;
            } else {
              hi = mid - 1;
            }
          }
          if (last >= 0)
            setVisibleUntilIndex((prev) => (last > prev ? last : prev));
        }
      } catch {
      } finally {
        if (!destroyed) timerId = window.setTimeout(tick, 500);
      }
    };
    tick();
    return () => {
      destroyed = true;
      if (timerId) window.clearTimeout(timerId);
    };
  }, [analysisData, sortedCheckpoints, isProgressiveMode]);

  // 외부 토글용
  const setEnabledProgressive = (v: boolean) => setIsProgressiveMode(v);

  // 자동 스크롤 (새 카드 등장 시)
  useEffect(() => {
    if (!isProgressiveMode) return;
    const prev = prevVisibleIndexRef.current;
    if (visibleUntilIndex <= prev) return;
    prevVisibleIndexRef.current = visibleUntilIndex;
    const last = sortedCheckpoints[visibleUntilIndex];
    if (!last) return;
    const elId = `checkpoint-${last.timestamp_seconds}-${last.trigger_keyword}`;
    const id = window.setTimeout(() => {
      const el = document.getElementById(elId);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 50);
    return () => window.clearTimeout(id);
  }, [visibleUntilIndex, isProgressiveMode, sortedCheckpoints]);

  return {
    sortedCheckpoints,
    visibleUntilIndex,
    isBootstrapping,
    setEnabledProgressive,
    isProgressiveMode,
  };
}
