import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import PlayButton from 'assets/images/icon/button_play.png'
import WhiteHeader from 'components/common/WhiteHeader'

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
                target: { tabId: tab.id, allFrames: false },
                func: () => {
                    const toFinite = (n: number) => (Number.isFinite(n) ? n : 0);
                    const selectContent = (selector: string) => {
                        const el = document.querySelector(selector) as HTMLMetaElement | null;
                        return el?.content ?? null;
                    };
                    const extractYouTubeKeywordsFromScripts = () => {
                        try {
                            const scripts = Array.from(document.querySelectorAll('script:not([src])'));
                            const re = /ytInitialPlayerResponse\s*=\s*(\{[\s\S]*?\})\s*;?/;
                            for (const s of scripts) {
                                const text = s.textContent || '';
                                if (!text || (!text.includes('ytInitialPlayerResponse') && !text.includes('"videoDetails"'))) continue;
                                const m = re.exec(text);
                                if (!m) continue;
                                const json = m[1];
                                let data: any;
                                try { data = JSON.parse(json); } catch { continue; }
                                const kws = data?.videoDetails?.keywords;
                                if (Array.isArray(kws) && kws.length) {
                                    return kws.join(', ');
                                }
                            }
                        } catch {}
                        return null as string | null;
                    };
                    const parseLdVideoObject = () => {
                        try {
                            const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
                            for (const s of scripts) {
                                const text = s.textContent || '';
                                if (!text.trim()) continue;
                                let data: any;
                                try { data = JSON.parse(text); } catch { continue; }
                                const arr = Array.isArray(data) ? data : [data];
                                for (const obj of arr) {
                                    const typeVal = obj?.['@type'];
                                    const types = Array.isArray(typeVal) ? typeVal : [typeVal];
                                    if (types?.includes('VideoObject')) {
                                        const keywords = Array.isArray(obj?.keywords)
                                            ? obj.keywords.join(', ')
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
                        return null as null | { name: string | null; description: string | null; keywords: string | null };
                    };

                    const video = document.querySelector('video');
                    const url = window.location.href;
                    const ld = parseLdVideoObject();

                    const metaTitle = selectContent('meta[property="og:title"]')
                        ?? ld?.name
                        ?? selectContent('meta[itemprop="name"]')
                        ?? document.title
                        ?? selectContent('meta[name="title"]');

                    const metaDescription = selectContent('meta[property="og:description"]')
                        ?? ld?.description
                        ?? selectContent('meta[itemprop="description"]')
                        ?? selectContent('meta[name="description"]');

                    const ogVideoTags = Array.from(document.querySelectorAll('meta[property="video:tag"], meta[property="og:video:tag"]'))
                        .map((m) => (m as HTMLMetaElement).content)
                        .filter(Boolean)
                        .join(', ') || null;
                    const ytScriptKeywords = extractYouTubeKeywordsFromScripts();
                    const metaKeywords = (ld?.keywords ?? null)
                        ?? ogVideoTags
                        ?? selectContent('meta[itemprop="keywords"]')
                        ?? ytScriptKeywords
                        ?? selectContent('meta[name="keywords"]');

                    const videoId = new URLSearchParams(new URL(url).search).get('v');
                    const thumbnailUrl = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null;

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
                    };
                }
            });

            const first = Array.isArray(results) ? results[0] : null;
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
        <>
            <div className='relative z-10'>
                <WhiteHeader />
            </div>
            <div
                className={`absolute inset-0 z-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#FF8C7A]/40 to-[#2EC4B6]/40 ${isVisible && !isFadingOut ? 'opacity-100' : 'opacity-0'} transition-opacity duration-[350ms]`}
                style={{ willChange: 'opacity' }}
                onTransitionEnd={handleTransitionEnd}
            >
                <div className='flex size-full items-center justify-center'>
                    <img src={PlayButton} alt='Play' className='w-2/5 cursor-pointer' onClick={handleButtonClick} />
                </div>
            </div>
        </>
    )
}


export default DefaultPage;

