import { VideoInfoData } from "types/video"; // 'types/video' 경로에 VideoInfoData 타입이 정의되어 있다고 가정합니다.
/** Analyze API response shape (subset we care about) */
export type AnalyzeResponse = {
  video_info: {
    title: string;
    total_duration: number;
  };
  checkpoints: Array<{
    timestamp_seconds: number;
    timestamp_formatted: string;
    trigger_keyword: string;
    segment_stt: string;
    scene_description: string;
    context_title: string;
    explanation: {
      summary: string;
      main: string;
      tip: string;
    };
    related_interests?: string[];
  }>;
  analysis_id: string;
  status: string;
  error?: string | null;
};

// Chrome 탭의 기본적인 정보 타입을 정의합니다. (필요하다면 더 구체적으로 정의할 수 있습니다)
type ChromeTab = {
  id?: number;
  url?: string;
  // ... 기타 필요한 탭 속성들
};

const YOUTUBE_URL_PATTERN = [
  "*://*.youtube.com/*",
  "*://youtube.com/*",
  "*://*.youtu.be/*",
  "*://youtu.be/*",
];

export async function getActiveYouTubeTab(): Promise<ChromeTab | null> {
  if (!chrome?.tabs) return null;

  // chrome.tabs.query 의 url 필드는 string | string[] 모두 허용
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true,
    url: YOUTUBE_URL_PATTERN as unknown as string | string[],
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
  if (chrome?.storage?.local) {
    await chrome.storage.local.set({ currentVideoInfo: data });
  } else {
    try {
      localStorage.setItem("currentVideoInfo", JSON.stringify(data));
    } catch {}
  }
}

export async function saveAnalysisResultToStorage(
  result: AnalyzeResponse
): Promise<void> {
  if (chrome?.storage?.local) {
    await chrome.storage.local.set({ lastAnalysisResult: result });
  } else {
    try {
      localStorage.setItem("lastAnalysisResult", JSON.stringify(result));
    } catch {}
  }
}

// 이 함수가 추가되었습니다.
export async function getAnalysisResultFromStorage(): Promise<AnalyzeResponse | null> {
  if (chrome?.storage?.local) {
    const r = await chrome.storage.local.get(["lastAnalysisResult"]);
    return (r?.lastAnalysisResult as AnalyzeResponse | undefined) ?? null;
  }
  try {
    const raw = localStorage.getItem("lastAnalysisResult");
    return raw ? (JSON.parse(raw) as AnalyzeResponse) : null;
  } catch {
    return null;
  }
}

export type UserProfilePayload = {
  familiarity: number; // 1-5
  language_level: "Beginner" | "Intermediate" | "Advanced";
  interests: string[];
};

const API_BASE = "http://localhost:8000";

export async function analyzeCurrentVideo(
  url: string,
  profile: UserProfilePayload
): Promise<AnalyzeResponse> {
  const endpoint = `${API_BASE}/api/analyze`;
  console.groupCollapsed("[Analyze] Request");
  console.log("POST", endpoint);
  console.log("youtube_url", url);
  console.log("user_profile", profile);
  console.groupEnd();

  const resp = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      youtube_url: url,
      user_profile: profile,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error("[Analyze] Failed", { status: resp.status, body: text });
    throw new Error(`Analyze API failed: ${resp.status} ${text}`);
  }
  const data = (await resp.json()) as AnalyzeResponse;
  console.groupCollapsed("[Analyze] Response");
  console.log("analysis_id", data?.analysis_id);
  console.log("status", data?.status);
  console.log("video_info", data?.video_info);
  console.log(
    "checkpoints_count",
    Array.isArray(data?.checkpoints) ? data.checkpoints.length : 0
  );
  console.groupEnd();
  return data;
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

// ===== User Profile Storage =====
export async function saveUserProfileToStorage(
  profile: UserProfilePayload
): Promise<void> {
  if (chrome?.storage?.local) {
    await chrome.storage.local.set({ userProfile: profile });
  } else {
    try {
      localStorage.setItem("userProfile", JSON.stringify(profile));
    } catch {}
  }
}

export async function getUserProfileFromStorage(): Promise<UserProfilePayload | null> {
  if (chrome?.storage?.local) {
    const r = await chrome.storage.local.get(["userProfile"]);
    return (r?.userProfile as UserProfilePayload | undefined) ?? null;
  }
  try {
    const raw = localStorage.getItem("userProfile");
    return raw ? (JSON.parse(raw) as UserProfilePayload) : null;
  } catch {
    return null;
  }
}

// ===== DeepDive Batch API =====
export type DeepDiveBatchResponse = {
  items: any[]; // Backend typed; UI consumes specific fields per item
};

export async function requestDeepDiveBatch(
  profile: UserProfilePayload,
  checkpoints: AnalyzeResponse["checkpoints"]
): Promise<DeepDiveBatchResponse> {
  const endpoint = `${API_BASE}/api/deepdive/batch`;
  const resp = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_profile: profile, checkpoints }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`DeepDive batch failed: ${resp.status} ${text}`);
  }
  return (await resp.json()) as DeepDiveBatchResponse;
}

export async function saveDeepDiveResultToStorage(
  result: DeepDiveBatchResponse
): Promise<void> {
  if (chrome?.storage?.local) {
    await chrome.storage.local.set({ lastDeepDiveResult: result });
  } else {
    try {
      localStorage.setItem("lastDeepDiveResult", JSON.stringify(result));
    } catch {}
  }
}
