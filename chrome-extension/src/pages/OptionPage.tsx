import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Logo, BlackButton as Button, StarRating } from 'components';
import Dropdown from 'components/OptionPage/Dropdown';
import { fetchAndStoreCurrentVideoInfo } from 'services/chromeVideo';

function OptionPage() {
    const navigate = useNavigate();
    const handleConfirmClick = async () => {
        try {
            const info = await fetchAndStoreCurrentVideoInfo();
            if (!info) {
                alert('이 페이지에서 재생 중인 영상을 찾지 못했습니다.');
                return;
            }
            navigate('/content');
        } catch (error) {
            console.error(error);
            alert('영상 정보를 가져오는 중 오류가 발생했습니다.');
        }
    };

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

    return (
        <div className="flex h-screen flex-col items-center justify-center overflow-hidden bg-white">
            <div className="w-full max-w-[75%] px-8"> {/* w-full과 max-w-sm을 함께 사용하여 반응형 너비 설정 */}
                {/* 1. Familiarity 그룹 */}
                <div className="flex w-full flex-row items-center justify-between mb-5">
                    <p className='mb-2.5 font-medium font-spoqa'>Familiarity</p>
                    <StarRating />
                </div>
                
                {/* 2. Language Level 그룹 */}
                <div className="flex w-full flex-col items-start mb-5">
                    <p className='mb-2.5 font-medium font-spoqa'>Language Level</p>
                    <Dropdown items={languageLevels} placeholder="" />
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