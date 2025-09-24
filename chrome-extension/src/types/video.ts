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
  if (!val || typeof val !== 'object') return false;
  const v: any = val;
  return (
    typeof v.url === 'string' &&
    typeof v.title === 'string' &&
    typeof v.duration === 'number' &&
    typeof v.currentTime === 'number' &&
    typeof v.paused === 'boolean' &&
    typeof v.playbackRate === 'number' &&
    typeof v.width === 'number' &&
    typeof v.height === 'number'
  );
}


