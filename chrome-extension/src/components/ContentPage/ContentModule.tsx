import React from 'react'
import HoverOverlay from './HoverOverlay'

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

interface ContentModuleProps {
    checkpoint: Checkpoint;
    onClick?: (checkpoint: Checkpoint) => void;
}

function ContentModule({ checkpoint, onClick }: ContentModuleProps) {
    const handleClick = () => {
        if (onClick) {
            onClick(checkpoint);
        }
    };

    return (
        <HoverOverlay 
            onClick={handleClick}
        >
            <div className="bg-white font-spoqa rounded-[3.5vw] px-[6vw] py-[7vw] mb-10">
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

            <div className="mb-[6vh]">
                <p className="text-[#1b1b1b] text-[0.9rem] font-light leading-relaxed">{checkpoint.explanation.main}</p>
            </div>
            
            <div className="mb-[4vh]">
                <h3 className="text-[0.95rem] font-medium text-[#1b1b1b]">tip!</h3>
                <p className="text-[#1b1b1b] text-[0.9rem] font-light leading-relaxed">{checkpoint.explanation.tip}</p>
            </div>
            
            {checkpoint.related_interests && checkpoint.related_interests.length > 0 && (
                <div>
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
        </HoverOverlay>
    )
}

export default ContentModule;