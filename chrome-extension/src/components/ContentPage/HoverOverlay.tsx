import React from 'react';
import DeepDive from 'assets/images/icon/deepdive_black.png'

interface HoverOverlayProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
}

function HoverOverlay({ 
    children, 
    onClick, 
    className = '',
    disabled = false
}: HoverOverlayProps) {
    const handleClick = () => {
        if (!disabled && onClick) {
            onClick();
        }
    };

    return (
        <div 
            className={`relative group transition-all duration-200 ${className} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={handleClick}
        >
            {children}
            {!disabled && (
                <div 
                    className="absolute inset-0 rounded-[3.5vw] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-gradient-to-br from-[#FF8C7A]/40 to-[#2EC4B6]/40 backdrop-blur-[0.6vw] flex items-center justify-center"
                >
                    <div className="flex items-center justify-center w-full h-full">
                        <img src={DeepDive} alt="DeepDive" className='w-[70%] h-auto' />
                    </div>
                </div>
            )}
        </div>
    );
}

export default HoverOverlay;