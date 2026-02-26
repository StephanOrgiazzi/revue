import { useCallback, useEffect, useMemo, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import { useAnimatedStyle, useSharedValue } from "react-native-reanimated";

import {
  MARKDOWN_TEXT_SIZE_LEVELS,
  type MarkdownTextSizeLevel,
} from "@/shared/themes/markdownTextSize";

const THUMB_SIZE = 22;

type UseMarkdownTextSizeSliderInput = {
  activeMarkdownTextSizeLevel: MarkdownTextSizeLevel;
  onSelectMarkdownTextSizeLevel: (nextMarkdownTextSizeLevel: MarkdownTextSizeLevel) => void;
};

function getLevelIndex(markdownTextSizeLevel: MarkdownTextSizeLevel): number {
  return MARKDOWN_TEXT_SIZE_LEVELS.indexOf(markdownTextSizeLevel);
}

function getLevelFromProgress(progress: number): MarkdownTextSizeLevel {
  const maxIndex = MARKDOWN_TEXT_SIZE_LEVELS.length - 1;
  const snappedIndex = Math.round(progress * maxIndex);

  return MARKDOWN_TEXT_SIZE_LEVELS[snappedIndex] ?? MARKDOWN_TEXT_SIZE_LEVELS[0];
}

function clampProgress(progress: number): number {
  return Math.max(0, Math.min(1, progress));
}

function getProgressFromGestureX(
  gestureX: number,
  trackWidth: number,
  fallbackProgress: number,
): number {
  if (!Number.isFinite(gestureX) || trackWidth <= 0) {
    return fallbackProgress;
  }

  return clampProgress(gestureX / trackWidth);
}

export function useMarkdownTextSizeSlider({
  activeMarkdownTextSizeLevel,
  onSelectMarkdownTextSizeLevel,
}: UseMarkdownTextSizeSliderInput) {
  const [trackWidth, setTrackWidth] = useState(0);

  const maxLevelIndex = MARKDOWN_TEXT_SIZE_LEVELS.length - 1;
  const activeLevelIndex = Math.max(0, getLevelIndex(activeMarkdownTextSizeLevel));
  const targetProgress = maxLevelIndex === 0 ? 0 : activeLevelIndex / maxLevelIndex;

  const progress = useSharedValue(targetProgress);
  const isDragging = useSharedValue(false);

  useEffect(() => {
    if (!isDragging.value) {
      progress.value = targetProgress;
    }
  }, [targetProgress, isDragging, progress]);

  const onTrackLayout = useCallback((event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  }, []);

  const gesture = useMemo(() => {
    return Gesture.Pan()
      .runOnJS(true)
      .onBegin((event) => {
        if (trackWidth <= 0) {
          return;
        }

        isDragging.value = true;
        progress.value = getProgressFromGestureX(event.x, trackWidth, progress.value);
      })
      .onUpdate((event) => {
        if (trackWidth <= 0) {
          return;
        }

        progress.value = getProgressFromGestureX(event.x, trackWidth, progress.value);
      })
      .onEnd((event) => {
        if (trackWidth <= 0) {
          return;
        }

        isDragging.value = false;

        const currentProgress = getProgressFromGestureX(event.x, trackWidth, progress.value);
        const nextLevel = getLevelFromProgress(currentProgress);

        onSelectMarkdownTextSizeLevel(nextLevel);

        const nextIndex = getLevelIndex(nextLevel);
        const snappedProgress = maxLevelIndex === 0 ? 0 : nextIndex / maxLevelIndex;
        progress.value = snappedProgress;
      });
  }, [trackWidth, onSelectMarkdownTextSizeLevel, maxLevelIndex, isDragging, progress]);

  const thumbAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: progress.value * trackWidth - THUMB_SIZE / 2 }],
    };
  });

  const activeTrackAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    };
  });

  return {
    activeTrackAnimatedStyle,
    gesture,
    onTrackLayout,
    thumbAnimatedStyle,
    thumbSize: THUMB_SIZE,
    trackWidth,
  };
}
