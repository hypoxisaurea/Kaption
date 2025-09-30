import { useEffect, useState, useCallback } from "react";
import {
  VideoAnalysisHistory,
  getAllVideoAnalysisHistory,
  deleteVideoAnalysisHistory,
} from "services/chromeVideo";

export interface UseVideoAnalysisHistoryResult {
  analysisHistory: VideoAnalysisHistory[];
  selectedVideo: VideoAnalysisHistory | null;
  loading: boolean;
  error: string | null;
  loadAnalysisHistory: () => Promise<void>;
  handleVideoSelect: (video: VideoAnalysisHistory) => void;
  handleVideoDelete: (videoId: string) => Promise<void>;
  formatDate: (dateString: string) => string;
}

export function useVideoAnalysisHistory(): UseVideoAnalysisHistoryResult {
  const [analysisHistory, setAnalysisHistory] = useState<
    VideoAnalysisHistory[]
  >([]);
  const [selectedVideo, setSelectedVideo] =
    useState<VideoAnalysisHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalysisHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const history = await getAllVideoAnalysisHistory();
      setAnalysisHistory(history);
    } catch (e) {
      setError("분석 기록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleVideoSelect = useCallback((video: VideoAnalysisHistory) => {
    setSelectedVideo(video);
  }, []);

  const handleVideoDelete = useCallback(
    async (videoId: string) => {
      try {
        await deleteVideoAnalysisHistory(videoId);
        setAnalysisHistory((prev) =>
          prev.filter((video) => video.videoId !== videoId)
        );
        if (selectedVideo?.videoId === videoId) {
          setSelectedVideo(null);
        }
      } catch (e) {
        setError("분석 기록을 삭제하는데 실패했습니다.");
      }
    },
    [selectedVideo]
  );

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  useEffect(() => {
    loadAnalysisHistory();
  }, [loadAnalysisHistory]);

  return {
    analysisHistory,
    selectedVideo,
    loading,
    error,
    loadAnalysisHistory,
    handleVideoSelect,
    handleVideoDelete,
    formatDate,
  };
}

export default useVideoAnalysisHistory;
