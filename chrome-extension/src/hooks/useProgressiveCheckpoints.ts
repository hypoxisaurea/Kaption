import { useState } from "react";
import { AnalyzeResponse } from "services/chromeVideo";
import useCheckpointSorting from "./useCheckpointSorting";
import usePlaybackPolling from "./usePlaybackPolling";
import useAutoScroll from "./useAutoScroll";

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

  // Checkpoint sorting
  const { sortedCheckpoints } = useCheckpointSorting({ analysisData });

  // Playback polling
  const {
    visibleUntilIndex,
    setVisibleUntilIndex,
    isBootstrapping,
    setIsBootstrapping,
  } = usePlaybackPolling({
    sortedCheckpoints,
    enabled: isProgressiveMode,
  });

  // Auto scroll
  useAutoScroll({
    visibleUntilIndex,
    sortedCheckpoints,
    enabled: isProgressiveMode,
  });

  // External toggle
  const setEnabledProgressive = (v: boolean) => setIsProgressiveMode(v);

  return {
    sortedCheckpoints,
    visibleUntilIndex,
    isBootstrapping,
    setEnabledProgressive,
    isProgressiveMode,
  };
}
