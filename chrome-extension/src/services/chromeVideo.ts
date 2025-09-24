import { VideoInfoData } from "types/video";

const YOUTUBE_URL_PATTERN = "*://*.youtube.com/*";

export async function getActiveYouTubeTab(): Promise<ChromeTab | null> {
  if (!chrome?.tabs) return null;

  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true,
    url: YOUTUBE_URL_PATTERN,
  });

  return tabs?.[0] ?? null;
}

function isHttpOrHttps(url: string | undefined | null): boolean {
  if (!url) return false;
  return /^https?:\/\//i.test(url);
}

export async function extractVideoInfoFromActiveTab(
  tabId: number
): Promise<VideoInfoData | null> {
  if (!chrome?.scripting) return null;

  const results = await chrome.scripting.executeScript({
    target: { tabId, allFrames: false },
    func: () => {
      const toFinite = (n: number) => (Number.isFinite(n) ? n : 0);
      const selectContent = (selector: string) => {
        const el = document.querySelector(selector) as HTMLMetaElement | null;
        return el?.content ?? null;
      };
      const extractYouTubeKeywordsFromScripts = () => {
        try {
          const scripts = Array.from(
            document.querySelectorAll("script:not([src])")
          );

          const re = /ytInitialPlayerResponse\s*=\s*(\{[\s\S]*?\})\s*;?/;

          for (const s of scripts) {
            const text = s.textContent || "";
            if (
              !text ||
              (!text.includes("ytInitialPlayerResponse") &&
                !text.includes('"videoDetails"'))
            )
              continue;
            const m = re.exec(text);
            if (!m) continue;
            const json = m[1];
            let data: any;
            try {
              data = JSON.parse(json);
            } catch {
              continue;
            }
            const kws = data?.videoDetails?.keywords;
            if (Array.isArray(kws) && kws.length) {
              return kws.join(", ");
            }
          }
        } catch {}
        return null as string | null;
      };
      const parseLdVideoObject = () => {
        try {
          const scripts = Array.from(
            document.querySelectorAll('script[type="application/ld+json"]')
          );

          for (const s of scripts) {
            const text = s.textContent || "";
            if (!text.trim()) continue;
            let data: any;

            try {
              data = JSON.parse(text);
            } catch {
              continue;
            }

            const arr = Array.isArray(data) ? data : [data];

            for (const obj of arr) {
              const typeVal = obj?.["@type"];
              const types = Array.isArray(typeVal) ? typeVal : [typeVal];

              if (types?.includes("VideoObject")) {
                const keywords = Array.isArray(obj?.keywords)
                  ? obj.keywords.join(", ")
                  : (obj?.keywords ?? null);
                return {
                  name: obj?.name ?? null,
                  description: obj?.description ?? null,
                  keywords,
                };
              }
            }
          }
        } catch {}
        return null as null | {
          name: string | null;
          description: string | null;
          keywords: string | null;
        };
      };

      const video = document.querySelector("video");
      const url = window.location.href;
      const ld = parseLdVideoObject();

      const metaTitle =
        selectContent('meta[property="og:title"]') ??
        ld?.name ??
        selectContent('meta[itemprop="name"]') ??
        document.title ??
        selectContent('meta[name="title"]');

      const metaDescription =
        selectContent('meta[property="og:description"]') ??
        ld?.description ??
        selectContent('meta[itemprop="description"]') ??
        selectContent('meta[name="description"]');

      const ogVideoTags =
        Array.from(
          document.querySelectorAll(
            'meta[property="video:tag"], meta[property="og:video:tag"]'
          )
        )
          .map((m) => (m as HTMLMetaElement).content)
          .filter(Boolean)
          .join(", ") || null;
      const ytScriptKeywords = extractYouTubeKeywordsFromScripts();
      const metaKeywords =
        ld?.keywords ??
        ogVideoTags ??
        selectContent('meta[itemprop="keywords"]') ??
        ytScriptKeywords ??
        selectContent('meta[name="keywords"]') ??
        null;

      const videoId = new URLSearchParams(new URL(url).search).get("v");
      const thumbnailUrl = videoId
        ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
        : null;

      if (!video) return null;

      return {
        url,
        title: document.title,
        metaTitle,
        metaDescription,
        metaKeywords,
        thumbnailUrl,
        duration: toFinite((video as HTMLVideoElement).duration),
        currentTime: toFinite((video as HTMLVideoElement).currentTime),
        paused: !!(video as HTMLVideoElement).paused,
        playbackRate: toFinite((video as HTMLVideoElement).playbackRate) || 1,
        width: toFinite((video as HTMLVideoElement).videoWidth),
        height: toFinite((video as HTMLVideoElement).videoHeight),
      } as VideoInfoData;
    },
  });

  const first = Array.isArray(results) ? results[0] : null;
  return (first?.result as VideoInfoData | null) ?? null;
}

export async function saveVideoInfoToStorage(
  data: VideoInfoData
): Promise<void> {
  await chrome.storage.local.set({ currentVideoInfo: data });
}

export async function fetchAndStoreCurrentVideoInfo(): Promise<VideoInfoData | null> {
  const tab = await getActiveYouTubeTab();
  if (!tab?.id) return null;
  const url = tab.url || "";
  if (!isHttpOrHttps(url)) return null;
  const info = await extractVideoInfoFromActiveTab(tab.id);
  if (!info) return null;
  await saveVideoInfoToStorage(info);
  return info;
}
