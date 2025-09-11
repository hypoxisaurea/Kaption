import React from 'react'

interface SpacingProps {
    height: string;
}

function HorizontalSpacing({ height }: SpacingProps) {
  return (
    <div style={{height}} className="flex flex-col items-center justify-center w-screen overflow-hidden bg-white"/>
  )
}


export default HorizontalSpacing;