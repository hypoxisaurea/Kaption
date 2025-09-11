// src/components/LandingPage/BlackButton.tsx

import React, { ReactNode } from 'react';

// children prop의 타입을 ReactNode로 정의하여 다양한 요소를 전달할 수 있게 함
interface ButtonProps {
    bgColor: string;   // 예시: 'bg-primary'
    textColor: string; // 예시: 'text-white'
    children: ReactNode;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

function BlackButton({ bgColor, textColor, children, onClick }: ButtonProps) {
    return (
        <button
            className={`flex items-center justify-center px-[15vw] py-[0.85vh] border-0 rounded-full font-spoqa font-normal ${bgColor} ${textColor}`}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

export default BlackButton;