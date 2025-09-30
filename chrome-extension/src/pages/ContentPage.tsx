import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { VideoInfo, ContentModule } from 'components/common';
import DeepDiveModal from 'components/ContentPage/DeepDiveModal';
import usePageTransition from 'hooks/usePageTransition';
import useAnalysisData from 'hooks/useAnalysisData';
import useCheckpointClick from 'hooks/useCheckpointClick';
import useProgressiveCheckpoints from 'hooks/useProgressiveCheckpoints';
import useContentPageState from 'hooks/useContentPageState';
import LoadingIndicator from 'components/common/LoadingIndicator';
import ErrorBanner from 'components/common/ErrorBanner';
import EmptyAnalysisBanner from 'components/common/EmptyAnalysisBanner';
import Header from 'components/common/WhiteHeader';
import { pauseYouTubeVideo, playYouTubeVideo } from 'services/chromeVideo';

function ContentPage() {
  const { isVisible, expandState } = usePageTransition();
  const location = useLocation();
  const navigate = useNavigate();
  const { analysisData, loading, error } = useAnalysisData();
  const { loadingCardId, setLoadingCardId, wasVideoPlaying, setWasVideoPlaying, restoreScrollPosition } = useContentPageState();
  const { handleCheckpointClick } = useCheckpointClick({ onLoadingChange: setLoadingCardId });
  const { sortedCheckpoints, visibleUntilIndex, isBootstrapping, isProgressiveMode } = useProgressiveCheckpoints({ analysisData, enabled: true });

  const getPageClass = () => {
    // Use min-h-screen to allow page height to expand under modal; body scroll will be locked by modal
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
    restoreScrollPosition();
  }, [restoreScrollPosition]);

  // 진행형/정적 렌더링 로직은 훅으로 이동

  // 모달 상태: location.state?.modalCheckpoint
  const navState = (location.state as any) || undefined;
  const modalCheckpoint = navState?.modalCheckpoint as any | undefined;
  const modalDeepDiveItem = navState?.deepDiveItem as any | undefined;

  // ContentModule 클릭 시 YouTube 영상 일시정지
  const handleContentModuleClick = async (checkpoint: any) => {
    // 현재 영상이 재생 중인지 확인하고 일시정지
    try {
      await pauseYouTubeVideo();
      setWasVideoPlaying(true);
    } catch (error) {
      console.error('Failed to pause YouTube video:', error);
      setWasVideoPlaying(false);
    }
    
    // 기존 클릭 핸들러 실행
    handleCheckpointClick(checkpoint);
  };

  // DeepDiveModal 종료 시 YouTube 영상 재개
  const handleModalClose = async () => {
    // 이전에 재생 중이었다면 재개
    if (wasVideoPlaying) {
      try {
        await playYouTubeVideo();
      } catch (error) {
        console.error('Failed to resume YouTube video:', error);
      }
    }
    setWasVideoPlaying(false);
    navigate(-1);
  };

  return (
    <div className={getPageClass()}>
      <div className='w-full box-border flex justify-center px-[5vw] py-[2vh] overflow-x-hidden'>
        <div className='w-full min-w-0 max-w-md sm:max-w-lg lg:max-w-2xl'>

          <div className='py-[2vh] mb-[3vh]'>
            <Header />
          </div>
          
          <VideoInfo autoLoad={true} />

          {loading && (<LoadingIndicator />)}

          {error && (<ErrorBanner message={error} />)}

          {analysisData && analysisData.checkpoints && (
            <div className='mt-6'>
              {(isProgressiveMode ? sortedCheckpoints.slice(0, Math.min(sortedCheckpoints.length, visibleUntilIndex + 1)) : analysisData.checkpoints).map((checkpoint, index) => {
                const cardId = `checkpoint-${checkpoint.timestamp_seconds}-${checkpoint.trigger_keyword}`;
                const appearDelayMs = isBootstrapping ? 60 * Math.min(index, 8) : 0; // 초기 진입만 스타거
                return (
                  <ContentModule
                    key={`${checkpoint.timestamp_seconds}-${index}`}
                    checkpoint={checkpoint}
                    onClick={handleContentModuleClick}
                    isLoading={loadingCardId === cardId}
                    appearDelayMs={appearDelayMs}
                    interactive={true}
                  />
                );
              })}
            </div>
          )}

          {analysisData && (!analysisData.checkpoints || analysisData.checkpoints.length === 0) && (
            <EmptyAnalysisBanner />
          )}
        </div>
      </div>
      {modalCheckpoint && (
        <DeepDiveModal
          checkpoint={modalCheckpoint}
          deepDiveItem={modalDeepDiveItem}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}

export default ContentPage;