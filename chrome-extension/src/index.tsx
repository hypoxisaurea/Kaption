// index.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import LandingPage from './pages/LandingPage';

// const ROUTE_PATH = {
//   HOME: '/home',
//   ABOUT: '/about',
// };

const router = createMemoryRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  // {
  //   path: ROUTE_PATH.HOME,
  //   element: <HomePage />,
  // },
  // {
  //   path: ROUTE_PATH.ABOUT,
  //   element: <AboutPage />,
  // },
]);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();