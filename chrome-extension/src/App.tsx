// src/App.tsx

import React from 'react';
import {
  Outlet,
  useLocation,
} from 'react-router-dom';
import useFadeIn from 'hooks/useFadeIn';

function App() {
  const isVisible = useFadeIn();
  const location = useLocation();
  return (
    <div className="flex h-screen w-full flex-col">
      <div className={`relative flex-1 overflow-y-auto page-transition ${isVisible ? 'page-transition-fade-in' : 'page-transition-fade-out'}`}>
        <Outlet />
      </div>
    </div>
  );
}

export default App;