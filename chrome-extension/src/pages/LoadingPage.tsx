import React from 'react'

function LoadingPage() {
    return (
      <div className='w-full box-border flex justify-center px-10 py-4 overflow-x-hidden'>
        <div className='w-full min-w-0 max-w-md sm:max-w-lg lg:max-w-2xl'>
          {/* VideoInfo Skeleton */}
          <div className='w-full py-4'>
            <div className='w-full overflow-hidden rounded-lg border border-gray-200 px-8 flex min-w-0 flex-col md:flex-row items-start gap-4 md:gap-6'>
              <div className='flex justify-center w-full md:w-auto'>
                <div className='h-36 w-full sm:w-48 md:w-56 lg:w-64 rounded-md bg-gray-200 animate-pulse' />
              </div>
              <div className='min-w-0 flex-1 space-y-2 text-left'>
                <div className='h-5 w-3/4 bg-gray-200 rounded animate-pulse' />
                <div className='h-4 w-full bg-gray-100 rounded animate-pulse' />
              </div>
            </div>
          </div>

          {/* ContentModule Skeletons */}
          <div className='mt-6 space-y-4'>
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className='bg-white rounded-lg shadow-md p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='h-5 w-24 bg-gray-200 rounded animate-pulse' />
                  <div className='h-6 w-28 bg-blue-100 rounded-full animate-pulse' />
                </div>
                <div className='space-y-4'>
                  <div>
                    <div className='h-4 w-20 bg-gray-200 rounded mb-2 animate-pulse' />
                    <div className='h-4 w-2/3 bg-gray-100 rounded animate-pulse' />
                  </div>
                  <div>
                    <div className='h-4 w-20 bg-gray-200 rounded mb-2 animate-pulse' />
                    <div className='h-4 w-5/6 bg-gray-100 rounded animate-pulse' />
                  </div>
                  <div>
                    <div className='h-4 w-24 bg-gray-200 rounded mb-2 animate-pulse' />
                    <div className='h-4 w-3/4 bg-gray-100 rounded animate-pulse' />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
}

export default LoadingPage;