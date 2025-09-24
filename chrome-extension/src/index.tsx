// src/index.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import App from 'App';
import reportWebVitals from 'reportWebVitals';

import { LandingPage, StartPage, OptionPage, ContentPage, MyPage, LoadingPage } from 'pages';

// 개발 편의: ?route=/content 처럼 쿼리로 초기 경로를 지정할 수 있게 함
const params = new URLSearchParams(window.location.search);
const paramRoute = params.get('route');
const initialRoute = paramRoute && paramRoute.startsWith('/') ? paramRoute : '/';

const router = createMemoryRouter([
  {
    path: '/',
    element: <App />, // App을 최상위 부모 라우트로 설정
    children: [
      {
        path: '/',
        element: <LandingPage />,
      },
      {
        path: '/start',
        element: <StartPage />,
      },
      {
        path: '/option',
        element: <OptionPage />,
      },
      {
        path: '/loading',
        element: <LoadingPage />,
      },
      {
        path: '/my',
        element: <MyPage />,
      },
      {
        path: '/content',
        element: <ContentPage />,
      }
    ],
  },
], { initialEntries: [initialRoute] });


const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();


