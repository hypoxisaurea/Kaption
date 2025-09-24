import { useEffect, useState } from 'react';

export function useFadeIn(): boolean {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const rafId = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(rafId);
  }, []);
  return isVisible;
}

export default useFadeIn;


