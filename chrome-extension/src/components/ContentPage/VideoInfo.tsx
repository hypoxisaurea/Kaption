import React, { useCallback, useEffect, useState } from 'react'

type VideoInfo = {
  url: string;
  title: string;
  thumbnailUrl?: string | null;
  duration: number;
  currentTime: number;
  paused: boolean;
  playbackRate: number;
  width: number;
  height: number;
};

const isVideoInfo = (val: unknown): val is VideoInfo => {
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

  const [videoInfo, setVideoInfo] = useState<null | VideoInfo>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const formatTime = (seconds: number) => {
      const s = Math.floor(seconds % 60).toString().padStart(2, '0');
      const m = Math.floor((seconds / 60) % 60).toString().padStart(2, '0');
      const h = Math.floor(seconds / 3600);
      return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

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
            <div className='flex-1 w-full max-w-[800px] px-6 py-4'>
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
                    <div className='space-y-2'>
                        {videoInfo.thumbnailUrl && (
                            <img
                                src={videoInfo.thumbnailUrl}
                                alt='thumbnail'
                                className='w-full max-w-[480px] rounded-md border border-gray-200'
                            />
                        )}
                        <div className='text-lg font-medium'>{videoInfo.title}</div>
                        <div className='text-sm text-gray-600 break-all'>{videoInfo.url}</div>
                        <div className='text-sm'>
                            길이: {formatTime(videoInfo.duration)}
                            {' • '}현재: {formatTime(videoInfo.currentTime)}
                            {' • '}배속: {videoInfo.playbackRate}x
                            {' • '}상태: {videoInfo.paused ? '일시정지' : '재생 중'}
                        </div>
                        <div className='text-sm text-gray-600'>해상도: {videoInfo.width} × {videoInfo.height}</div>
                        <button
                            className='mt-3 px-3 py-1.5 rounded bg-black text-white text-sm'
                            onClick={loadInfo}
                        >
                            새로고침
                        </button>
                    </div>
                )}
            </div>
        </div>
  )
}

export default VideoInfo;