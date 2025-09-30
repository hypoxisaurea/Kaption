import { useCallback, useRef } from "react";
import { speakRealtime, prewarmRealtime } from "services/tts";

export interface UseTtsOptions {
  enabled?: boolean;
  debounceMs?: number;
}

export function useTts({
  enabled = true,
  debounceMs = 1200,
}: UseTtsOptions = {}) {
  const lastSpeakRef = useRef<{ text: string; at: number } | null>(null);

  const speak = useCallback(
    async (text?: string) => {
      if (!enabled || !text) return;

      const now = performance.now();
      const last = lastSpeakRef.current;
      if (last && last.text === text && now - last.at < debounceMs) return;

      lastSpeakRef.current = { text, at: now };

      try {
        const ok = await speakRealtime(text);
        if (!ok) {
          await prewarmRealtime();
          await new Promise((r) => setTimeout(r, 150));
          await speakRealtime(text);
        }
      } catch (error) {
        console.warn("TTS speak failed:", error);
      }
    },
    [enabled, debounceMs]
  );

  return { speak };
}

export default useTts;
