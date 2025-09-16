import React, { ReactNode } from 'react';

// children prop의 타입을 ReactNode로 정의하여 다양한 요소를 전달할 수 있게 함
interface SloganProps {
    children: ReactNode;
}

function Slogan({children}: SloganProps) {
    return (
        <div className='flex flex-col items-center justify-center'>
            <div className='font-light tracking-tighter text-text-dark font-spoqa'>{children}</div>
        </div>
    )
}

export default Slogan;