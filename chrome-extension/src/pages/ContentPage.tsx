import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { VideoInfo } from 'components';
import ContentModule from 'components/ContentPage/ContentModule';
import { prewarmRealtime, setTtsStyle } from 'services/tts';
import DeepDiveModal from 'components/ContentPage/DeepDiveModal';
import usePageTransition from 'hooks/usePageTransition';
import {
  AnalyzeResponse,
  getUserProfileFromStorage,
  requestDeepDiveBatch,
  saveDeepDiveResultToStorage,
  getAnalysisResultFromStorage, // 이 함수를 사용하도록 수정
  getCurrentPlaybackState,
} from 'services/chromeVideo';
import sampleAnalysis from 'assets/data/sample_analysis_result.json';

function ContentPage() {
  const { isVisible, navigateWithCardExpand, expandState } = usePageTransition();
  const location = useLocation();
  const navigate = useNavigate();
  const [analysisData, setAnalysisData] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(true); // 초기 로딩 상태를 true로 설정
  const [error, setError] = useState<string | null>(null);
  const [loadingCardId, setLoadingCardId] = useState<string | null>(null);
  const [visibleUntilIndex, setVisibleUntilIndex] = useState<number>(-1);
  const [isProgressiveMode, setIsProgressiveMode] = useState<boolean>(true);
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(true);
  const prevVisibleIndexRef = useRef<number>(-1);

  const handleCheckpointClick = async (checkpoint: any) => {
    // 사용자 제스처 시점에 오디오/세션 선-준비
    try {
      // apply mascot voice style before prewarm
      setTtsStyle({
        voice: 'sage',
        instructions:
          'You are Taki, a cheerful female bunny tutor mascot. Speak English only. Keep it friendly, energetic, and playful. Use short sentences (7–12 words) and a slightly higher pitch. Stay natural and not overly cutesy. Keep pace comfortable. Sound like you are talking to a friend while teaching.',
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
    const baseClass = 'w-full min-h-screen bg-[#1b1b1b] overflow-x-hidden hide-scrollbar';

    // 접힘 완료 후 나타나는 효과
    if (expandState === 'idle') {
      return `${baseClass} card-expand-transition page-expand-entrance-active`;
    }

    return `${baseClass} page-transition ${
      isVisible ? 'page-transition-fade-in' : 'page-transition-fade-out'
    }`;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // 로딩 페이지에서 이미 분석이 완료되었으므로, 저장소에서 결과를 바로 로드합니다.
        const savedData = await getAnalysisResultFromStorage();

        if (savedData) {
          setAnalysisData(savedData as AnalyzeResponse);
          // 분석 결과 콘솔에 출력
          console.groupCollapsed('[ContentPage] 저장된 분석 결과 로드');
          console.log('전체 응답:', savedData);
          console.log('비디오 정보:', savedData?.video_info);
          console.log('체크포인트 개수:', savedData?.checkpoints?.length || 0);

          if (savedData.checkpoints && savedData.checkpoints.length > 0) {
            console.group('체크포인트 상세 내용:');
            savedData.checkpoints.forEach((checkpoint, index) => {
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
        } else {
          // 저장된 데이터가 없는 경우 (비정상적인 접근 등)
          console.warn('[ContentPage] 저장된 분석 결과가 없어 더미 데이터를 사용합니다.');
          setAnalysisData(sampleAnalysis as AnalyzeResponse);
        }
      } catch (err) {
        console.error('분석 데이터 로딩 실패:', err);
        setError('분석 데이터를 로드하는 데 실패했습니다. 다시 시도해 주세요.');
        setAnalysisData(sampleAnalysis as AnalyzeResponse); // 오류 시 더미 데이터 사용
      } finally {
        setLoading(false);
      }
    };

    loadData();

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

  // 체크포인트 정렬 (안전장치)
  const sortedCheckpoints = useMemo(() => {
    const cps = analysisData?.checkpoints ?? [];
    return [...cps].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds);
  }, [analysisData?.checkpoints]);

  // 첫 tick 이전에 현재 재생시간으로 시작 오프셋 계산 (부트스트랩)
  useEffect(() => {
    if (!isProgressiveMode) return;
    if (!sortedCheckpoints.length) return;
    if (visibleUntilIndex >= 0) return; // 이미 설정됨

    (async () => {
      try {
        const state = await getCurrentPlaybackState();
        if (!state) return;
        const t = state.currentTime;
        let lo = 0;
        let hi = sortedCheckpoints.length - 1;
        let last = -1;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          if (sortedCheckpoints[mid].timestamp_seconds <= t + 0.05) {
            last = mid;
            lo = mid + 1;
          } else {
            hi = mid - 1;
          }
        }
        if (last >= 0) {
          setVisibleUntilIndex(last);
          // 부트스트랩은 짧은 시간만 스타거 적용
          window.setTimeout(() => setIsBootstrapping(false), 800);
        } else {
          setIsBootstrapping(false);
        }
      } catch {}
    })();
  }, [isProgressiveMode, sortedCheckpoints, visibleUntilIndex]);

  // 부트스트랩을 거치지 않고 첫 카드가 추가되는 경우도 종료 처리
  useEffect(() => {
    if (isBootstrapping && visibleUntilIndex >= 0) {
      window.setTimeout(() => setIsBootstrapping(false), 400);
    }
  }, [isBootstrapping, visibleUntilIndex]);

  // 재생 시간 폴링하여 progressive 렌더링
  useEffect(() => {
    if (!analysisData || !sortedCheckpoints.length) return;

    // 사용자가 전체 보기 원하면 중단
    if (!isProgressiveMode) {
      setVisibleUntilIndex(sortedCheckpoints.length - 1);
      return;
    }

    let timerId: number | null = null;
    let destroyed = false;

    const tick = async () => {
      if (destroyed) return;
      try {
        const state = await getCurrentPlaybackState();
        if (state && Number.isFinite(state.currentTime)) {
          const t = state.currentTime;
          // 현재 시간 이하의 마지막 인덱스 계산 (이진 탐색)
          let lo = 0;
          let hi = sortedCheckpoints.length - 1;
          let last = -1;
          while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (sortedCheckpoints[mid].timestamp_seconds <= t + 0.05) {
              last = mid;
              lo = mid + 1;
            } else {
              hi = mid - 1;
            }
          }
          if (last >= 0) setVisibleUntilIndex((prev) => (last > prev ? last : prev));
        }
      } catch {}
      finally {
        if (!destroyed) {
          timerId = window.setTimeout(tick, 500);
        }
      }
    };

    tick();
    return () => {
      destroyed = true;
      if (timerId) window.clearTimeout(timerId);
    };
  }, [analysisData, sortedCheckpoints, isProgressiveMode]);

  // 새 카드가 나타날 때 자동 스크롤(마지막 카드로)
  useEffect(() => {
    if (!isProgressiveMode) return;
    const prev = prevVisibleIndexRef.current;
    if (visibleUntilIndex <= prev) return;
    prevVisibleIndexRef.current = visibleUntilIndex;

    const last = sortedCheckpoints[visibleUntilIndex];
    if (!last) return;
    const elId = `checkpoint-${last.timestamp_seconds}-${last.trigger_keyword}`;
    // 렌더 직후 DOM 반영을 기다렸다가 스크롤
    const id = window.setTimeout(() => {
      const el = document.getElementById(elId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 50);
    return () => window.clearTimeout(id);
  }, [visibleUntilIndex, isProgressiveMode, sortedCheckpoints]);

  // 모달 상태: location.state?.modalCheckpoint
  const navState = (location.state as any) || undefined;
  const modalCheckpoint = navState?.modalCheckpoint as any | undefined;
  const modalDeepDiveItem = navState?.deepDiveItem as any | undefined;

  return (
    <div className={getPageClass()}>
      <div className='w-full box-border flex justify-center px-[5vw] py-[2vh] overflow-x-hidden'>
        <div className='w-full min-w-0 max-w-md sm:max-w-lg lg:max-w-2xl'>
          <VideoInfo />

          {loading && (
            <div className='flex items-center justify-center py-8'>
              <div className='size-8 rounded-full border-b-2 border-blue-600 animate-spin'></div>
              <span className='ml-3 text-gray-600'>Analyzing...</span>
            </div>
          )}

          {error && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-4'>
              <div className='text-red-800 font-medium'>Error occured</div>
              <div className='text-red-700 text-sm mt-1'>{error}</div>
            </div>
          )}

          {analysisData && analysisData.checkpoints && (
            <div className='mt-6'>
              {(isProgressiveMode ? sortedCheckpoints.slice(0, Math.min(sortedCheckpoints.length, visibleUntilIndex + 1)) : analysisData.checkpoints).map((checkpoint, index) => {
                const cardId = `checkpoint-${checkpoint.timestamp_seconds}-${checkpoint.trigger_keyword}`;
                const appearDelayMs = isBootstrapping ? 60 * Math.min(index, 8) : 0; // 초기 진입만 스타거
                return (
                  <ContentModule
                    key={`${checkpoint.timestamp_seconds}-${index}`}
                    checkpoint={checkpoint}
                    onClick={handleCheckpointClick}
                    isLoading={loadingCardId === cardId}
                    appearDelayMs={appearDelayMs}
                  />
                );
              })}
            </div>
          )}

          {analysisData &&
            (!analysisData.checkpoints || analysisData.checkpoints.length === 0) && (
              <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6'>
                <div className='text-yellow-800 font-medium'>
                  Analysis result doesn't exist
                </div>
                <div className='text-yellow-700 text-sm mt-1'>
                  I can't find any cultural context to analyze in this video.
                </div>
              </div>
            )}
        </div>
      </div>
      {modalCheckpoint && (
        <DeepDiveModal
          checkpoint={modalCheckpoint}
          deepDiveItem={modalDeepDiveItem}
          onClose={() => navigate(-1)}
        />
      )}
    </div>
  );
}

export default ContentPage;