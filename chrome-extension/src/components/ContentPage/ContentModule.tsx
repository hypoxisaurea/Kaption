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
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-semibold text-gray-800">
                    {checkpoint.timestamp_formatted}
                </div>
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {checkpoint.trigger_keyword}
                </div>
            </div>
            
            <div className="mb-4">
                <h3 className="text-md font-medium text-gray-700 mb-2">발화 내용</h3>
                <p className="text-gray-600 italic">"{checkpoint.segment_stt}"</p>
            </div>
            
            <div className="mb-4">
                <h3 className="text-md font-medium text-gray-700 mb-2">장면 설명</h3>
                <p className="text-gray-600">{checkpoint.scene_description}</p>
            </div>
            
            <div className="mb-4">
                <h3 className="text-md font-medium text-gray-700 mb-2">문화적 맥락</h3>
                <p className="text-gray-600 font-medium">{checkpoint.context_title}</p>
            </div>
            
            <div className="mb-4">
                <h3 className="text-md font-medium text-gray-700 mb-2">요약</h3>
                <p className="text-gray-600">{checkpoint.explanation.summary}</p>
            </div>
            
            <div className="mb-4">
                <h3 className="text-md font-medium text-gray-700 mb-2">상세 설명</h3>
                <p className="text-gray-600">{checkpoint.explanation.main}</p>
            </div>
            
            <div className="mb-4">
                <h3 className="text-md font-medium text-gray-700 mb-2">실용 팁</h3>
                <p className="text-gray-600">{checkpoint.explanation.tip}</p>
            </div>
            
            {checkpoint.related_interests && checkpoint.related_interests.length > 0 && (
                <div>
                    <h3 className="text-md font-medium text-gray-700 mb-2">관련 관심사</h3>
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