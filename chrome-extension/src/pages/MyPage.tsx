import React from 'react'
import { ContentModule, VideoInfo, WhiteHeader } from 'components/common'
import useVideoAnalysisHistory from 'hooks/useVideoAnalysisHistory'

function MyPage() {
  const {
    analysisHistory,
    selectedVideo,
    loading,
    error,
    handleVideoSelect,
    handleVideoDelete,
    formatDate,
  } = useVideoAnalysisHistory()

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#1b1b1b] overflow-x-hidden hide-scrollbar">
        <div className='w-full box-border flex justify-center px-[5vw] py-[2vh] overflow-x-hidden'>
          <div className='w-full min-w-0 max-w-md sm:max-w-lg lg:max-w-2xl'>
            <div className='py-[2vh] mb-[3vh]'>
              <WhiteHeader />
            </div>
            <div className="flex items-center justify-center h-96">
              <div className="text-white text-lg">분석 기록을 불러오는 중...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full min-h-screen bg-[#1b1b1b] overflow-x-hidden hide-scrollbar">
        <div className='w-full box-border flex justify-center px-[5vw] py-[2vh] overflow-x-hidden'>
          <div className='w-full min-w-0 max-w-md sm:max-w-lg lg:max-w-2xl'>
            <div className='py-[2vh] mb-[3vh]'>
              <WhiteHeader />
            </div>
            <div className="flex items-center justify-center h-96">
              <div className="text-white text-lg">{error}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (analysisHistory.length === 0) {
    return (
      <div className="w-full min-h-screen bg-[#1b1b1b] overflow-x-hidden hide-scrollbar">
        <div className='w-full box-border flex justify-center px-[5vw] py-[2vh] overflow-x-hidden'>
          <div className='w-full min-w-0 max-w-md sm:max-w-lg lg:max-w-2xl'>
            <div className='py-[2vh] mb-[3vh]'>
              <WhiteHeader />
            </div>
            <div className="flex items-center justify-center h-96">
              <div className="text-center text-white">
                <div className="text-xl mb-4">아직 분석한 영상이 없습니다</div>
                <div className="text-sm opacity-80">YouTube에서 영상을 분석해보세요!</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-[#1b1b1b] overflow-x-hidden hide-scrollbar">
      <div className='w-full box-border flex justify-center px-[5vw] py-[2vh] overflow-x-hidden'>
        <div className='w-full min-w-0 max-w-md sm:max-w-lg lg:max-w-2xl'>
          
          <div className='py-[2vh] mb-[3vh]'>
            <WhiteHeader />
          </div>
          
          <div className="mb-6">
            <div className="text-white text-lg font-semibold mb-4">내 분석 기록</div>
            <div className="flex flex-wrap gap-2">
              {analysisHistory.map((video) => (
                <button
                  key={video.videoId}
                  onClick={() => handleVideoSelect(video)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    selectedVideo?.videoId === video.videoId 
                      ? 'bg-white text-black' 
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  {video.videoInfo.title.length > 30 
                    ? video.videoInfo.title.substring(0, 30) + '...' 
                    : video.videoInfo.title}
                </button>
              ))}
            </div>
          </div>

          {selectedVideo && (
            <>
              <VideoInfo videoInfo={selectedVideo.videoInfo} />
              
              <div className='mt-6'>
                {selectedVideo.analysisResult.checkpoints.map((checkpoint) => (
                  <ContentModule
                    key={`${checkpoint.timestamp_seconds}-${checkpoint.trigger_keyword}`}
                    checkpoint={checkpoint}
                    interactive={false}
                  />
                ))}
              </div>
            </>
          )}

          {!selectedVideo && analysisHistory.length > 0 && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center text-white">
                <div className="text-lg mb-2">영상을 선택해주세요</div>
                <div className="text-sm opacity-80">위에서 분석 결과를 보고 싶은 영상을 선택하세요</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MyPage;