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
<<<<<<< HEAD
        <div className="bg-white rounded-lg shadow-md p-6 mb-10">
            <div className="flex items-center justify-between mb-[6vh]">
                <div className="text-[1.3rem] font-semibold text-black">
                    {checkpoint.timestamp_formatted}
                </div>
                <div className="border-2 border-gradient-to-br from-[#FF8C7A]/45 to-[#2EC4B6]/45 text-black px-3 py-1 rounded-full text-sm font-medium">
=======
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
            <div className="flex items-center justify-between mb-[10vh]">
                <div className="text-[1.5rem] font-spoqa font-semibold text-[#000000]">
                    {checkpoint.timestamp_formatted}
                </div>
                <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-[1rem] font-spoqa font-regular">
>>>>>>> 31a7e28 ([STYLE] change content modul design)
                    {checkpoint.trigger_keyword}
                </div>
            </div>
            
<<<<<<< HEAD
            <div className="mb-[5vh]">
                <p className="text-[1.2rem] text-[#1b1b1b] font-semibold">{checkpoint.context_title}</p>
            </div>
            
            {/* <div className="mb-4">
                <h3 className="text-md font-medium text-gray-700 mb-2">요약</h3>
                <p className="text-gray-600">{checkpoint.explanation.summary}</p>
            </div>
             */}
            <div className="mb-4">
                <h3 className="text-[1rem] font-medium text-gray-700 mb-2">상세 설명</h3>
                <p className="text-gray-600">{checkpoint.explanation.main}</p>
            </div>
            
            <div className="mb-4">
                <h3 className="text-[1rem] font-medium text-gray-700 mb-2">실용 팁</h3>
                <p className="text-gray-600">{checkpoint.explanation.tip}</p>
=======
            <div className="mb-10">
                <h3 className="text-[1rem] font-spoqa font-regular text-[#444444]">CONTEXT</h3>
                <p className="text-[#444444] font-spoqa font-light">{checkpoint.context_title}</p>
            </div>
            
            <div className="mb-10">
                <h3 className="text-[1rem] font-spoqa font-regular text-[#444444]">DESCRIPTION</h3>
                <p className="text-[#444444] font-spoqa font-light">{checkpoint.explanation.main}</p>
            </div>
            
            <div className="mb-10">
                <h3 className="text-[1rem] font-spoqa font-regular text-[#444444]">TIPS</h3>
                <p className="text-[#444444] font-spoqa font-light">{checkpoint.explanation.tip}</p>
>>>>>>> 31a7e28 ([STYLE] change content modul design)
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