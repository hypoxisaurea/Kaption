import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Logo, BlackButton as Button, StarRating } from 'components';
import Dropdown from 'components/OptionPage/Dropdown';
import { fetchAndStoreCurrentVideoInfo, analyzeCurrentVideo, saveAnalysisResultToStorage, UserProfilePayload } from 'services/chromeVideo';

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
            const info = await fetchAndStoreCurrentVideoInfo();
            if (!info) {
                alert('이 페이지에서 재생 중인 영상을 찾지 못했습니다.');
                return;
            }

            const language = resolveLanguageLevel(languageLevelId);
            if (!familiarity || !language) {
                alert('Familiarity와 Language Level을 선택해 주세요.');
                return;
            }

            const interests = selectedInterests.map(id => normalizeInterest(interestLabelById(id)));

            const profile: UserProfilePayload = {
                familiarity,
                language_level: language,
                interests,
            };

            console.groupCollapsed('[OptionPage] Analyze Submit');
            console.log('video_url', info.url);
            console.log('profile', profile);
            console.groupEnd();

            const result = await analyzeCurrentVideo(info.url, profile);
            await saveAnalysisResultToStorage(result);
            navigate('/content');
        } catch (error) {
            console.error(error);
            alert('영상 분석 중 오류가 발생했습니다. 백엔드 서버가 실행 중인지 확인해 주세요.');
        }
    };

    return (
        <div className="flex h-screen flex-col items-center justify-center overflow-hidden bg-white">
            <div className="w-full max-w-[75%] px-8"> {/* w-full과 max-w-sm을 함께 사용하여 반응형 너비 설정 */}
                {/* 1. Familiarity 그룹 */}
                <div className="flex w-full flex-row items-center justify-between mb-5">
                    <p className='mb-2.5 font-medium font-spoqa'>Familiarity</p>
                    <StarRating value={familiarity} onChange={setFamiliarity} />
                </div>
                
                {/* 2. Language Level 그룹 */}
                <div className="flex w-full flex-col items-start mb-5">
                    <p className='mb-2.5 font-medium font-spoqa'>Language Level</p>
                    <Dropdown
                        items={languageLevels}
                        placeholder=""
                        value={languageLevelId}
                        onChange={(id) => setLanguageLevelId(id)}
                    />
                </div>
                
                {/* 3. Interests 그룹 */}
                <div className="flex w-full flex-col items-start">
                    <p className='mb-2.5 font-medium font-spoqa'>Interests</p>
                    <div className="flex w-full flex-wrap gap-2">
                        {interestOptions.map((item) => {
                            const isSelected = selectedInterests.includes(item.id);
                            return (
                                <motion.button
                                    key={item.id}
                                    type="button"
                                    onClick={() => toggleInterest(item.id)}
                                    className={`rounded-[2.5vw] px-3 py-1 text-sm font-spoqa transition-colors border-0 outline-none ring-0 focus:outline-none focus:ring-0 active:outline-none ${
                                        isSelected
                                            ? 'bg-black text-white'
                                            : 'bg-gray-100 text-gray-700'
                                    }`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.97 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                                    aria-pressed={isSelected}
                                >
                                    {item.label}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </div>
            
            <div className="mt-[12vh] w-full max-w-[50%] px-8">
                <Button fullWidth bgColor="bg-black" textColor="text-white"  className="text-sm" onClick={handleConfirmClick} >Confirm</Button>
            </div>
        </div>
    )
}

export default OptionPage;