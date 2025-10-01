import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import closeButton from 'assets/images/icon/button_close.png'
import { ContentModule, VideoInfo } from 'components/common'

interface SavingModalProps {
  video: any
  onClose: () => void
}

/**
 * SavingModal - 선택된 영상의 분석 결과를 전체 화면으로 표시하는 모달
 * DeepDiveModal과 유사한 여백 및 전체 화면 레이아웃 유지
 */
function SavingModal({ video, onClose }: SavingModalProps) {
  // ESC로 닫기 및 스크롤 잠금 처리
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown)
    const prevHtml = document.documentElement.style.overflow
    const prevBody = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.documentElement.style.overflow = prevHtml
      document.body.style.overflow = prevBody
    }
  }, [onClose])

  if (!video) return null

  return createPortal(
    (
      <div className="fixed w-full h-screen inset-0 z-50">
        {/* Fullscreen Panel (ContentPage 배경과 동일 톤) */}
        <div className={`absolute w-full h-screen inset-0 bg-[#1b1b1b] font-spoqa flex flex-col overflow-hidden modal-panel modal-panel--open`}>
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-[4vw] mt-[5vh] mb-[3vh]">
            <img
              src={closeButton}
              onClick={onClose}
              className="w-[5vw] h-auto"
              alt="Close"
            />
          </div>

          {/* Content: ContentPage와 동일한 센터링/폭 제약 적용 */}
          <div className="flex-1 overflow-y-auto">
            <div className='w-full box-border flex justify-center px-[5vw] py-[2vh] overflow-x-hidden'>
              <div className='w-full min-w-0 max-w-md sm:max-w-lg lg:max-w-2xl'>
                <VideoInfo videoInfo={video.videoInfo} />
                <div className='mt-6'>
                  {video.analysisResult.checkpoints.map((checkpoint: any, index: number) => (
                    <ContentModule
                      key={`${checkpoint.timestamp_seconds}-${index}`}
                      checkpoint={checkpoint}
                      interactive={false}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    document.body
  )
}

export default SavingModal