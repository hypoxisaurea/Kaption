import { useCallback } from "react";
import { prewarmRealtime, setTtsStyle } from "services/tts";

export interface UseTtsSetupOptions {
  voice?: string;
  instructions?: string;
}

export function useTtsSetup({
  voice = "sage",
  instructions = "You are Taki, a cheerful female bunny tutor mascot. Speak English only. Keep it friendly, energetic, and playful. Use short sentences (7–12 words) and a slightly higher pitch. Stay natural and not overly cutesy. Keep pace comfortable. Sound like you are talking to a friend while teaching.",
}: UseTtsSetupOptions = {}) {
  const setupTts = useCallback(async () => {
    try {
      setTtsStyle({ voice, instructions });
      await prewarmRealtime();
    } catch (error) {
      console.warn("TTS setup failed:", error);
    }
  }, [voice, instructions]);

  return { setupTts };
}

export default useTtsSetup;
