import { VideoInfoData } from "types";
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

      // XPATH를 사용하여 깔끔한 YouTube 제목 추출
      const getYouTubeTitle = () => {
        try {
          // YouTube의 제목 요소를 XPATH로 찾기
          const titleElement = document.evaluate(
            "/html/body/ytd-app/div[1]/ytd-page-manager/ytd-watch-flexy/div[5]/div[1]/div/div[2]/ytd-watch-metadata/div/div[1]/h1/yt-formatted-string",
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          ).singleNodeValue as HTMLElement | null;

          if (titleElement) {
            return titleElement.textContent?.trim() || null;
          }

          // 대안: 다른 가능한 제목 선택자들
          const alternativeSelectors = [
            "h1.ytd-video-primary-info-renderer yt-formatted-string",
            "h1.ytd-video-primary-info-renderer",
            "yt-formatted-string#text",
            ".ytd-video-primary-info-renderer h1",
            'h1[class*="title"]',
          ];

          for (const selector of alternativeSelectors) {
            const element = document.querySelector(
              selector
            ) as HTMLElement | null;
            if (element?.textContent?.trim()) {
              return element.textContent.trim();
            }
          }
        } catch (e) {
          console.warn("Failed to extract YouTube title via XPATH:", e);
        }
        return null;
      };

      const cleanTitle = getYouTubeTitle();
      const metaTitle =
        cleanTitle ??
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
        title: cleanTitle || document.title,
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

export async function getVideoInfoFromStorage(): Promise<VideoInfoData | null> {
  if (chrome?.storage?.local) {
    const result = await chrome.storage.local.get(["currentVideoInfo"]);
    return (result.currentVideoInfo as VideoInfoData) || null;
  }

  try {
    const raw = localStorage.getItem("currentVideoInfo");
    return raw ? (JSON.parse(raw) as VideoInfoData) : null;
  } catch {
    return null;
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

// ===== Lightweight playback polling =====
export type PlaybackState = Pick<
  VideoInfoData,
  "currentTime" | "paused" | "playbackRate" | "duration"
>;

/**
 * YouTube 플레이어의 현재 재생 상태를 가볍게 가져옵니다.
 * - chrome.scripting.executeScript 로 활성 YouTube 탭의 <video> 상태만 읽어옴
 */
export async function getCurrentPlaybackState(): Promise<PlaybackState | null> {
  const tab = await getActiveYouTubeTab();
  if (!tab?.id) return null;
  const url = tab.url || "";
  if (!isHttpOrHttps(url)) return null;
  if (!chrome?.scripting) return null;

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id, allFrames: false },
    func: () => {
      const toFinite = (n: number) => (Number.isFinite(n) ? n : 0);
      const video = document.querySelector("video") as HTMLVideoElement | null;
      if (!video) return null;
      return {
        currentTime: toFinite(video.currentTime),
        paused: !!video.paused,
        playbackRate: toFinite(video.playbackRate) || 1,
        duration: toFinite(video.duration),
      };
    },
  });

  const first = Array.isArray(results) ? results[0] : null;
  return (first?.result as PlaybackState | null) ?? null;
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

// ===== YouTube Playback Control =====
/**
 * YouTube 영상을 일시정지합니다.
 */
export async function pauseYouTubeVideo(): Promise<boolean> {
  const tab = await getActiveYouTubeTab();
  if (!tab?.id) return false;
  if (!chrome?.scripting) return false;

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: false },
      func: () => {
        const video = document.querySelector(
          "video"
        ) as HTMLVideoElement | null;
        if (!video) return false;
        video.pause();
        return true;
      },
    });

    const first = Array.isArray(results) ? results[0] : null;
    return (first?.result as boolean) ?? false;
  } catch (error) {
    console.error("Failed to pause YouTube video:", error);
    return false;
  }
}

/**
 * YouTube 영상을 재생합니다.
 */
export async function playYouTubeVideo(): Promise<boolean> {
  const tab = await getActiveYouTubeTab();
  if (!tab?.id) return false;
  if (!chrome?.scripting) return false;

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: false },
      func: () => {
        const video = document.querySelector(
          "video"
        ) as HTMLVideoElement | null;
        if (!video) return false;
        video.play();
        return true;
      },
    });

    const first = Array.isArray(results) ? results[0] : null;
    return (first?.result as boolean) ?? false;
  } catch (error) {
    console.error("Failed to play YouTube video:", error);
    return false;
  }
}

// ===== Video Analysis History Storage =====
export type VideoAnalysisHistory = {
  videoId: string;
  videoInfo: VideoInfoData;
  analysisResult: AnalyzeResponse;
  deepDiveResult?: DeepDiveBatchResponse;
  createdAt: string;
  updatedAt: string;
};

/**
 * 영상별 분석 결과를 저장합니다.
 */
export async function saveVideoAnalysisToHistory(
  videoInfo: VideoInfoData,
  analysisResult: AnalyzeResponse,
  deepDiveResult?: DeepDiveBatchResponse
): Promise<void> {
  const videoId =
    new URLSearchParams(new URL(videoInfo.url).search).get("v") ||
    videoInfo.url;
  const now = new Date().toISOString();

  const historyItem: VideoAnalysisHistory = {
    videoId,
    videoInfo,
    analysisResult,
    deepDiveResult,
    createdAt: now,
    updatedAt: now,
  };

  if (chrome?.storage?.local) {
    const key = `videoAnalysis_${videoId}`;
    await chrome.storage.local.set({ [key]: historyItem });

    // 전체 목록도 업데이트
    const existing = await chrome.storage.local.get(["videoAnalysisList"]);
    const list = existing.videoAnalysisList || [];
    const existingIndex = list.findIndex(
      (item: VideoAnalysisHistory) => item.videoId === videoId
    );

    if (existingIndex >= 0) {
      list[existingIndex] = historyItem;
    } else {
      list.unshift(historyItem); // 최신 항목을 맨 앞에 추가
    }

    await chrome.storage.local.set({ videoAnalysisList: list });
  } else {
    try {
      const key = `videoAnalysis_${videoId}`;
      localStorage.setItem(key, JSON.stringify(historyItem));

      // 전체 목록도 업데이트
      const existing = localStorage.getItem("videoAnalysisList");
      const list = existing ? JSON.parse(existing) : [];
      const existingIndex = list.findIndex(
        (item: VideoAnalysisHistory) => item.videoId === videoId
      );

      if (existingIndex >= 0) {
        list[existingIndex] = historyItem;
      } else {
        list.unshift(historyItem);
      }

      localStorage.setItem("videoAnalysisList", JSON.stringify(list));
    } catch {}
  }
}

/**
 * 저장된 모든 영상 분석 결과를 가져옵니다.
 */
export async function getAllVideoAnalysisHistory(): Promise<
  VideoAnalysisHistory[]
> {
  if (chrome?.storage?.local) {
    const result = await chrome.storage.local.get(["videoAnalysisList"]);
    return (result.videoAnalysisList as VideoAnalysisHistory[]) || [];
  }

  try {
    const raw = localStorage.getItem("videoAnalysisList");
    return raw ? (JSON.parse(raw) as VideoAnalysisHistory[]) : [];
  } catch {
    return [];
  }
}

/**
 * 특정 영상의 분석 결과를 가져옵니다.
 */
export async function getVideoAnalysisHistory(
  videoId: string
): Promise<VideoAnalysisHistory | null> {
  if (chrome?.storage?.local) {
    const key = `videoAnalysis_${videoId}`;
    const result = await chrome.storage.local.get([key]);
    return (result[key] as VideoAnalysisHistory) || null;
  }

  try {
    const key = `videoAnalysis_${videoId}`;
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as VideoAnalysisHistory) : null;
  } catch {
    return null;
  }
}

/**
 * 특정 영상의 분석 결과를 삭제합니다.
 */
export async function deleteVideoAnalysisHistory(
  videoId: string
): Promise<void> {
  if (chrome?.storage?.local) {
    const key = `videoAnalysis_${videoId}`;
    await chrome.storage.local.remove([key]);

    // 전체 목록에서도 제거
    const existing = await chrome.storage.local.get(["videoAnalysisList"]);
    const list = (existing.videoAnalysisList as VideoAnalysisHistory[]) || [];
    const filteredList = list.filter((item) => item.videoId !== videoId);
    await chrome.storage.local.set({ videoAnalysisList: filteredList });
  } else {
    try {
      const key = `videoAnalysis_${videoId}`;
      localStorage.removeItem(key);

      // 전체 목록에서도 제거
      const existing = localStorage.getItem("videoAnalysisList");
      const list = existing ? JSON.parse(existing) : [];
      const filteredList = list.filter(
        (item: VideoAnalysisHistory) => item.videoId !== videoId
      );
      localStorage.setItem("videoAnalysisList", JSON.stringify(filteredList));
    } catch {}
  }
}

// ===== Video State Storage =====
/**
 * 영상 재생 상태를 저장합니다.
 */
export async function saveVideoPlaybackState(
  wasPlaying: boolean
): Promise<void> {
  if (chrome?.storage?.local) {
    await chrome.storage.local.set({ wasVideoPlaying: wasPlaying });
  } else {
    try {
      localStorage.setItem("wasVideoPlaying", JSON.stringify(wasPlaying));
    } catch {}
  }
}

/**
 * 저장된 영상 재생 상태를 가져옵니다.
 */
export async function getVideoPlaybackState(): Promise<boolean> {
  if (chrome?.storage?.local) {
    const r = await chrome.storage.local.get(["wasVideoPlaying"]);
    return (r?.wasVideoPlaying as boolean) ?? false;
  }
  try {
    const raw = localStorage.getItem("wasVideoPlaying");
    return raw ? (JSON.parse(raw) as boolean) : false;
  } catch {
    return false;
  }
}

/**
 * 저장된 영상 재생 상태를 삭제합니다.
 */
export async function clearVideoPlaybackState(): Promise<void> {
  if (chrome?.storage?.local) {
    await chrome.storage.local.remove(["wasVideoPlaying"]);
  } else {
    try {
      localStorage.removeItem("wasVideoPlaying");
    } catch {}
  }
}
