// src/App.tsx

import React from 'react';
import {
  Outlet, // 중첩된 라우트를 렌더링하기 위한 컴포넌트
} from 'react-router-dom';

// Header/Footer는 개별 페이지에서 렌더링합니다.

function App() {
  return (
    // 사이드 패널 크기를 꽉 채우는 컨테이너 역할
    <div className="flex h-screen w-full flex-col">
      {/* Outlet은 자식 라우트의 컴포넌트를 렌더링하는 공간 */}
      <div className="overflow-y-auto flex-1">
        <Outlet />
      </div>
    </div>
  );
}

export default App;