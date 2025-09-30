// Video related types
export type VideoInfoData = {
  url: string;
  title: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  thumbnailUrl?: string | null;
  duration: number;
  currentTime: number;
  paused: boolean;
  playbackRate: number;
  width: number;
  height: number;
};

export function isVideoInfo(val: unknown): val is VideoInfoData {
  if (!val || typeof val !== "object") return false;
  const v: any = val;
  return (
    typeof v.url === "string" &&
    typeof v.title === "string" &&
    typeof v.duration === "number" &&
    typeof v.currentTime === "number" &&
    typeof v.paused === "boolean" &&
    typeof v.playbackRate === "number" &&
    typeof v.width === "number" &&
    typeof v.height === "number"
  );
}

// Chrome extension types
declare const chrome: any;

export interface ChromeTab {
  id?: number;
  url?: string | null;
}

// Component types
export interface Explanation {
  summary: string;
  main: string;
  tip: string;
}

export interface Checkpoint {
  timestamp_seconds: number;
  timestamp_formatted: string;
  trigger_keyword: string;
  segment_stt: string;
  scene_description: string;
  context_title: string;
  explanation: Explanation;
  related_interests?: string[];
}

// TTS types
export type TtsMode = "realtime" | "native";
export type TtsEventName = "tts.start" | "tts.delta" | "tts.end";
export type TtsEventHandler = (payload?: any) => void;
