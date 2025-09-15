import React from 'react'
import Header from 'components/Header';
import PlayButton from 'assets/images/play_button.png'

function HomePage() {
    return (
        <div className='flex flex-col items-center justify-center overflow-hidden'>
            <Header />
            
            <div>
                <img src={PlayButton} className='w-4/5' />
            </div>
        </div>
    )
}


export default HomePage;