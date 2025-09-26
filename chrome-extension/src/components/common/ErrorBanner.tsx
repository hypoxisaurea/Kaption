import React from 'react';

interface ErrorBannerProps {
  title?: string;
  message: string;
}

function ErrorBanner({ title = 'Error occured', message }: ErrorBannerProps) {
  return (
    <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-4'>
      <div className='text-red-800 font-medium'>{title}</div>
      <div className='text-red-700 text-sm mt-1'>{message}</div>
    </div>
  );
}

export default ErrorBanner;


