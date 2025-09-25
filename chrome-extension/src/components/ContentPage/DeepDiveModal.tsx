import React, { useEffect } from 'react';
import HoverOverlay from './HoverOverlay';

interface Explanation {
  summary: string;
  main: string;
  tip: string;
}

interface Checkpoint {
  timestamp_seconds: number;
  timestamp_formatted: string;
  trigger_keyword: string;
  segment_stt: string;
  scene_description: string;
  context_title: string;
  explanation: Explanation;
  related_interests?: string[];
}

interface DeepDiveModalProps {
  checkpoint: Checkpoint;
  onClose: () => void;
}

function DeepDiveModal({ checkpoint, onClose }: DeepDiveModalProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className={`absolute inset-0 bg-[#1b1b1b]/70 modal-backdrop modal-backdrop--open`} onClick={onClose} />

      {/* Fullscreen Panel */}
      <div className={`absolute inset-0 bg-white font-spoqa overflow-y-auto modal-panel modal-panel--open`}>
        {/* Header (sticky) */}
        <div className="sticky top-0 z-[1] flex justify-end bg-white/90 backdrop-blur px-4 py-3">
          <button
            onClick={onClose}
            className="text-[#1b1b1b] text-[0.95rem] px-3 py-1 rounded hover:bg-black/5 transition-colors"
          >
            닫기 ✕
          </button>
        </div>

        {/* Content */}
        <div className="px-[6vw] py-[5vw]">
          {/* Header */}
          <div className="flex items-start justify-between mb-[6vh]">
            <div className="text-[1rem] font-bold text-[#1b1b1b]">
              {checkpoint.timestamp_formatted}
            </div>
            <div className="max-w-[30vw] border-2 bg-[#2EC4B6]/45 px-[3vw] py-[0.6vh] rounded-full text-[0.8rem] font-medium">
              {checkpoint.trigger_keyword}
            </div>
          </div>

          {/* Title */}
          <div className="mb-[3vh]">
            <p className="text-[1.2rem] text-[#1b1b1b] font-bold">{checkpoint.context_title}</p>
          </div>

          {/* Sections */}
          <div className="mb-[4vh]">
            <h3 className="text-[0.95rem] font-medium text-[#1b1b1b] mb-2">발화 내용</h3>
            <p className="text-[#1b1b1b] text-[0.9rem] font-light leading-relaxed">{checkpoint.segment_stt}</p>
          </div>

          <div className="mb-[4vh]">
            <h3 className="text-[0.95rem] font-medium text-[#1b1b1b] mb-2">장면 설명</h3>
            <p className="text-[#1b1b1b] text-[0.9rem] font-light leading-relaxed">{checkpoint.scene_description}</p>
          </div>

          <div className="mb-[6vh]">
            <h3 className="text-[0.95rem] font-medium text-[#1b1b1b] mb-2">상세 설명</h3>
            <p className="text-[#1b1b1b] text-[0.9rem] font-light leading-relaxed">{checkpoint.explanation.main}</p>
          </div>

          <div className="mb-[4vh]">
            <h3 className="text-[0.95rem] font-medium text-[#1b1b1b]">tip!</h3>
            <p className="text-[#1b1b1b] text-[0.9rem] font-light leading-relaxed">{checkpoint.explanation.tip}</p>
          </div>

          {checkpoint.related_interests && checkpoint.related_interests.length > 0 && (
            <div>
              <h3 className="text-[0.95rem] font-medium text-[#1b1b1b] mb-2">관련 관심사</h3>
              <div className="flex flex-wrap gap-2">
                {checkpoint.related_interests.map((interest, index) => (
                  <span
                    key={index}
                    className="bg-[#f4f4f4] text-[#1b1b1b] px-[3vw] py-[0.6vh] rounded-[3.5vw] text-[0.75rem] font-light"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeepDiveModal;


