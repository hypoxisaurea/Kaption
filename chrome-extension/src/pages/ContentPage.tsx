import React, { useCallback, useEffect, useState } from 'react'
import VideoInfo from 'components/ContentPage/VideoInfo';


function ContentPage() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const rafId = requestAnimationFrame(() => setIsVisible(true));
        return () => cancelAnimationFrame(rafId);
    }, []);

    return (
        <div
            className={`transition-opacity duration-[350ms] ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{ willChange: 'opacity' }}
        >
            <div className='flex-1 w-full px-10 py-4'>
                <VideoInfo />
            </div>
        </div>
    )
}

export default ContentPage;