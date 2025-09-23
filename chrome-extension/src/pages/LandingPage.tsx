import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import Logo from 'assets/images/logo/logo_white_shadow.png';

function LandingPage() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => setIsVisible(true));
    const fadeOutId = setTimeout(() => setIsFadingOut(true), 1150);
    const navId = setTimeout(() => navigate('/start'), 1500);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(fadeOutId);
      clearTimeout(navId);
    };
  }, [navigate]);

  return (
    <div
      className={`fixed inset-0 overflow-hidden bg-gradient-to-br from-[#FF8C7A]/45 to-[#2EC4B6]/45 ${isVisible && !isFadingOut ? 'opacity-100' : 'opacity-0'} transition-opacity duration-[350ms]`}
      style={{ willChange: 'opacity' }}
    >
      <div className="flex items-center justify-center w-full h-full">
        <img
            src={Logo}
            className="block mx-auto h-auto w-[10%]"
        />
      </div>
    </div>
  )
}

export default LandingPage;