import React, { useEffect, useState } from 'react'
import { VideoAnalysisHistory, getAllVideoAnalysisHistory, deleteVideoAnalysisHistory } from 'services/chromeVideo'
import { ContentModule } from 'components/MyPage'
import VideoInfo from 'components/MyPage/VideoInfo'
import Header from 'components/common/WhiteHeader'

function MyPage() {
  const [analysisHistory, setAnalysisHistory] = useState<VideoAnalysisHistory[]>([])
  const [selectedVideo, setSelectedVideo] = useState<VideoAnalysisHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAnalysisHistory()
  }, [])

  const loadAnalysisHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      const history = await getAllVideoAnalysisHistory()
      setAnalysisHistory(history)
    } catch (e) {
      setError('분석 기록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleVideoSelect = (video: VideoAnalysisHistory) => {
    setSelectedVideo(video)
  }

  const handleVideoDelete = async (videoId: string) => {
    try {
      await deleteVideoAnalysisHistory(videoId)
      setAnalysisHistory(prev => prev.filter(video => video.videoId !== videoId))
      if (selectedVideo?.videoId === videoId) {
        setSelectedVideo(null)
      }
    } catch (e) {
      setError('분석 기록을 삭제하는데 실패했습니다.')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#1b1b1b] overflow-x-hidden hide-scrollbar">
        <div className='w-full box-border flex justify-center px-[5vw] py-[2vh] overflow-x-hidden'>
          <div className='w-full min-w-0 max-w-md sm:max-w-lg lg:max-w-2xl'>
            <div className='py-[2vh] mb-[3vh]'>
              <Header />
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
              <Header />
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
              <Header />
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
            <Header />
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