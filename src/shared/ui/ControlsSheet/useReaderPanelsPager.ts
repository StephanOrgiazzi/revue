import { useCallback, useEffect, useMemo, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const PANEL_SWIPE_ACTIVATION_OFFSET_X = 12;
const PANEL_SWIPE_FAIL_OFFSET_Y = 12;
const PANEL_SWIPE_SETTLE_THRESHOLD_RATIO = 0.45;
const PANEL_SWIPE_VELOCITY_INFLUENCE = 0.12;
const PANEL_SWIPE_ANIMATION_DURATION_MS = 220;
type ReaderPanel = "toc" | "settings";

type UseReaderPanelsPagerParams = {
  visible: boolean;
  canSwipeBetweenReaderPanels: boolean;
};

export function useReaderPanelsPager({
  visible,
  canSwipeBetweenReaderPanels,
}: UseReaderPanelsPagerParams) {
  const [activeReaderPanel, setActiveReaderPanel] = useState<ReaderPanel>("toc");
  const [readerPanelsViewportWidth, setReaderPanelsViewportWidth] = useState(0);
  const isReaderPanelsPagerReady = readerPanelsViewportWidth > 0;

  const readerPanelsTranslateX = useSharedValue(0);
  const readerPanelsGestureStartX = useSharedValue(0);
  const readerPanelsWidth = useSharedValue(0);
  const readerPanelsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: readerPanelsTranslateX.value }],
  }));

  const handleReaderPanelsLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const measuredWidth = Math.round(event.nativeEvent.layout.width);
      if (measuredWidth <= 0 || measuredWidth === readerPanelsViewportWidth) {
        return;
      }

      setReaderPanelsViewportWidth(measuredWidth);
      readerPanelsWidth.value = measuredWidth;
      readerPanelsTranslateX.value = activeReaderPanel === "toc" ? 0 : -measuredWidth;
    },
    [activeReaderPanel, readerPanelsTranslateX, readerPanelsViewportWidth, readerPanelsWidth],
  );

  useEffect(() => {
    if (!visible) {
      return;
    }

    setActiveReaderPanel("toc");
    if (readerPanelsViewportWidth > 0) {
      readerPanelsTranslateX.value = 0;
    }
  }, [readerPanelsTranslateX, readerPanelsViewportWidth, visible]);

  useEffect(() => {
    if (canSwipeBetweenReaderPanels) {
      return;
    }

    setActiveReaderPanel("toc");
    readerPanelsTranslateX.value = 0;
  }, [canSwipeBetweenReaderPanels, readerPanelsTranslateX]);

  const readerPanelsSwipeGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(canSwipeBetweenReaderPanels && readerPanelsViewportWidth > 0)
        .activeOffsetX([-PANEL_SWIPE_ACTIVATION_OFFSET_X, PANEL_SWIPE_ACTIVATION_OFFSET_X])
        .failOffsetY([-PANEL_SWIPE_FAIL_OFFSET_Y, PANEL_SWIPE_FAIL_OFFSET_Y])
        .onBegin(() => {
          readerPanelsGestureStartX.value = readerPanelsTranslateX.value;
        })
        .onUpdate((event) => {
          const panelWidth = readerPanelsWidth.value;
          if (panelWidth <= 0) {
            return;
          }

          const minTranslateX = -panelWidth;
          const maxTranslateX = 0;
          const nextTranslateX = readerPanelsGestureStartX.value + event.translationX;
          readerPanelsTranslateX.value = Math.max(
            minTranslateX,
            Math.min(maxTranslateX, nextTranslateX),
          );
        })
        .onEnd((event) => {
          const panelWidth = readerPanelsWidth.value;
          if (panelWidth <= 0) {
            return;
          }

          const projectedTranslateX =
            readerPanelsTranslateX.value + event.velocityX * PANEL_SWIPE_VELOCITY_INFLUENCE;
          const clampedProjectedTranslateX = Math.max(
            -panelWidth,
            Math.min(0, projectedTranslateX),
          );
          const settleProgress = Math.abs(clampedProjectedTranslateX / panelWidth);
          const nextPanel: ReaderPanel =
            settleProgress >= PANEL_SWIPE_SETTLE_THRESHOLD_RATIO ? "settings" : "toc";
          const nextTranslateX = nextPanel === "toc" ? 0 : -panelWidth;

          readerPanelsTranslateX.value = withTiming(nextTranslateX, {
            duration: PANEL_SWIPE_ANIMATION_DURATION_MS,
            easing: Easing.out(Easing.cubic),
          });
          runOnJS(setActiveReaderPanel)(nextPanel);
        }),
    [
      canSwipeBetweenReaderPanels,
      readerPanelsGestureStartX,
      readerPanelsTranslateX,
      readerPanelsViewportWidth,
      readerPanelsWidth,
    ],
  );

  return {
    activeReaderPanel,
    handleReaderPanelsLayout,
    isReaderPanelsPagerReady,
    readerPanelsAnimatedStyle,
    readerPanelsSwipeGesture,
    readerPanelsViewportWidth,
  };
}
