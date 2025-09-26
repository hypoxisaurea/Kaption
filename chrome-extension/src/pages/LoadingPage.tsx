import React from 'react';
import { DotLoader } from 'react-spinners'
interface LoadingPageProps {
  label?: string;
}

function LoadingPage({ label = 'Analyzing...' }: LoadingPageProps) {
  return (
    <div className='w-full h-screen flex flex-col items-center justify-center'>
      <DotLoader color="#FF8C7A" className='mb-10' size={40}/>
      <span className='font-medium text-[1.3rem] text-[#1b1b1b]'>{label}</span>
    </div>
  );
}

export default LoadingPage;