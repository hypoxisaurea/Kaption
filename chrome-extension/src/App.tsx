// src/App.tsx

import React from 'react';
import {
  Outlet, // 중첩된 라우트를 렌더링하기 위한 컴포넌트
  useLocation,
} from 'react-router-dom';
import { WhiteHeader } from 'components';
import useFadeIn from 'hooks/useFadeIn';

function App() {
  const isVisible = useFadeIn();
  const location = useLocation();
  const showHeader = location.pathname === '/content' || location.pathname === '/my';
  

  return (
    <div className="flex h-screen w-full flex-col">
      {showHeader && <WhiteHeader />}
      <div
        className={`relative flex-1 overflow-y-auto transition-opacity duration-[350ms] ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{ willChange: 'opacity' }}
      >
        <Outlet />
      </div>
    </div>
  );
}

export default App;