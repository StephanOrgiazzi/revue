import type { LayoutChangeEvent } from "react-native";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Gesture } from "react-native-gesture-handler";
import { useAnimatedStyle, useSharedValue } from "react-native-reanimated";

import type { MarkdownTextSizeLevel } from "@/shared/themes/types";

import { MARKDOWN_TEXT_SIZE_LEVELS } from "@/shared/themes/markdownTextSize";

const THUMB_SIZE = 22;

type UseMarkdownTextSizeSliderInput = {
  activeMarkdownTextSizeLevel: MarkdownTextSizeLevel;
  onSelectMarkdownTextSizeLevel: (nextMarkdownTextSizeLevel: MarkdownTextSizeLevel) => void;
};

export function useMarkdownTextSizeSlider({
  activeMarkdownTextSizeLevel,
  onSelectMarkdownTextSizeLevel,
}: UseMarkdownTextSizeSliderInput) {
  const [trackWidth, setTrackWidth] = useState(0);

  const maxLevelIndex = MARKDOWN_TEXT_SIZE_LEVELS.length - 1;

  const activeLevelIndex = Math.max(0, getLevelIndex(activeMarkdownTextSizeLevel));

  const targetProgress = getProgressFromLevelIndex(activeLevelIndex, maxLevelIndex);

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

  const commitSelectionAtProgress = useCallback(
    (nextProgress: number) => {
      const nextLevel = getLevelFromProgress(nextProgress);

      onSelectMarkdownTextSizeLevel(nextLevel);
      progress.value = getProgressFromLevelIndex(getLevelIndex(nextLevel), maxLevelIndex);
    },
    [maxLevelIndex, onSelectMarkdownTextSizeLevel, progress],
  );

  const gesture = useMemo(() => {
    const finishSelection = (gestureX: number) => {
      if (trackWidth <= 0) {
        return;
      }

      const nextProgress = getProgressFromGestureX(gestureX, trackWidth, progress.value);
      commitSelectionAtProgress(nextProgress);
    };

    const panGesture = Gesture.Pan()
      .runOnJS(true)
      .onStart((event) => {
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
        finishSelection(event.x);
      })
      .onFinalize((_event, success) => {
        const wasDragging = isDragging.value;
        isDragging.value = false;

        if (!success && wasDragging) {
          progress.value = targetProgress;
        }
      });

    const tapGesture = Gesture.Tap()
      .runOnJS(true)
      .onEnd((event, success) => {
        if (!success) {
          return;
        }

        finishSelection(event.x);
      });

    return Gesture.Race(panGesture, tapGesture);
  }, [commitSelectionAtProgress, isDragging, progress, targetProgress, trackWidth]);

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

function clampProgress(progress: number): number {
  return Math.max(0, Math.min(1, progress));
}

function getLevelFromProgress(progress: number): MarkdownTextSizeLevel {
  const maxIndex = MARKDOWN_TEXT_SIZE_LEVELS.length - 1;

  const snappedIndex = Math.round(progress * maxIndex);

  return MARKDOWN_TEXT_SIZE_LEVELS[snappedIndex] ?? MARKDOWN_TEXT_SIZE_LEVELS[0];
}

function getLevelIndex(markdownTextSizeLevel: MarkdownTextSizeLevel): number {
  return MARKDOWN_TEXT_SIZE_LEVELS.indexOf(markdownTextSizeLevel);
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

function getProgressFromLevelIndex(levelIndex: number, maxLevelIndex: number): number {
  return maxLevelIndex === 0 ? 0 : levelIndex / maxLevelIndex;
}
