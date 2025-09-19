// src/index.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import App from 'App';
import reportWebVitals from 'reportWebVitals';

import { LandingPage, StartPage, OptionPage, ContentPage, DefaultPage, MyPage } from 'pages';

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
        path: '/default',
        element: <DefaultPage />,
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
]);


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


