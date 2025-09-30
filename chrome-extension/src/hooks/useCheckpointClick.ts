import { useCallback } from "react";
import useTtsSetup from "./useTtsSetup";
import useDeepDiveNavigation from "./useDeepDiveNavigation";

export interface UseCheckpointClickOptions {
  onLoadingChange?: (elementId: string | null) => void;
}

export default function useCheckpointClick({
  onLoadingChange,
}: UseCheckpointClickOptions = {}) {
  const { setupTts } = useTtsSetup();
  const { navigateToDeepDive } = useDeepDiveNavigation({ onLoadingChange });

  const handleCheckpointClick = useCallback(
    async (checkpoint: any) => {
      await setupTts();
      await navigateToDeepDive(checkpoint);
    },
    [setupTts, navigateToDeepDive]
  );

  return { handleCheckpointClick };
}
