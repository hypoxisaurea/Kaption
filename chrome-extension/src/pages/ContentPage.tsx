import React, { useEffect, useState } from 'react'
import VideoInfo from 'components/ContentPage/VideoInfo';


function ContentPage() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const rafId = requestAnimationFrame(() => setIsVisible(true));
        return () => cancelAnimationFrame(rafId);
    }, []);

    return (
        <div
            className={`overflow-hidden transition-opacity duration-[350ms] ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{ willChange: 'opacity' }}
        >
            <div className='w-full flex-1 p-4 sm:px-10'>
                <VideoInfo />
            </div>
        </div>
    )
}

export default ContentPage;