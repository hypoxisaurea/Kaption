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
      // 카드 확장 시작 (중간 단계 없이 바로 전체 화면으로)
      setTransitionState({
        isTransitioning: true,
        isVisible: true,
        expandState: "fullscreen",
      });

      // 전체 화면으로 확장 후 페이지 이동
      setTimeout(() => {
        navigate(path, state ? { state } : undefined);
      }, delay);
    },
    [navigate]
  );

  const startPageEnter = useCallback(() => {
    // 페이지 진입 시 축소된 상태에서 시작
    setTransitionState({
      isTransitioning: false,
      isVisible: true,
      expandState: "entering",
    });

    // 다음 프레임에서 확장 시작
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
      // 페이지 접힘 시작 (부드럽게 한 번에)
      setTransitionState({
        isTransitioning: true,
        isVisible: true,
        expandState: "collapsing",
      });

      // 접힘 완료 후 페이지 이동
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
