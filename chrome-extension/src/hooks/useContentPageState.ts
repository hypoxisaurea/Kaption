import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  pauseYouTubeVideo,
  playYouTubeVideo,
  getVideoPlaybackState,
  clearVideoPlaybackState,
  saveVideoAnalysisToHistory,
  getVideoInfoFromStorage,
} from "services/chromeVideo";
import useAnalysisData from "./useAnalysisData";

export interface UseContentPageStateResult {
  loadingCardId: string | null;
  setLoadingCardId: (id: string | null) => void;
  wasVideoPlaying: boolean;
  setWasVideoPlaying: (playing: boolean) => void;
  restoreScrollPosition: () => void;
}

export function useContentPageState(): UseContentPageStateResult {
  const location = useLocation();
  const { analysisData, loading, error } = useAnalysisData();
  const [loadingCardId, setLoadingCardId] = useState<string | null>(null);
  const [wasVideoPlaying, setWasVideoPlaying] = useState<boolean>(false);

  // Restore scroll position when returning from deepdive
  const restoreScrollPosition = () => {
    const navState =
      (window.history.state && (window.history.state as any).usr) || undefined;
    if (navState && navState.from === "deepdive" && navState.clickedElementId) {
      const target = document.getElementById(navState.clickedElementId);
      if (target) {
        target.scrollIntoView({ behavior: "auto", block: "center" });
        target.classList.add("module-highlight");
        setTimeout(() => target.classList.remove("module-highlight"), 800);
      } else if (typeof navState.scrollY === "number") {
        window.scrollTo({ top: navState.scrollY, behavior: "auto" });
      }
    }
  };

  // Restore video playback state
  useEffect(() => {
    const restoreVideoPlayback = async () => {
      try {
        const wasPlaying = await getVideoPlaybackState();
        if (wasPlaying) {
          await playYouTubeVideo();
          await clearVideoPlaybackState();
        }
      } catch (error) {
        console.error("Failed to restore YouTube video playback:", error);
      }
    };

    restoreVideoPlayback();
  }, []);

  // Save analysis to history when data loads
  useEffect(() => {
    const saveAnalysisToHistory = async () => {
      if (analysisData && !loading && !error) {
        try {
          const videoInfo = await getVideoInfoFromStorage();
          if (videoInfo) {
            await saveVideoAnalysisToHistory(videoInfo, analysisData);
          }
        } catch (error) {
          console.error("Failed to save analysis to history:", error);
        }
      }
    };

    saveAnalysisToHistory();
  }, [analysisData, loading, error]);

  return {
    loadingCardId,
    setLoadingCardId,
    wasVideoPlaying,
    setWasVideoPlaying,
    restoreScrollPosition,
  };
}

export default useContentPageState;
