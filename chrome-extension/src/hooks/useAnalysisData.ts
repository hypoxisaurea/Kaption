import { useEffect, useState } from "react";
import {
  AnalyzeResponse,
  getAnalysisResultFromStorage,
} from "services/chromeVideo";
import sampleAnalysis from "assets/data/sample_analysis_result.json";

export interface UseAnalysisDataResult {
  analysisData: AnalyzeResponse | null;
  loading: boolean;
  error: string | null;
}

export default function useAnalysisData(): UseAnalysisDataResult {
  const [analysisData, setAnalysisData] = useState<AnalyzeResponse | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const saved = await getAnalysisResultFromStorage();
        if (!cancelled) {
          if (saved) setAnalysisData(saved as AnalyzeResponse);
          else setAnalysisData(sampleAnalysis as AnalyzeResponse);
        }
      } catch (e) {
        if (!cancelled) {
          setError("Failed to load analysis data. Please try again.");
          setAnalysisData(sampleAnalysis as AnalyzeResponse);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { analysisData, loading, error };
}
