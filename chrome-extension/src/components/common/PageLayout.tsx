import React from 'react';
import Header from './Header';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

function PageLayout({ children, className = '', contentClassName = '' }: PageLayoutProps) {
  return (
    <div className={`w-full min-h-screen bg-[#1b1b1b] overflow-x-hidden hide-scrollbar ${className}`}>
      <div className='w-full box-border flex justify-center px-[5vw] py-[2vh] overflow-x-hidden'>
        <div className='w-full min-w-0 max-w-md sm:max-w-lg lg:max-w-2xl'>
          
          <div className='py-[2vh] mb-[3vh]'>
            <Header />
          </div>
          
          <div className={contentClassName}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PageLayout;
