import { useEffect } from "react";
import { onTts } from "services/tts";
import useTts from "./useTts";

export interface UseDeepDiveTtsOptions {
  stage: string;
  text?: string;
  onTtsEnd?: () => void;
}

export function useDeepDiveTts({
  stage,
  text,
  onTtsEnd,
}: UseDeepDiveTtsOptions) {
  const { speak } = useTts({ enabled: true });

  useEffect(() => {
    if (!text || stage !== "recap") return;

    let moved = false;
    const off = onTts("tts.end", () => {
      if (!moved) {
        moved = true;
        onTtsEnd?.();
      }
    });

    const trimmedText = text.trim();
    if (trimmedText) {
      speak(trimmedText);
    }

    return () => {
      if (off) off();
    };
  }, [stage, text, speak, onTtsEnd]);

  return { speak };
}

export default useDeepDiveTts;
