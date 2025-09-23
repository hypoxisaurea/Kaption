import React, { useCallback, useEffect, useState } from 'react'

type VideoInfoData = {
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

const isVideoInfo = (val: unknown): val is VideoInfoData => {
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
};


function VideoInfo() {
    const [videoInfo, setVideoInfo] = useState<null | VideoInfoData>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    

    const loadInfo = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await chrome.storage.local.get('currentVideoInfo');
            const next = data.currentVideoInfo as unknown;
            setVideoInfo(isVideoInfo(next) ? next : null);
        } catch (e) {
            setError('영상 정보를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadInfo();

        const listener = (changes: Record<string, { oldValue?: unknown; newValue?: unknown }>, areaName: string) => {
            if (areaName !== 'local') return;
            if ('currentVideoInfo' in changes) {
                const change = changes.currentVideoInfo;
                const next = change?.newValue as unknown;
                setVideoInfo(isVideoInfo(next) ? next : null);
            }
        };

        chrome.storage.onChanged.addListener(listener);
        return () => {
            chrome.storage.onChanged.removeListener(listener);
        };
    }, [loadInfo]);

    return (
        <div className='flex flex-col items-center justify-center overflow-hidden'>
            <div className='w-full flex-1 px-10 py-4'>
                {loading && (
                    <p className='text-sm text-gray-500'>불러오는 중...</p>
                )}
                {!loading && error && (
                    <p className='text-sm text-red-500'>{error}</p>
                )}
                {!loading && !error && !videoInfo && (
                    <div className='text-sm text-gray-600'>
                        영상 정보가 없습니다. 재생 중인 탭에서 Play를 눌러 주세요.
                    </div>
                )}
                {!loading && !error && videoInfo && (
                    <div className='w-full overflow-hidden rounded-lg border border-gray-200 p-4'>
                        <div className='flex items-start gap-4'>
                            {videoInfo.thumbnailUrl && (
                                <img
                                    src={videoInfo.thumbnailUrl}
                                    alt='thumbnail'
                                    className='shrink-0 h-auto w-40 sm:w-48 md:w-56 lg:w-64 rounded-md'
                                />
                            )}
                            <div className='min-w-0 flex-1 space-y-2 text-left'>
                                <div className='text-lg font-medium'>{videoInfo.metaTitle}</div>
                                <div className='break-all text-sm text-gray-600'>{videoInfo.url}</div>
                                {videoInfo.metaDescription && (
                                    <div className='whitespace-pre-line line-clamp-5 text-sm text-gray-700 break-words'>{videoInfo.metaDescription}</div>
                                )}
                                {videoInfo.metaKeywords && (
                                    <div className='break-words text-sm text-gray-700'>키워드: {videoInfo.metaKeywords}</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default VideoInfo;