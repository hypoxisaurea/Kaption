import { useMemo } from "react";
import { AnalyzeResponse } from "services/chromeVideo";

export interface UseCheckpointSortingOptions {
  analysisData: AnalyzeResponse | null;
}

export function useCheckpointSorting({
  analysisData,
}: UseCheckpointSortingOptions) {
  const sortedCheckpoints = useMemo(() => {
    const cps = analysisData?.checkpoints ?? [];
    return [...cps].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds);
  }, [analysisData?.checkpoints]);

  return { sortedCheckpoints };
}

export default useCheckpointSorting;
