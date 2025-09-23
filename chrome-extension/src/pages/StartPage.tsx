import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from 'assets/images/logo/logo_text_shadow.png';
import Taki from 'assets/images/character/taki.png';
import Slogan from 'components/StartPage/Slogan';
import Button from 'components/common/BlackButton';
import { HorizontalSpacing } from 'components/common';

function StartPage() {
  const navigate = useNavigate();
  const handleButtonClick = () => {
    navigate('/option');
  };

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={`flex h-screen flex-col items-center justify-center overflow-hidden bg-white ${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-[350ms]`}
      style={{ willChange: 'opacity' }}
    >
      <img src={Taki} alt='Taki' width='60%'/>
      <HorizontalSpacing height='10%'/>
      <img src={Logo} alt='Logo' width='40%'/>
      <HorizontalSpacing height='5%'/>
      <Slogan>Kaption uncovers the hidden cultural gems in K-content</Slogan>
      <HorizontalSpacing height='0.5%'/>
      <Slogan>Dive deeper into Korea</Slogan>
      <HorizontalSpacing height='2%'/>
      <Slogan>Faster, Smarter, Better - </Slogan>
      <HorizontalSpacing height='4%'/>
      <div className='w-full max-w-[50%] px-8'>
        <Button fullWidth bgColor="bg-black" textColor="text-white" className="text-[3vw]" onClick={handleButtonClick}>Get Started</Button>
      </div>
    </div>
  )
}

export default StartPage;