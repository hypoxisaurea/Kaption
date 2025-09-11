// src/App.tsx

import React from 'react';
import {
  Outlet, // 중첩된 라우트를 렌더링하기 위한 컴포넌트
} from 'react-router-dom';

import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  return (
    // 사이드 패널 크기를 꽉 채우는 컨테이너 역할
    <div className="flex flex-col w-full h-screen">
      {/* Outlet은 자식 라우트의 컴포넌트를 렌더링하는 공간 */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}

export default App;