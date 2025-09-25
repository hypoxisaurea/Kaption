import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import HoverOverlay from 'components/ContentPage/HoverOverlay';
import useFadeIn from 'hooks/useFadeIn';

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

function DeepDivePage() {
    const { checkpointId } = useParams<{ checkpointId: string }>();
    const navigate = useNavigate();
    const isVisible = useFadeIn();

    // 실제로는 체크포인트 ID를 기반으로 데이터를 가져와야 함
    // 현재는 임시 데이터 사용
    const checkpoint: Checkpoint = {
        timestamp_seconds: 0,
        timestamp_formatted: "00:00",
        trigger_keyword: "샘플 키워드",
        segment_stt: "샘플 발화 내용",
        scene_description: "샘플 장면 설명",
        context_title: "샘플 문화적 맥락",
        explanation: {
            summary: "샘플 요약",
            main: "샘플 상세 설명",
            tip: "샘플 실용 팁"
        },
        related_interests: ["관심사1", "관심사2"]
    };

    const handleBackClick = () => {
        navigate('/content');
    };

    return (
        <div
            className={`w-full bg-[#1b1b1b] overflow-x-hidden hide-scrollbar transition-opacity duration-[350ms] ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{
                willChange: 'opacity'
            }}
        >
            <div className='w-full box-border flex justify-center px-10 py-4 overflow-x-hidden'>
                <div className='w-full min-w-0 max-w-md sm:max-w-lg lg:max-w-2xl'>
                    {/* 뒤로가기 버튼 */}
                    <HoverOverlay 
                        onClick={handleBackClick}
                        className="mb-6"
                    >
                        <div className="bg-white font-spoqa rounded-[3.5vw] px-[6vw] py-[4vw] cursor-pointer">
                            <div className="text-[1rem] font-medium text-[#1b1b1b]">
                                ← 뒤로가기
                            </div>
                        </div>
                    </HoverOverlay>

                    {/* 체크포인트 상세 내용 */}
                    <div className="bg-white font-spoqa rounded-[3.5vw] px-[6vw] py-[7vw]">
                        <div className="flex items-start justify-between mb-[6vh]">
                            <div className="text-[1rem] font-bold text-[#1b1b1b]">
                                {checkpoint.timestamp_formatted}
                            </div>
                            <div className="max-w-[30vw] border-2 bg-[#2EC4B6]/45 px-[3vw] py-[0.6vh] rounded-full text-[0.8rem] font-regular">
                                {checkpoint.trigger_keyword}
                            </div>
                        </div>
                        
                        <div className="mb-[3vh]">
                            <p className="text-[1.2rem] text-[#1b1b1b] font-bold">{checkpoint.context_title}</p>
                        </div>

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
        </div>
    );
}

export default DeepDivePage;
