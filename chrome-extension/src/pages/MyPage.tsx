import React from 'react'
import { ContentModule, VideoInfo, PageLayout } from 'components/common'
import VideoList from 'components/MyPage/VideoList'
import SavingModal from 'components/MyPage/SavingModal'
import useVideoAnalysisHistory from 'hooks/useVideoAnalysisHistory'

/**
 * MyPage - 사용자의 학습 기록을 보여주는 페이지
 * 
 * 기능:
 * - 분석된 YouTube 영상들의 목록 표시
 * - 영상 선택 시 해당 영상의 분석 결과 표시
 * - 로딩, 에러, 빈 상태 처리
 */
function MyPage() {
  // 비디오 분석 기록 관련 훅 사용
  const {
    analysisHistory,    // 분석 기록 목록
    selectedVideo,      // 현재 선택된 영상
    loading,           // 로딩 상태
    error,             // 에러 상태
    handleVideoSelect, // 영상 선택 핸들러
  } = useVideoAnalysisHistory()

  // 모달 상태 (훅은 반드시 최상단에서 선언)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  // 로딩 상태일 때 표시
  if (loading) {
    return (
      <PageLayout className="h-screen flex flex-col overflow-hidden">
        <div className="flex-1 flex items-center justify-center overflow-y-auto">
          <div className="text-white text-lg">Loading...</div>
        </div>
      </PageLayout>
    )
  }

  // 에러 상태일 때 표시
  if (error) {
    return (
      <PageLayout className="h-screen flex flex-col overflow-hidden">
        <div className="flex-1 flex items-center justify-center overflow-y-auto">
          <div className="text-white text-lg">{error}</div>
        </div>
      </PageLayout>
    )
  }

  // 분석 기록이 없을 때 표시
  if (analysisHistory.length === 0) {
    return (
      <PageLayout className="h-screen flex flex-col overflow-hidden">
        <div className="flex-1 flex items-center justify-center overflow-y-auto">
          <div className="text-center text-white">
            <div className="text-xl mb-4">No analysis history</div>
            <div className="text-sm opacity-80">Analyze a video on YouTube!</div>
          </div>
        </div>
      </PageLayout>
    )
  }

  // 메인 컨텐츠 렌더링
  return (
    <PageLayout className="h-screen flex flex-col overflow-hidden">
      <div className="flex-1 overflow-x-hidden hide-scrollbar">
        {/* 영상 목록 섹션 */}
        <VideoList 
          analysisHistory={analysisHistory}
          selectedVideo={selectedVideo}
          onVideoSelect={(video) => { handleVideoSelect(video); openModal(); }}
        />
      </div>

      {/* 전체 화면 분석 결과 모달 */}
      {isModalOpen && selectedVideo && (
        <SavingModal video={selectedVideo} onClose={closeModal} />
      )}
    </PageLayout>
  )
}

export default MyPage;