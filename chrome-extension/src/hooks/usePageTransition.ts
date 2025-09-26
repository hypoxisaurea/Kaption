import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface PageTransitionState {
  isTransitioning: boolean;
  isVisible: boolean;
  expandState: "idle" | "expanding" | "fullscreen" | "entering" | "collapsing";
}

export function usePageTransition() {
  const navigate = useNavigate();
  const [transitionState, setTransitionState] = useState<PageTransitionState>({
    isTransitioning: false,
    isVisible: true,
    expandState: "idle",
  });

  const navigateWithCardExpand = useCallback(
    (path: string, state?: any, delay: number = 200) => {
      setTransitionState({
        isTransitioning: true,
        isVisible: true,
        expandState: "fullscreen",
      });

      setTimeout(() => {
        navigate(path, state ? { state } : undefined);
      }, delay);
    },
    [navigate]
  );

  const startPageEnter = useCallback(() => {
    setTransitionState({
      isTransitioning: false,
      isVisible: true,
      expandState: "entering",
    });

    requestAnimationFrame(() => {
      setTransitionState({
        isTransitioning: false,
        isVisible: true,
        expandState: "idle",
      });
    });
  }, []);

  const navigateWithCardCollapse = useCallback(
    (path: string, state?: any, delay: number = 300) => {
      setTransitionState({
        isTransitioning: true,
        isVisible: true,
        expandState: "collapsing",
      });

      setTimeout(() => {
        navigate(path, state ? { state } : undefined);
      }, delay);
    },
    [navigate]
  );

  return {
    ...transitionState,
    navigateWithCardExpand,
    navigateWithCardCollapse,
    startPageEnter,
  };
}

export default usePageTransition;
