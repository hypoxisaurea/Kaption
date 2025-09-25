import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { VideoInfo } from 'components';
import ContentModule from 'components/ContentPage/ContentModule';
import useFadeIn from 'hooks/useFadeIn';
import { AnalyzeResponse, fetchAndStoreCurrentVideoInfo, analyzeCurrentVideo } from 'services/chromeVideo';
import sampleAnalysis from 'assets/data/sample_analysis_result.json';


function ContentPage() {
    const isVisible = useFadeIn();
    const navigate = useNavigate();
    const [analysisData, setAnalysisData] = useState<AnalyzeResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCheckpointClick = (checkpoint: any) => {
        // 체크포인트 ID를 기반으로 상세 페이지로 이동
        const checkpointId = `${checkpoint.timestamp_seconds}-${checkpoint.trigger_keyword}`;
        navigate(`/deepdive/${encodeURIComponent(checkpointId)}`);
    };

    useEffect(() => {
        const loadAnalysisData = async () => {
            try {
                setLoading(true);
                setError(null);

                // 현재 YouTube 탭에서 비디오 정보 가져오기 (없어도 진행)
                const videoInfo = await fetchAndStoreCurrentVideoInfo();
                if (!videoInfo) {
                    console.warn('[ContentPage] 활성 YouTube 비디오를 찾지 못했습니다. 샘플 데이터로 진행합니다.');
                    setAnalysisData(sampleAnalysis as AnalyzeResponse);
                    setError(null);
                    return;
                }

                // 사용자 프로필 (임시 데이터 - 실제로는 사용자 설정에서 가져와야 함)
                const userProfile = {
                    familiarity: 3,
                    language_level: "Intermediate" as const,
                    interests: ["k-drama", "social culture"]
                };

                // 서버에서 분석 결과 가져오기
                const result = videoInfo
                    ? await analyzeCurrentVideo(videoInfo.url, userProfile)
                    : null;
                
                // 분석 결과 콘솔에 출력
                console.groupCollapsed('[ContentPage] 분석 결과 받음');
                console.log('전체 응답:', result);
                console.log('비디오 정보:', result?.video_info);
                console.log('체크포인트 개수:', result?.checkpoints?.length || 0);
                
                if (result && result.checkpoints && result.checkpoints.length > 0) {
                    console.group('체크포인트 상세 내용:');
                    result.checkpoints.forEach((checkpoint, index) => {
                        console.group(`체크포인트 ${index + 1}:`);
                        console.log('타임스탬프:', checkpoint.timestamp_formatted);
                        console.log('트리거 키워드:', checkpoint.trigger_keyword);
                        console.log('발화 내용:', checkpoint.segment_stt);
                        console.log('장면 설명:', checkpoint.scene_description);
                        console.log('문화적 맥락:', checkpoint.context_title);
                        console.log('설명 요약:', checkpoint.explanation.summary);
                        console.log('상세 설명:', checkpoint.explanation.main);
                        console.log('실용 팁:', checkpoint.explanation.tip);
                        console.log('관련 관심사:', checkpoint.related_interests);
                        console.log('전체 객체:', checkpoint);
                        console.groupEnd();
                    });
                    console.groupEnd();
                }
                console.groupEnd();
                
                if (result) {
                    setAnalysisData(result as AnalyzeResponse);
                } else {
                    console.warn('[ContentPage] 서버 응답이 없어 더미 데이터를 사용합니다.');
                    setAnalysisData(sampleAnalysis as AnalyzeResponse);
                }

            } catch (err) {
                console.error('분석 데이터 로딩 실패:', err);
                console.warn('[ContentPage] 오류 발생으로 더미 데이터를 사용합니다.');
                setAnalysisData(sampleAnalysis as AnalyzeResponse);
                setError(null);
            } finally {
                setLoading(false);
            }
        };

        loadAnalysisData();
    }, []);

    return (
        <div
            className={`w-full bg-[#1b1b1b] overflow-x-hidden hide-scrollbar transition-opacity duration-[350ms] ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{
                willChange: 'opacity'
            }}
        >
            <div className='w-full box-border flex justify-center px-10 py-4 overflow-x-hidden'>
                <div className='w-full min-w-0 max-w-md sm:max-w-lg lg:max-w-2xl'>
                    <VideoInfo />
                    
                    {loading && (
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-3 text-gray-600">분석 중...</span>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <div className="text-red-800 font-medium">오류 발생</div>
                            <div className="text-red-700 text-sm mt-1">{error}</div>
                        </div>
                    )}

                    {analysisData && analysisData.checkpoints && (
                        <div className="mt-6">
                            {analysisData.checkpoints.map((checkpoint, index) => (
                                <ContentModule 
                                    key={`${checkpoint.timestamp_seconds}-${index}`}
                                    checkpoint={checkpoint}
                                    onClick={handleCheckpointClick}
                                />
                            ))}
                        </div>
                    )}

                    {analysisData && (!analysisData.checkpoints || analysisData.checkpoints.length === 0) && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                            <div className="text-yellow-800 font-medium">분석 결과 없음</div>
                            <div className="text-yellow-700 text-sm mt-1">
                                이 비디오에서 분석할 문화적 맥락을 찾을 수 없습니다.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ContentPage;