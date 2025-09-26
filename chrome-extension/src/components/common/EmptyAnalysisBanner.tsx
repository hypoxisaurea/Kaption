import React from 'react';

function EmptyAnalysisBanner() {
  return (
    <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6'>
      <div className='text-yellow-800 font-medium'>Analysis result doesn't exist</div>
      <div className='text-yellow-700 text-sm mt-1'>I can't find any cultural context to analyze in this video.</div>
    </div>
  );
}

export default EmptyAnalysisBanner;


