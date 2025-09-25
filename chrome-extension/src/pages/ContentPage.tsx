import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom';
import { VideoInfo } from 'components';
import ContentModule from 'components/ContentPage/ContentModule';
import { prewarmRealtime, setTtsStyle } from 'services/tts';
import DeepDiveModal from 'components/ContentPage/DeepDiveModal';
import usePageTransition from 'hooks/usePageTransition';
import { AnalyzeResponse, fetchAndStoreCurrentVideoInfo, analyzeCurrentVideo, getUserProfileFromStorage, requestDeepDiveBatch, saveDeepDiveResultToStorage } from 'services/chromeVideo';
import sampleAnalysis from 'assets/data/sample_analysis_result.json';


function ContentPage() {
    const { isVisible, navigateWithCardExpand, expandState } = usePageTransition();
    const location = useLocation();
    const navigate = useNavigate();
    const [analysisData, setAnalysisData] = useState<AnalyzeResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingCardId, setLoadingCardId] = useState<string | null>(null);

    const handleCheckpointClick = async (checkpoint: any) => {
        // 사용자 제스처 시점에 오디오/세션 선-준비
        try {
            // apply mascot voice style before prewarm
            setTtsStyle({
                voice: 'sage',
                instructions: 'You are Taki, a cheerful female bunny tutor mascot. Speak English only. Keep it friendly, energetic, and playful. Use short sentences (7–12 words) and a slightly higher pitch. Stay natural and not overly cutesy. Keep pace comfortable. Sound like you are talking to a friend while teaching.'
            });
            prewarmRealtime();
        } catch {}
        const clickedElementId = `checkpoint-${checkpoint.timestamp_seconds}-${checkpoint.trigger_keyword}`;
        setLoadingCardId(clickedElementId);
        const scrollY = window.scrollY;

        // 저장된 프로필 로드
        const profile = await getUserProfileFromStorage();

        let deepDiveItem: any | undefined = undefined;
        try {
            if (profile) {
                const batch = await requestDeepDiveBatch(profile, [checkpoint]);
                if (batch?.items && batch.items.length > 0) {
                    deepDiveItem = batch.items[0];
                    await saveDeepDiveResultToStorage(batch);
                }
            }
        } catch (e) {
            console.warn('[DeepDive] batch failed', e);
        } finally {
            // 로딩 오버레이는 모달 전환 직전까지 유지되며, 전환 후에는 필요 없음
        }

        // 동일 경로(/content)에 모달 state만 push하여 배경 유지
        navigateWithCardExpand('/content', {
            from: 'content',
            clickedElementId,
            scrollY,
            modalCheckpoint: checkpoint,
            deepDiveItem,
        });
        // 네비게이션 호출 후 로딩 상태 해제
        setTimeout(() => setLoadingCardId(null), 0);
    };

    const getPageClass = () => {
        const baseClass = "w-full bg-[#1b1b1b] overflow-x-hidden hide-scrollbar";
        
        // 접힘 완료 후 나타나는 효과
        if (expandState === 'idle') {
            return `${baseClass} card-expand-transition page-expand-entrance-active`;
        }
        
        return `${baseClass} page-transition ${isVisible ? 'page-transition-fade-in' : 'page-transition-fade-out'}`;
    };

    useEffect(() => {
        const loadAnalysisData = async () => {
            try {
                setLoading(true);
                setError(null);

                // 현재 YouTube 탭에서 비디오 정보 가져오기 (없어도 진행)
                const videoInfo = await fetchAndStoreCurrentVideoInfo();
                if (!videoInfo) {
                    console.warn('[ContentPage] 활성 YouTube 비디오를 찾지 못했습니다. 샘플 데이터로 진행합니다.');
                    setAnalysisData(sampleAnalysis as AnalyzeResponse);
                    setError(null);
                    return;
                }

                // 사용자 프로필 (임시 데이터 - 실제로는 사용자 설정에서 가져와야 함)
                const userProfile = {
                    familiarity: 3,
                    language_level: "Intermediate" as const,
                    interests: ["k-drama", "social culture"]
                };

                // 서버에서 분석 결과 가져오기
                const result = videoInfo
                    ? await analyzeCurrentVideo(videoInfo.url, userProfile)
                    : null;
                
                // 분석 결과 콘솔에 출력
                console.groupCollapsed('[ContentPage] 분석 결과 받음');
                console.log('전체 응답:', result);
                console.log('비디오 정보:', result?.video_info);
                console.log('체크포인트 개수:', result?.checkpoints?.length || 0);
                
                if (result && result.checkpoints && result.checkpoints.length > 0) {
                    console.group('체크포인트 상세 내용:');
                    result.checkpoints.forEach((checkpoint, index) => {
                        console.group(`체크포인트 ${index + 1}:`);
                        console.log('타임스탬프:', checkpoint.timestamp_formatted);
                        console.log('트리거 키워드:', checkpoint.trigger_keyword);
                        console.log('발화 내용:', checkpoint.segment_stt);
                        console.log('장면 설명:', checkpoint.scene_description);
                        console.log('문화적 맥락:', checkpoint.context_title);
                        console.log('설명 요약:', checkpoint.explanation.summary);
                        console.log('상세 설명:', checkpoint.explanation.main);
                        console.log('실용 팁:', checkpoint.explanation.tip);
                        console.log('관련 관심사:', checkpoint.related_interests);
                        console.log('전체 객체:', checkpoint);
                        console.groupEnd();
                    });
                    console.groupEnd();
                }
                console.groupEnd();
                
                if (result) {
                    setAnalysisData(result as AnalyzeResponse);
                } else {
                    console.warn('[ContentPage] 서버 응답이 없어 더미 데이터를 사용합니다.');
                    setAnalysisData(sampleAnalysis as AnalyzeResponse);
                }

            } catch (err) {
                console.error('분석 데이터 로딩 실패:', err);
                console.warn('[ContentPage] 오류 발생으로 더미 데이터를 사용합니다.');
                setAnalysisData(sampleAnalysis as AnalyzeResponse);
                setError(null);
            } finally {
                setLoading(false);
            }
        };

        loadAnalysisData();

        // 뒤로 돌아왔을 때: state로 전달된 스크롤 위치와 타겟 모듈로 복원
        const navState = (window.history.state && (window.history.state as any).usr) || undefined;
        if (navState && navState.from === 'deepdive' && navState.clickedElementId) {
            const target = document.getElementById(navState.clickedElementId);
            if (target) {
                target.scrollIntoView({ behavior: 'auto', block: 'center' });
                // 하이라이트 효과
                target.classList.add('module-highlight');
                setTimeout(() => target.classList.remove('module-highlight'), 800);
            } else if (typeof navState.scrollY === 'number') {
                window.scrollTo({ top: navState.scrollY, behavior: 'auto' });
            }
        }
    }, []);

    // 모달 상태: location.state?.modalCheckpoint
    const navState = (location.state as any) || undefined;
    const modalCheckpoint = navState?.modalCheckpoint as any | undefined;
    const modalDeepDiveItem = navState?.deepDiveItem as any | undefined;

    return (
        <div className={getPageClass()}>
            <div className='w-full box-border flex justify-center px-10 py-4 overflow-x-hidden'>
                <div className='w-full min-w-0 max-w-md sm:max-w-lg lg:max-w-2xl'>
                    <VideoInfo />
                    
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="size-8 rounded-full border-b-2 border-blue-600 animate-spin"></div>
                            <span className="ml-3 text-gray-600">분석 중...</span>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <div className="text-red-800 font-medium">오류 발생</div>
                            <div className="text-red-700 text-sm mt-1">{error}</div>
                        </div>
                    )}

                    {analysisData && analysisData.checkpoints && (
                        <div className="mt-6">
                            {analysisData.checkpoints.map((checkpoint, index) => {
                                const cardId = `checkpoint-${checkpoint.timestamp_seconds}-${checkpoint.trigger_keyword}`;
                                return (
                                    <ContentModule 
                                        key={`${checkpoint.timestamp_seconds}-${index}`}
                                        checkpoint={checkpoint}
                                        onClick={handleCheckpointClick}
                                        isLoading={loadingCardId === cardId}
                                    />
                                );
                            })}
                        </div>
                    )}

                    {analysisData && (!analysisData.checkpoints || analysisData.checkpoints.length === 0) && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                            <div className="text-yellow-800 font-medium">분석 결과 없음</div>
                            <div className="text-yellow-700 text-sm mt-1">
                                이 비디오에서 분석할 문화적 맥락을 찾을 수 없습니다.
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {modalCheckpoint && (
                <DeepDiveModal checkpoint={modalCheckpoint} deepDiveItem={modalDeepDiveItem} onClose={() => navigate(-1)} />
            )}
        </div>
    )
}

export default ContentPage;