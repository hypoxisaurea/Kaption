import React from 'react'
import { VideoInfo } from 'components';
import useFadeIn from 'hooks/useFadeIn';


function ContentPage() {
    const isVisible = useFadeIn();

    return (
        <div
            className={`w-full overflow-x-hidden transition-opacity duration-[350ms] ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{ willChange: 'opacity' }}
        >
            <div className='w-full box-border flex justify-center px-10 py-4 overflow-x-hidden'>
                <div className='w-full min-w-0 max-w-md sm:max-w-lg lg:max-w-2xl'>
                    <VideoInfo />
                </div>
            </div>
        </div>
    )
}

export default ContentPage;