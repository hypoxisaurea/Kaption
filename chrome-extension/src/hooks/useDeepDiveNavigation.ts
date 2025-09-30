import { useCallback } from "react";
import {
  getUserProfileFromStorage,
  requestDeepDiveBatch,
  saveDeepDiveResultToStorage,
} from "services/chromeVideo";
import usePageTransition from "./usePageTransition";

export interface UseDeepDiveNavigationOptions {
  onLoadingChange?: (elementId: string | null) => void;
}

export function useDeepDiveNavigation({
  onLoadingChange,
}: UseDeepDiveNavigationOptions = {}) {
  const { navigateWithCardExpand } = usePageTransition();

  const navigateToDeepDive = useCallback(
    async (checkpoint: any) => {
      const clickedElementId = `checkpoint-${checkpoint.timestamp_seconds}-${checkpoint.trigger_keyword}`;
      onLoadingChange?.(clickedElementId);
      const scrollY = window.scrollY;

      const profile = await getUserProfileFromStorage();
      let deepDiveItem: any | undefined = undefined;

      try {
        if (profile) {
          const batch = await requestDeepDiveBatch(profile, [checkpoint]);
          if (batch?.items && batch.items.length > 0) {
            deepDiveItem = batch.items[0];
            await saveDeepDiveResultToStorage(batch);
          }
        }
      } catch (e) {
        console.warn("[DeepDive] batch failed", e);
      }

      navigateWithCardExpand("/content", {
        from: "content",
        clickedElementId,
        scrollY,
        modalCheckpoint: checkpoint,
        deepDiveItem,
      });

      setTimeout(() => onLoadingChange?.(null), 0);
    },
    [navigateWithCardExpand, onLoadingChange]
  );

  return { navigateToDeepDive };
}

export default useDeepDiveNavigation;
