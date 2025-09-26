import React from 'react';

interface LoadingIndicatorProps {
  label?: string;
}

function LoadingIndicator({ label = 'Analyzing...' }: LoadingIndicatorProps) {
  return (
    <div className='flex items-center justify-center py-8'>
      <div className='size-8 rounded-full border-b-2 border-blue-600 animate-spin'></div>
      <span className='ml-3 text-gray-600'>{label}</span>
    </div>
  );
}

export default LoadingIndicator;