import React, { useEffect, useState } from 'react'
import HoverOverlay from './HoverOverlay'
import Spinner from './Spinner'
import usePageTransition from 'hooks/usePageTransition'

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
    isLoading?: boolean;
    appearDelayMs?: number;
}

function ContentModule({ checkpoint, onClick, isLoading = false, appearDelayMs = 0 }: ContentModuleProps) {
    const { expandState } = usePageTransition();
    const [isShown, setIsShown] = useState(false);

    useEffect(() => {
        const id = window.setTimeout(() => setIsShown(true), Math.max(0, appearDelayMs));
        return () => {
            window.clearTimeout(id);
        };
    }, [appearDelayMs]);
    
    const handleClick = () => {
        if (onClick) {
            onClick(checkpoint);
        }
    };

    const getCardClass = () => {
        const baseClass = "relative bg-white font-spoqa rounded-[3.5vw] px-[5vw] py-[4vh] mb-10";
        
        switch (expandState) {
            case 'fullscreen':
                return `${baseClass} card-expand-transition card-expand-fullscreen`;
            default:
                return `${baseClass} card-expand-transition card-expand-start`;
        }
    };

    const formattedKeyword = checkpoint.trigger_keyword.includes('/')
    ? checkpoint.trigger_keyword.replace('/', '\n')
    : checkpoint.trigger_keyword;

    return (
        <HoverOverlay 
            onClick={handleClick}
            disabled={isLoading}
        >
            <div
                id={`checkpoint-${checkpoint.timestamp_seconds}-${checkpoint.trigger_keyword}`}
                className={`${getCardClass()} transition-all duration-700 ease-out will-change-transform ${isShown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            >
            <div className="mb-[6vh] flex items-start justify-between">
                <div className="text-[1rem] font-bold text-[#1b1b1b]">
                    {checkpoint.timestamp_formatted}
                </div>
                <div className="max-w-[30vw] item-center rounded-[4vw] bg-secondary/45 px-[4vw] py-[0.75vh] text-[0.75rem] text-end" style={{ whiteSpace: 'pre-line' }}>
                        {formattedKeyword}
                </div>
            </div>
            
            <div className="mb-[3vh]">
                <p className="text-[1.05rem] font-bold text-[#1b1b1b]">{checkpoint.context_title}</p>
            </div>

            <div className="mb-[6vh]">
                <p className="text-[0.85rem] font-light leading-relaxed text-[#1b1b1b]">{checkpoint.explanation.main}</p>
            </div>
            
            <div className="mb-[4vh]">
                <h3 className="text-[0.95rem] font-normal text-[#1b1b1b]">Tip!</h3>
                <p className="text-[0.85rem] font-light leading-relaxed text-[#1b1b1b]">{checkpoint.explanation.tip}</p>
            </div>
            
            {checkpoint.related_interests && checkpoint.related_interests.length > 0 && (
                <div>
                    <div className="flex flex-wrap gap-2">
                        {checkpoint.related_interests.map((interest, index) => (
                            <span 
                                key={index}
                                className="rounded-[3.5vw] bg-[#f4f4f4] px-[3vw] py-[0.6vh] text-[0.75rem] font-light text-[#1b1b1b]"
                            >
                                {interest}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-[3.5vw] bg-white/70 backdrop-blur-[0.4vw]">
                    <div className="flex flex-col items-center gap-2">
                        <Spinner />
                        <div className="text-[0.85rem] text-[#1b1b1b]">Preparing your study pack…</div>
                    </div>
                </div>
            )}
            </div>
        </HoverOverlay>
    )
}

export default ContentModule;