import React from 'react'
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo'
import Dropdown from '../components/OptionPage/Dropdown';
import Button from '../components/BlackButton';

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
        <div className="flex flex-col items-center justify-center h-screen overflow-hidden bg-white align-vertical">
            <Logo width='12%'/>
            <div>
                {/* 1. 옵션 그룹 전체를 감싸는 컨테이너 */}
                <div className="flex flex-col items-center w-screen mb-8 space-y-4">
                    {/* 2. 각 행의 컨테이너를 flex-row로 설정 */}
                    <div className="flex flex-col items-start">
                        <div className="w-40"> {/* 텍스트를 담을 고정 너비 컨테이너 */}
                            <p className='font-medium font-spoqa'>Familiarity</p>
                        </div>
                        <Dropdown items={languageLevels} placeholder="" />
                    </div>
                    <div className="flex flex-col items-start">
                        <div className="w-40">
                            <p className='font-medium font-spoqa'>Language Level</p>
                        </div>
                        <Dropdown items={languageLevels} placeholder="" />
                    </div>
                    <div className="flex flex-col items-start">
                        <div className="w-40">
                            <p className='font-medium font-spoqa'>Interests</p>
                        </div>
                        <Dropdown items={languageLevels} placeholder="" />
                    </div>
                </div>
            </div>
                <Button bgColor="bg-black" textColor="text-white" onClick={handleButtonClick}>Confirm</Button>
        </div>
    )
}

export default OptionPage;