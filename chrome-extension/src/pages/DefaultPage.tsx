import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import PlayButton from 'assets/images/button_play.png'

function DefaultPage() {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);
    const [isFadingOut, setIsFadingOut] = useState(false);

    useEffect(() => {
        const rafId = requestAnimationFrame(() => setIsVisible(true));
        return () => {
            cancelAnimationFrame(rafId);
        };
    }, [navigate]);

    const handleTransitionEnd: React.TransitionEventHandler<HTMLDivElement> = (e) => {
        if (e.target !== e.currentTarget) return;
        if (isFadingOut) {
            navigate('/content');
        }
    };

    const handleButtonClick = async () => {
        try {
            if (!chrome?.tabs || !chrome?.scripting) {
                alert('Chrome API를 사용할 수 없습니다.');
                return;
            }
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true, url: "*://*.youtube.com/*"  });
            const tab = tabs[0];
            if (!tab?.id) {
                alert('활성 탭을 찾을 수 없습니다.');
                return;
            }

            const tabUrl: string = tab.url || '';
            const isHttpHttps = /^https?:\/\//i.test(tabUrl);
            if (!isHttpHttps) {
                alert('이 페이지에서는 영상 정보를 가져올 수 없습니다.\n지원되는 페이지: http/https 웹 페이지 (예: 유튜브 재생 탭)');
                return;
            }

            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id, allFrames: true },
                func: () => {
                    const toFinite = (n: number) => (Number.isFinite(n) ? n : 0);
                    const video = document.querySelector('video');
                    const title = document.title;
                    const url = window.location.href;
                    const videoId = new URLSearchParams(new URL(url).search).get("v");
                    const thumbnailUrl = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null;
                    
                    if (!video) return null;
                    return {
                        url,
                        title,
                        thumbnailUrl,
                        duration: toFinite(video.duration),
                        currentTime: toFinite(video.currentTime),
                        paused: !!video.paused,
                        playbackRate: toFinite(video.playbackRate) || 1,
                        width: toFinite(video.videoWidth),
                        height: toFinite(video.videoHeight)
                    };
                }
            });

            const first = Array.isArray(results) ? results.find((r) => r && r.result) : null;
            const result = first?.result || null;

            if (!result) {
                alert('이 페이지에서 재생 중인 영상을 찾지 못했습니다.');
                return;
            }

            await chrome.storage.local.set({ currentVideoInfo: result });
            setIsFadingOut(true);
        } catch (error) {
            console.error(error);
            alert('영상 정보를 가져오는 중 오류가 발생했습니다.');
        }
    };

    return (
        <div
            className={`absolute inset-0 overflow-hidden bg-gradient-to-br from-[#FF8C7A]/40 to-[#2EC4B6]/40 ${isVisible && !isFadingOut ? 'opacity-100' : 'opacity-0'} transition-opacity duration-[350ms] flex items-center justify-center`}
            style={{ willChange: 'opacity' }}
            onTransitionEnd={handleTransitionEnd}
        >
            <div className='flex items-center justify-center w-full h-full'>
                <img src={PlayButton} alt='Play' className='w-[40%] cursor-pointer' onClick={handleButtonClick} />
            </div>
        </div>
    )
}


export default DefaultPage;

