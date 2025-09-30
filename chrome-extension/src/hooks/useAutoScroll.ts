import { useEffect, useRef } from "react";
import useScrollToElement from "./useScrollToElement";

export interface UseAutoScrollOptions {
  visibleUntilIndex: number;
  sortedCheckpoints: any[];
  enabled?: boolean;
  prevVisibleIndex?: number;
}

export function useAutoScroll({
  visibleUntilIndex,
  sortedCheckpoints,
  enabled = true,
  prevVisibleIndex = -1,
}: UseAutoScrollOptions) {
  const prevVisibleIndexRef = useRef<number>(prevVisibleIndex);
  const { scrollToElement } = useScrollToElement({
    behavior: "smooth",
    block: "nearest",
    delay: 50,
  });

  useEffect(() => {
    if (!enabled) return;

    const prev = prevVisibleIndexRef.current;
    if (visibleUntilIndex <= prev) return;

    prevVisibleIndexRef.current = visibleUntilIndex;
    const last = sortedCheckpoints[visibleUntilIndex];
    if (!last) return;

    const elId = `checkpoint-${last.timestamp_seconds}-${last.trigger_keyword}`;
    scrollToElement(elId);
  }, [visibleUntilIndex, enabled, sortedCheckpoints, scrollToElement]);

  return {
    prevVisibleIndex: prevVisibleIndexRef.current,
  };
}

export default useAutoScroll;
