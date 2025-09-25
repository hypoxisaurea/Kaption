import React from 'react';

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
                    className="absolute inset-0 rounded-[3.5vw] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-gradient-to-br from-[#FF8C7A]/30 to-[#2EC4B6]/30 backdrop-blur-[0.4vw]"
                />
            )}
        </div>
    );
}

export default HoverOverlay;