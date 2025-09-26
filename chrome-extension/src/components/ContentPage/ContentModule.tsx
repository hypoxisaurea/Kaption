import React from 'react'
import HoverOverlay from './HoverOverlay'
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
}

function ContentModule({ checkpoint, onClick, isLoading = false }: ContentModuleProps) {
    const { expandState } = usePageTransition();
    
    const handleClick = () => {
        if (onClick) {
            onClick(checkpoint);
        }
    };

    const getCardClass = () => {
        const baseClass = "relative bg-white font-spoqa rounded-[3.5vw] px-[6vw] py-[7vw] mb-10";
        
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
            <div id={`checkpoint-${checkpoint.timestamp_seconds}-${checkpoint.trigger_keyword}`} className={getCardClass()}>
            <div className="mb-[6vh] flex items-start justify-between">
                <div className="text-[1rem] font-bold text-[#1b1b1b]">
                    {checkpoint.timestamp_formatted}
                </div>
                <div className="max-w-[30vw] item-center rounded-[4.5vw] bg-secondary/45 px-[4.5vw] py-[0.8vh] text-[0.8rem] text-end" style={{ whiteSpace: 'pre-line' }}>
                        {formattedKeyword}
                </div>
            </div>
            
            <div className="mb-[3vh]">
                <p className="text-[1.1rem] font-bold text-[#1b1b1b]">{checkpoint.context_title}</p>
            </div>

            <div className="mb-[6vh]">
                <p className="text-[0.9rem] font-light leading-relaxed text-[#1b1b1b]">{checkpoint.explanation.main}</p>
            </div>
            
            <div className="mb-[4vh]">
                <h3 className="text-[0.95rem] font-normal text-[#1b1b1b]">Tip!</h3>
                <p className="text-[0.9rem] font-light leading-relaxed text-[#1b1b1b]">{checkpoint.explanation.tip}</p>
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
                <div className="absolute inset-0 flex items-center justify-center rounded-[3.5vw] bg-white/70 backdrop-blur-[1px]">
                    <div className="flex flex-col items-center gap-2">
                        <div className="size-8 rounded-full border-2 border-gray-300 border-t-black animate-spin"></div>
                        <div className="text-[0.85rem] text-[#1b1b1b]">Preparing your study pack…</div>
                    </div>
                </div>
            )}
            </div>
        </HoverOverlay>
    )
}

export default ContentModule;