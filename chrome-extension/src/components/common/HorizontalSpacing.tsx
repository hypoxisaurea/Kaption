import React from 'react'

interface SpacingProps {
    height: string;
}

function HorizontalSpacing({ height }: SpacingProps) {
  return (
    <div style={{height}} aria-hidden />
  )
}


export default HorizontalSpacing;


