import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { prewarmRealtime, setTtsStyle } from "services/tts";
import {
  getUserProfileFromStorage,
  requestDeepDiveBatch,
  saveDeepDiveResultToStorage,
} from "services/chromeVideo";
import usePageTransition from "hooks/usePageTransition";

export interface UseCheckpointClickOptions {
  onLoadingChange?: (elementId: string | null) => void;
}

export default function useCheckpointClick({
  onLoadingChange,
}: UseCheckpointClickOptions = {}) {
  const navigate = useNavigate();
  const { navigateWithCardExpand } = usePageTransition();

  const handleCheckpointClick = useCallback(
    async (checkpoint: any) => {
      try {
        setTtsStyle({
          voice: "sage",
          instructions:
            "You are Taki, a cheerful female bunny tutor mascot. Speak English only. Keep it friendly, energetic, and playful. Use short sentences (7–12 words) and a slightly higher pitch. Stay natural and not overly cutesy. Keep pace comfortable. Sound like you are talking to a friend while teaching.",
        });
        prewarmRealtime();
      } catch {}

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

  return { handleCheckpointClick };
}
