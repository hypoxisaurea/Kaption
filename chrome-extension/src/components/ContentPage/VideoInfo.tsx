import React, { useCallback, useEffect, useState } from 'react'
import { VideoInfoData, isVideoInfo } from 'types/video';
import sampleAnalysis from 'assets/data/sample_analysis_result.json';

function isExtensionRuntime(): boolean {
    return typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.local;
}

function getDevDummyVideoInfo(): VideoInfoData {
    const title = sampleAnalysis?.video_info?.title || 'Sample Video Title';
    const total = sampleAnalysis?.video_info?.total_duration || 180;
    const url = 'https://www.youtube.com/watch?v=_iQ4DBMXHpk';
    const videoId = new URLSearchParams(new URL(url).search).get('v');
    const thumbnailUrl = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null;
    return {
        url,
        title,
        metaTitle: title,
        metaDescription: null,
        metaKeywords: null,
        thumbnailUrl,
        duration: total,
        currentTime: 0,
        paused: true,
        playbackRate: 1,
        width: 1280,
        height: 720,
    };
}
function VideoInfo() {
    const [videoInfo, setVideoInfo] = useState<null | VideoInfoData>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    

    const loadInfo = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
<<<<<<< HEAD
            if (!chrome?.storage?.local) {
                setVideoInfo(null);
                return;
            }
            const data = await chrome.storage.local.get('currentVideoInfo');
            const next = data.currentVideoInfo as unknown;
            setVideoInfo(isVideoInfo(next) ? next : null);
=======
            if (isExtensionRuntime()) {
                const data = await chrome.storage.local.get('currentVideoInfo');
                const next = data.currentVideoInfo as unknown;
                setVideoInfo(isVideoInfo(next) ? next : null);
            } else {
                // 개발 서버(npm start)에서 더미 정보 사용
                setVideoInfo(getDevDummyVideoInfo());
            }
>>>>>>> 31a7e28 ([STYLE] change content modul design)
        } catch (e) {
            setError('영상 정보를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadInfo();

        if (isExtensionRuntime()) {
            const listener = (changes: Record<string, { oldValue?: unknown; newValue?: unknown }>, areaName: string) => {
                if (areaName !== 'local') return;
                if ('currentVideoInfo' in changes) {
                    const change = changes.currentVideoInfo;
                    const next = change?.newValue as unknown;
                    setVideoInfo(isVideoInfo(next) ? next : null);
                }
            };

<<<<<<< HEAD
        if (chrome?.storage?.onChanged?.addListener) {
            chrome.storage.onChanged.addListener(listener);
        }
        return () => {
            if (chrome?.storage?.onChanged?.removeListener) {
                chrome.storage.onChanged.removeListener(listener);
            }
        };
=======
            chrome.storage.onChanged.addListener(listener);
            return () => {
                chrome.storage.onChanged.removeListener(listener);
            };
        }
        return;
>>>>>>> 31a7e28 ([STYLE] change content modul design)
    }, [loadInfo]);

    return (
        <div className='flex flex-col items-center w-full'>
            <div className='w-full py-4'>
                {loading && (
                    <p className='text-sm text-gray-500'>불러오는 중...</p>
                )}
                {!loading && !error && !videoInfo && (
                    <div className='text-sm text-gray-600'>
                        영상 정보가 없습니다. 확장프로그램 환경 외 실행 시 숨김 처리됩니다.
                    </div>
                )}
                {!loading && !error && videoInfo && (
                    <div className='w-full overflow-hidden rounded-lg border border-gray-200 px-8 flex min-w-0 flex-col md:flex-row items-start gap-4 md:gap-6'>
                        {videoInfo.thumbnailUrl && (
                            <div className='flex justify-center w-full md:w-auto'>
                                <img
                                    src={videoInfo.thumbnailUrl}
                                    alt='thumbnail'
                                    className='shrink h-auto w-full sm:w-48 md:w-56 lg:w-64 max-w-full rounded-md object-cover'
                                />
                            </div>
                        )}
                        <div className='min-w-0 flex-1 space-y-2 text-left'>
                            <div className='text-1.5 font-medium break-words whitespace-normal max-w-full'>{videoInfo.metaTitle}</div>
                            <div className='text-1 text-gray-600 break-all whitespace-normal max-w-full'>{videoInfo.url}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default VideoInfo;