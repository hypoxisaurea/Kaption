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
        {/* Fullscreen Panel */}
        <div className={`absolute w-full h-screen inset-0 bg-white font-spoqa flex flex-col overflow-hidden modal-panel modal-panel--open`}>
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-[4vw] mt-[5vh] mb-[3vh]">
            <img
              src={closeButton}
              onClick={onClose}
              className="w-[5vw] h-auto"
              alt="Close"
            />
          </div>

          {/* Content */}
          <div className="flex-1 px-[4vw] py-[2vh]">
            <div className="w-full min-h-full bg-white rounded-none px-[4vw] py-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
              {/* 비디오 정보 */}
              <div className="mb-[3vh]">
                <VideoInfo videoInfo={video.videoInfo} />
              </div>

              {/* 체크포인트 목록 (비인터랙티브) */}
              <div className="mt-6">
                {video.analysisResult.checkpoints.map((checkpoint: any) => (
                  <ContentModule
                    key={`${checkpoint.timestamp_seconds}-${checkpoint.trigger_keyword}`}
                    checkpoint={checkpoint}
                    interactive={false}
                  />
                ))}
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