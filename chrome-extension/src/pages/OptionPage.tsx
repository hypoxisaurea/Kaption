import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from 'components/Logo';
import Dropdown from 'components/OptionPage/Dropdown';
import Button from 'components/BlackButton';

function OptionPage() {
    const navigate = useNavigate();
    const handleButtonClick = () => {
        navigate('/home');
    };

    const languageLevels = [
        { id: 1, label: 'Beginner' },
        { id: 2, label: 'Intermediate' },
        { id: 3, label: 'Advanced' },
    ];

    return (
        <div className="flex flex-col items-center justify-center h-screen overflow-hidden bg-white">
            <div className="mb-12 w-full h-[10vh] flex items-center justify-center">
                <Link to='/'>
                    <Logo width='17.5%' />
                </Link>
            </div>

            {/* 옵션 그룹 전체를 감싸는 컨테이너 - 너비를 명확하게 지정하고 수평 중앙 정렬을 제거하여 내부 요소가 왼쪽 정렬되도록 함 */}
            {/* 그림처럼 정렬하려면 너비가 고정된 컨테이너가 필요합니다. max-w-sm (480px) 또는 max-w-md (640px)를 사용하면 좋습니다. */}
            <div className="w-full max-w-[80%] px-8"> {/* w-full과 max-w-sm을 함께 사용하여 반응형 너비 설정 */}
                {/* 1. Familiarity 그룹 */}
                <div className="flex flex-col items-start w-full mb-2">
                    <p className='mb-1 font-medium font-spoqa'>Familiarity</p>
                    <Dropdown items={languageLevels} placeholder="" />
                </div>
                
                {/* 2. Language Level 그룹 */}
                <div className="flex flex-col items-start w-full mb-2">
                    <p className='mb-1 font-medium font-spoqa'>Language Level</p>
                    <Dropdown items={languageLevels} placeholder="" />
                </div>
                
                {/* 3. Interests 그룹 */}
                <div className="flex flex-col items-start w-full mb-2">
                    <p className='mb-1 font-medium font-spoqa'>Interests</p>
                    <Dropdown items={languageLevels} placeholder="" />
                </div>
            </div>
            
            <div className="mt-[5vh] w-full max-w-[60%] px-8">
                <Button size="lg" fullWidth bgColor="bg-black" textColor="text-white" onClick={handleButtonClick}>Confirm</Button>
            </div>
        </div>
    )
}

export default OptionPage;