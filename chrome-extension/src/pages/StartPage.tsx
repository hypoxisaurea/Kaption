import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from 'components/Logo';
import Slogan from 'components/LandingPage/Slogan';
import Button from 'components/BlackButton';
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
      className={`flex flex-col items-center justify-center h-screen overflow-hidden bg-white ${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
      style={{ willChange: 'opacity' }}
    >
      <Logo width='15%'/>
      <HorizontalSpacing height='5%'/>
      <Slogan>Kaption uncovers the hidden cultural gems in K-content</Slogan>
      <HorizontalSpacing height='0.5%'/>
      <Slogan>Dive deeper into Korea</Slogan>
      <HorizontalSpacing height='2%'/>
      <Slogan>Faster, Smarter, Better - </Slogan>
      <HorizontalSpacing height='5%'/>
      <Button bgColor="bg-black" textColor="text-white" onClick={handleButtonClick}>Get Started</Button>
    </div>
  )
}

export default StartPage;