// src/App.tsx

import React from 'react';
import {
  Outlet, // 중첩된 라우트를 렌더링하기 위한 컴포넌트
  useLocation,
} from 'react-router-dom';
import { ColorHeader, WhiteHeader } from 'components';
import useFadeIn from 'hooks/useFadeIn';

function App() {
  const isVisible = useFadeIn();
  const location = useLocation();
  const showColorHeader = location.pathname === '/my';

  return (
    <div className="flex h-screen w-full flex-col">
      {showColorHeader && (
        <div className={`page-transition ${isVisible ? 'page-transition-fade-in' : 'page-transition-fade-out'}`}>
          <ColorHeader />
        </div>
      )}
      <div className={`relative flex-1 overflow-y-auto page-transition ${isVisible ? 'page-transition-fade-in' : 'page-transition-fade-out'}`}>
        <Outlet />
      </div>
    </div>
  );
}

export default App;