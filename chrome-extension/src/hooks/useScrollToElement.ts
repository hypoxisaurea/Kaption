import { useCallback } from "react";

export interface UseScrollToElementOptions {
  behavior?: ScrollBehavior;
  block?: ScrollLogicalPosition;
  inline?: ScrollLogicalPosition;
  delay?: number;
}

export function useScrollToElement({
  behavior = "smooth",
  block = "nearest",
  inline = "nearest",
  delay = 0,
}: UseScrollToElementOptions = {}) {
  const scrollToElement = useCallback(
    (elementId: string) => {
      const scroll = () => {
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior, block, inline });
        }
      };

      if (delay > 0) {
        setTimeout(scroll, delay);
      } else {
        scroll();
      }
    },
    [behavior, block, inline, delay]
  );

  const scrollToElementByRef = useCallback(
    (elementRef: React.RefObject<HTMLElement>) => {
      const scroll = () => {
        if (elementRef.current) {
          elementRef.current.scrollIntoView({ behavior, block, inline });
        }
      };

      if (delay > 0) {
        setTimeout(scroll, delay);
      } else {
        scroll();
      }
    },
    [behavior, block, inline, delay]
  );

  return { scrollToElement, scrollToElementByRef };
}

export default useScrollToElement;
