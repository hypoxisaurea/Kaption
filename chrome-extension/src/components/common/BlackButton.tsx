// src/components/LandingPage/BlackButton.tsx

import React, { ReactNode } from 'react';

// children prop의 타입을 ReactNode로 정의하여 다양한 요소를 전달할 수 있게 함
interface ButtonProps {
    bgColor: string;   // 예시: 'bg-primary'
    textColor: string; // 예시: 'text-white'
    children: ReactNode;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    fullWidth?: boolean;
    size?: 'sm' | 'md' | 'lg';
    paddingX?: string | number; // '16px', '2rem', '10vw' 등 CSS 길이
    paddingY?: string | number; // '12px', '1vh' 등 CSS 길이
    width?: string | number;    // 직접 너비 지정
    height?: string | number;   // 직접 높이 지정
    className?: string;         // Tailwind 클래스 추가 용도
    style?: React.CSSProperties; // 추가 인라인 스타일
}

function BlackButton({ bgColor, textColor, children, onClick, fullWidth, size = 'sm', paddingX, paddingY, width, height, className = '', style }: ButtonProps) {
    const defaultPY = size === 'lg' ? '1.6vh' : size === 'sm' ? '0.6vh' : '0.85vh';
    const inlineStyle: React.CSSProperties = {
        width: fullWidth ? '100%' : width,
        height,
        paddingLeft: paddingX !== undefined ? String(paddingX) : undefined,
        paddingRight: paddingX !== undefined ? String(paddingX) : undefined,
        paddingTop: paddingY !== undefined ? String(paddingY) : defaultPY,
        paddingBottom: paddingY !== undefined ? String(paddingY) : defaultPY,
        ...style,
    };
    return (
        <button
            className={`font-spoqa flex items-center justify-center rounded-full border-0 font-normal ${bgColor} ${textColor} ${className}`}
            style={inlineStyle}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

export default BlackButton;