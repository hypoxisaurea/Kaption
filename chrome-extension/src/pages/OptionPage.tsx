import React from 'react';
// import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Logo, BlackButton as Button } from 'components';
import Tag from 'components/OptionPage/Tag';
import StarRating from 'components/OptionPage/StarRating';
import Dropdown from 'components/OptionPage/Dropdown';
import { fetchAndStoreCurrentVideoInfo, analyzeCurrentVideo, saveAnalysisResultToStorage, UserProfilePayload, saveUserProfileToStorage } from 'services/chromeVideo';
import sampleAnalysis from 'assets/data/sample_analysis_result.json';

function OptionPage() {
    const navigate = useNavigate();
    const [familiarity, setFamiliarity] = React.useState<number>(0);
    const [languageLevelId, setLanguageLevelId] = React.useState<number | null>(null);

    const languageLevels = [
        { id: 1, label: 'Beginner' },
        { id: 2, label: 'Intermediate' },
        { id: 3, label: 'Advanced' },
    ];

    // Interests 태그 옵션 및 선택 상태
    const interestOptions = [
        { id: 1, label: 'K-POP' },
        { id: 2, label: 'K-Drama' },
        { id: 3, label: 'Food' },
        { id: 4, label: 'Language' },
        { id: 5, label: 'History' },
        { id: 6, label: 'Humor' },
        { id: 7, label: 'Politics' },
        { id: 8, label: 'Beauty & Fashion' }
    ];
    const [selectedInterests, setSelectedInterests] = React.useState<number[]>([]);
    const toggleInterest = (id: number) => {
        setSelectedInterests((prev) =>
            prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
        );
    };

    const resolveLanguageLevel = (id: number | null): UserProfilePayload['language_level'] | null => {
        if (id === 1) return 'Beginner';
        if (id === 2) return 'Intermediate';
        if (id === 3) return 'Advanced';
        return null;
    };

    const interestLabelById = (id: number) => {
        const item = interestOptions.find(i => i.id === id);
        return item?.label ?? String(id);
    };

    const normalizeInterest = (label: string) => {
        return label
            .toLowerCase()
            .replace(/\s*&\s*/g, '-')
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9\-]/g, '');
    };

    const handleConfirmClick = async () => {
        try {
            const language = resolveLanguageLevel(languageLevelId);
            if (!familiarity || !language) {
                alert('Familiarity와 Language Level을 선택해 주세요.');
                return;
            }

            // 로딩 페이지로 이동 후 비동기 처리 수행
            navigate('/loading');

            const info = await fetchAndStoreCurrentVideoInfo();

            const interests = selectedInterests.map(id => normalizeInterest(interestLabelById(id)));

            const profile: UserProfilePayload = {
                familiarity,
                language_level: language,
                interests,
            };

            // 사용자 프로필 저장
            await saveUserProfileToStorage(profile);

            console.groupCollapsed('[OptionPage] Analyze Submit');
            console.log('video_url', info?.url);
            console.log('profile', profile);
            console.groupEnd();

            if (!info) {
                console.warn('[OptionPage] 영상 정보를 찾지 못해 더미 데이터로 이동합니다.');
                await saveAnalysisResultToStorage(sampleAnalysis as any);
                navigate('/content');
                return;
            }

            try {
                const result = await analyzeCurrentVideo(info.url, profile);
                await saveAnalysisResultToStorage(result);
                navigate('/content');
            } catch (e) {
                console.error('[OptionPage] Analyze 실패, 더미 데이터로 대체합니다.', e);
                await saveAnalysisResultToStorage(sampleAnalysis as any);
                navigate('/content');
            }
        } catch (error) {
            console.error(error);
            // 네트워크 등 상위 오류 시에도 더미 데이터로 이동
            await saveAnalysisResultToStorage(sampleAnalysis as any);
            navigate('/content');
        }
    };
    
    // 별점 변경을 처리하는 새로운 핸들러 함수 추가
    const handleStarRatingChange = (newValue: number | null) => {
        // null을 안전하게 number로 변환하여 상태 업데이트
        setFamiliarity(newValue ?? 0);
    };

    return (
        <div className="flex h-screen flex-col items-center justify-center overflow-hidden bg-white">
            <div className="w-full max-w-[75%] px-8"> {/* w-full과 max-w-sm을 함께 사용하여 반응형 너비 설정 */}
                {/* 1. Familiarity 그룹 */}
                <div className="flex w-full flex-row items-center justify-between mb-5">
                    <p className='mb-2.5 font-medium font-spoqa'>Familiarity</p>
                    {/* 명확하게 정의된 핸들러 함수를 전달 */}
                    <StarRating value={familiarity} onChange={handleStarRatingChange} />
                </div>
                
                {/* 2. Language Level 그룹 */}
                <div className="flex w-full flex-col items-start mb-5">
                    <p className='mb-2.5 font-medium font-spoqa'>Language Level</p>
                    <Dropdown
                        items={languageLevels}
                        value={languageLevelId}
                        onChange={(id) => setLanguageLevelId(id)}
                    />
                </div>
                
                {/* 3. Interests 그룹 */}
                <div className="flex w-full flex-col items-start">
                    <p className='mb-2.5 font-medium font-spoqa'>Interests</p>
                    <Tag items={interestOptions} value={selectedInterests} onChange={setSelectedInterests} />
                </div>
            </div>
            
            <div className="mt-[12vh] w-full max-w-[50%] px-8">
                <Button fullWidth bgColor="bg-black" textColor="text-white"  className="text-sm" onClick={handleConfirmClick} >Confirm</Button>
            </div>
        </div>
    )
}

export default OptionPage;