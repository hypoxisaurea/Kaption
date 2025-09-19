import React, { useState } from 'react';

const StarRating = () => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);


    const handleClick = (index: number) => {
        setRating(index);
    }

    const handleMouseEnter = (index: number) => {
        setHover(index);
    };

    const handleMouseLeave = () => {
        setHover(0);
    };

// 별 아이콘을 SVG로 직접 렌더링하는 함수
interface StarIconProps {
    isFilled: boolean;
}

const StarIcon: React.FC<StarIconProps> = ({ isFilled }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill={isFilled ? "currentColor" : "none"} 
        stroke={isFilled ? "none" : "currentColor"}
        strokeWidth="0.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={`w-[7.5vw] h-[7.5vw] transition-colors duration-200 ${isFilled ? 'text-black' : 'text-black'}`}
    >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

    return (
        <div className="flex flex-row items-center justify-center space-x-1">
            {[...Array(5)].map((_, index) => {
                const ratingValue = index + 1;
                const isFilled = (hover || rating) >= ratingValue;
                return (
                    <button
                        key={ratingValue}
                        type="button"
                        onClick={() => handleClick(ratingValue)}
                        onMouseEnter={() => handleMouseEnter(ratingValue)}
                        onMouseLeave={handleMouseLeave}
                        className="p-0 m-0 transition-transform bg-transparent border-none shadow-none focus:outline-none active:outline-none hover:scale-110"
                        aria-label={`${ratingValue}점 (${isFilled ? '선택됨' : '선택되지 않음'})`}
                    >
                        <StarIcon isFilled={isFilled} />
                    </button>
                );
            })}
        </div>
    );
};

export default StarRating;