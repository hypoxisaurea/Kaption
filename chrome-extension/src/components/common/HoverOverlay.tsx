import React from 'react';

interface HoverOverlayProps {
    children: React.ReactNode;
    onClick?: () => void;
    overlayColor?: string;
    hoverOpacity?: number;
    className?: string;
    disabled?: boolean;
}

function HoverOverlay({ 
    children, 
    onClick, 
    overlayColor = 'rgba(46, 196, 182, 0.1)', 
    hoverOpacity = 0.2,
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
            className={`relative group cursor-pointer transition-all duration-200 ${className}`}
            onClick={handleClick}
        >
            {children}
            <div 
                className="absolute inset-0 rounded-[3.5vw] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                style={{
                    backgroundColor: overlayColor,
                    opacity: disabled ? 0 : undefined
                }}
            />
            {!disabled && (
                <div 
                    className="absolute inset-0 rounded-[3.5vw] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                    style={{
                        backgroundColor: overlayColor,
                        opacity: hoverOpacity
                    }}
                />
            )}
        </div>
    );
}

export default HoverOverlay;
