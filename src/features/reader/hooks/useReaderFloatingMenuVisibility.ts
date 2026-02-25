import { useCallback, useEffect, useRef, useState } from "react";

const FLOATING_MENU_HIDE_SCROLL_DISTANCE_PX = 380;

type UseReaderFloatingMenuVisibilityParams = {
  isEnabled: boolean;
};

type UseReaderFloatingMenuVisibilityResult = {
  isFloatingMenuButtonVisible: boolean;
  handleScrollOffsetChange: (scrollOffsetY: number) => void;
};

export function useReaderFloatingMenuVisibility({
  isEnabled,
}: UseReaderFloatingMenuVisibilityParams): UseReaderFloatingMenuVisibilityResult {
  const [isFloatingMenuButtonVisible, setIsFloatingMenuButtonVisibleState] = useState(true);
  const isFloatingMenuButtonVisibleRef = useRef(true);
  const previousScrollOffsetYRef = useRef(0);
  const hideThresholdAnchorOffsetYRef = useRef(0);
  const hasInitializedAnchorRef = useRef(false);

  const setIsFloatingMenuButtonVisible = useCallback((isVisible: boolean) => {
    if (isFloatingMenuButtonVisibleRef.current === isVisible) {
      return;
    }

    isFloatingMenuButtonVisibleRef.current = isVisible;
    setIsFloatingMenuButtonVisibleState(isVisible);
  }, []);

  useEffect(() => {
    previousScrollOffsetYRef.current = 0;
    hideThresholdAnchorOffsetYRef.current = 0;
    hasInitializedAnchorRef.current = false;
    setIsFloatingMenuButtonVisible(true);
  }, [isEnabled, setIsFloatingMenuButtonVisible]);

  const handleScrollOffsetChange = useCallback(
    (scrollOffsetY: number) => {
      const currentOffsetY = Math.max(0, scrollOffsetY);
      const previousOffsetY = previousScrollOffsetYRef.current;
      previousScrollOffsetYRef.current = currentOffsetY;

      if (!isEnabled) {
        return;
      }

      if (!hasInitializedAnchorRef.current) {
        hideThresholdAnchorOffsetYRef.current = currentOffsetY;
        hasInitializedAnchorRef.current = true;
        setIsFloatingMenuButtonVisible(true);
        return;
      }

      if (currentOffsetY <= 0) {
        hideThresholdAnchorOffsetYRef.current = 0;
        setIsFloatingMenuButtonVisible(true);
        return;
      }

      if (currentOffsetY < previousOffsetY) {
        hideThresholdAnchorOffsetYRef.current = currentOffsetY;
        setIsFloatingMenuButtonVisible(true);
        return;
      }

      if (!isFloatingMenuButtonVisibleRef.current) {
        return;
      }

      const hasScrolledPastHideThreshold =
        currentOffsetY - hideThresholdAnchorOffsetYRef.current >=
        FLOATING_MENU_HIDE_SCROLL_DISTANCE_PX;
      if (!hasScrolledPastHideThreshold) {
        return;
      }

      hideThresholdAnchorOffsetYRef.current = currentOffsetY;
      setIsFloatingMenuButtonVisible(false);
    },
    [isEnabled, setIsFloatingMenuButtonVisible],
  );

  return {
    isFloatingMenuButtonVisible,
    handleScrollOffsetChange,
  };
}
