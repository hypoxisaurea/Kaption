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
            if (!chrome?.storage?.local) {
                setVideoInfo(null);
                return;
            }
            const data = await chrome.storage.local.get('currentVideoInfo');
            const next = data.currentVideoInfo as unknown;
            setVideoInfo(isVideoInfo(next) ? next : null);
        } catch (e) {
            setError('Error occurred while loading video information.');
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

            if (chrome?.storage?.onChanged?.addListener) {
                chrome.storage.onChanged.addListener(listener);
            }
            
            return () => {
                if (chrome?.storage?.onChanged?.removeListener) {
                    chrome.storage.onChanged.removeListener(listener);
                }
            };
        }
    }, [loadInfo]);

    return (
        <div className='flex flex-col items-center w-full'>
            <div className='w-full'>
                {loading && (
                    <p className='text-sm text-gray-500'>Loading...</p>
                )}
                {!loading && !error && !videoInfo && (
                    <div className='text-center justify-center items-center text-[0.7rem] text-[#cccccc]'>
                        There is no video information. <br/> It is hidden when executed outside the extension environment.
                    </div>
                )}
                {!loading && !error && videoInfo && (
                    <div className='w-full overflow-hidden flex min-w-0 flex-col md:flex-row items-start gap-4 md:gap-6'>
                        {videoInfo.thumbnailUrl && (
                            <div className='flex justify-center w-full md:w-auto'>
                                <img
                                    src={videoInfo.thumbnailUrl}
                                    alt='thumbnail'
                                    className='shrink h-auto w-full sm:w-48 md:w-56 lg:w-64 max-w-full object-cover'
                                />
                            </div>
                        )}
                        <div className='min-w-0 flex-1 space-y-2 text-left bg-white rounded-[2vw] px-[5vw] py-[2vh]'>
                            <div className='text-[4vw] text-[#1b1b1b] font-bold break-words whitespace-normal max-w-full'>{videoInfo.title}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default VideoInfo;