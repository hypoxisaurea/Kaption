import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import Logo from 'assets/images/logo_white.png';

function LandingPage() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => setIsVisible(true));
    const fadeOutId = setTimeout(() => setIsFadingOut(true), 1600);
    const navId = setTimeout(() => navigate('/start'), 2000);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(fadeOutId);
      clearTimeout(navId);
    };
  }, [navigate]);

  return (
    <div
      className={`fixed inset-0 overflow-hidden bg-gradient-to-br from-[#FF8C7A]/30 to-[#2EC4B6]/30 ${isVisible && !isFadingOut ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
      style={{ willChange: 'opacity' }}
    >
      <div className="flex h-full w-full items-center justify-center">
      <img
            src={Logo}
            className="block mx-auto h-auto w-[10%]"
        />
      </div>
    </div>
  )
}

export default LandingPage;