import React from 'react'

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
}

function ContentModule({ checkpoint }: ContentModuleProps) {
    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-10">
            <div className="flex items-center justify-between mb-[6vh]">
                <div className="text-[1rem] font-bold text-black">
                    {checkpoint.timestamp_formatted}
                </div>
                <div className="border-2 bg-[#2EC4B6]/45 text-black px-3 py-1 rounded-full text-sm font-medium">
                    {checkpoint.trigger_keyword}
                </div>
            </div>
            
            <div className="mb-[3vh]">
                <p className="text-[1.2rem] text-[#1b1b1b] font-spoqa font-bold">{checkpoint.context_title}</p>
            </div>

            <div className="mb-[6vh]">
                <p className="text-gray-600">{checkpoint.explanation.main}</p>
            </div>
            
            <div className="mb-[6vh]">
                <h3 className="text-[1rem] font-medium text-gray-700">tip!</h3>
                <p className="text-gray-600">{checkpoint.explanation.tip}</p>
            </div>
            
            {checkpoint.related_interests && checkpoint.related_interests.length > 0 && (
                <div>
                    <div className="flex flex-wrap gap-2">
                        {checkpoint.related_interests.map((interest, index) => (
                            <span 
                                key={index}
                                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                            >
                                {interest}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default ContentModule;