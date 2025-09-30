import React from 'react';
import DeepDive from 'assets/images/icon/deepdive_black.png'

interface HoverOverlayProps {
    children: React.ReactNode;
    onClick?: () => void;
    overlayColor?: string;
    hoverOpacity?: number;
    className?: string;
    disabled?: boolean;
    showDeepDiveIcon?: boolean; // ContentPage 전용 deepdive 아이콘 표시 여부
}

function HoverOverlay({ 
    children, 
    onClick, 
    overlayColor = 'rgba(46, 196, 182, 0.1)', 
    hoverOpacity = 0.2,
    className = '',
    disabled = false,
    showDeepDiveIcon = false
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
                    className="absolute inset-0 rounded-[3.5vw] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                    style={{
                        background: showDeepDiveIcon 
                            ? 'linear-gradient(135deg, rgba(255, 140, 122, 0.4), rgba(46, 196, 182, 0.4))'
                            : overlayColor,
                        backdropFilter: showDeepDiveIcon ? 'blur(0.6vw)' : 'none'
                    }}
                >
                    {showDeepDiveIcon && (
                        <div className="flex items-center justify-center w-full h-full">
                            <img src={DeepDive} alt="DeepDive" className='w-[70%] h-auto' />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default HoverOverlay;
