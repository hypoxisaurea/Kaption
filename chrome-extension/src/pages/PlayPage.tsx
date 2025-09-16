import React from 'react'
import { Link, useNavigate } from 'react-router-dom';
import Header from 'components/common/Header';
import PlayButton from 'assets/images/button_play.png'

function PlayPage() {
    const navigate = useNavigate();
    const handleButtonClick = () => {
        navigate('/home');
    };

    return (
        <div className='flex flex-col min-h-screen'>
            <Header />
            <div className='flex items-center justify-center flex-1 w-full'>
                <img src={PlayButton} className='w-[40%]' />
            </div>
        </div>
    )
}


export default PlayPage;