import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Logo from 'components/common/Logo';
import Dropdown from 'components/OptionPage/Dropdown';
import Button from 'components/common/BlackButton';
import { StarRating } from 'components';

function OptionPage() {
    const navigate = useNavigate();
    const handleConfirmClick = async () => {
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
            navigate('/content');
        } catch (error) {
            console.error(error);
            alert('영상 정보를 가져오는 중 오류가 발생했습니다.');
        }
    };

    const languageLevels = [
        { id: 1, label: 'Beginner' },
        { id: 2, label: 'Intermediate' },
        { id: 3, label: 'Advanced' },
    ];

    // Interests 태그 옵션 및 선택 상태
    const interestOptions = [
        { id: 1, label: 'K-POP' },
        { id: 2, label: 'K-Drama' },
        { id: 3, label: 'Food' },
        { id: 4, label: 'Language' },
        { id: 5, label: 'History' },
        { id: 6, label: 'Humor' },
        { id: 7, label: 'Politics' },
        { id: 8, label: 'Beauty & Fashion' }
    ];
    const [selectedInterests, setSelectedInterests] = React.useState<number[]>([]);
    const toggleInterest = (id: number) => {
        setSelectedInterests((prev) =>
            prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
        );
    };

    return (
        <div className="flex h-screen flex-col items-center justify-center overflow-hidden bg-white">
            <div className="w-full max-w-[75%] px-8"> {/* w-full과 max-w-sm을 함께 사용하여 반응형 너비 설정 */}
                {/* 1. Familiarity 그룹 */}
                <div className="flex w-full flex-row items-center justify-between mb-5">
                    <p className='mb-2.5 font-medium font-spoqa'>Familiarity</p>
                    <StarRating />
                </div>
                
                {/* 2. Language Level 그룹 */}
                <div className="flex w-full flex-col items-start mb-5">
                    <p className='mb-2.5 font-medium font-spoqa'>Language Level</p>
                    <Dropdown items={languageLevels} placeholder="" />
                </div>
                
                {/* 3. Interests 그룹 */}
                <div className="flex w-full flex-col items-start">
                    <p className='mb-2.5 font-medium font-spoqa'>Interests</p>
                    <div className="flex w-full flex-wrap gap-2">
                        {interestOptions.map((item) => {
                            const isSelected = selectedInterests.includes(item.id);
                            return (
                                <motion.button
                                    key={item.id}
                                    type="button"
                                    onClick={() => toggleInterest(item.id)}
                                    className={`rounded-[2.5vw] border px-3 py-1 text-sm font-spoqa transition-colors ${
                                        isSelected
                                            ? 'bg-black text-white border-black'
                                            : 'bg-gray-100 text-gray-700 border-gray-300'
                                    }`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.97 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                                    aria-pressed={isSelected}
                                >
                                    {item.label}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </div>
            
            <div className="mt-[12vh] w-full max-w-[50%] px-8">
                <Button fullWidth bgColor="bg-black" textColor="text-white"  className="text-sm" onClick={handleConfirmClick} >Confirm</Button>
            </div>
        </div>
    )
}

export default OptionPage;