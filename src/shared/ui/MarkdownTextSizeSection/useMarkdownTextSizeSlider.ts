import { useCallback, useMemo, useState } from "react";
import { PanResponder, type GestureResponderEvent, type LayoutChangeEvent } from "react-native";

import {
  MARKDOWN_TEXT_SIZE_LEVELS,
  type MarkdownTextSizeLevel,
} from "@/shared/themes/markdownTextSize";

const THUMB_SIZE = 22;

type UseMarkdownTextSizeSliderInput = {
  activeMarkdownTextSizeLevel: MarkdownTextSizeLevel;
  onSelectMarkdownTextSizeLevel: (nextMarkdownTextSizeLevel: MarkdownTextSizeLevel) => void;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getLevelIndex(markdownTextSizeLevel: MarkdownTextSizeLevel): number {
  return MARKDOWN_TEXT_SIZE_LEVELS.indexOf(markdownTextSizeLevel);
}

function getLevelFromTrackX(trackX: number, trackWidth: number): MarkdownTextSizeLevel {
  const maxIndex = MARKDOWN_TEXT_SIZE_LEVELS.length - 1;
  const clampedTrackX = clamp(trackX, 0, trackWidth);
  const snappedIndex = Math.round((clampedTrackX / trackWidth) * maxIndex);

  return MARKDOWN_TEXT_SIZE_LEVELS[snappedIndex] ?? MARKDOWN_TEXT_SIZE_LEVELS[0];
}

export function useMarkdownTextSizeSlider({
  activeMarkdownTextSizeLevel,
  onSelectMarkdownTextSizeLevel,
}: UseMarkdownTextSizeSliderInput) {
  const [trackWidth, setTrackWidth] = useState(0);
  const activeLevelIndex = useMemo(
    () => getLevelIndex(activeMarkdownTextSizeLevel),
    [activeMarkdownTextSizeLevel],
  );
  const maxLevelIndex = MARKDOWN_TEXT_SIZE_LEVELS.length - 1;
  const activeTrackProgressRatio = maxLevelIndex === 0 ? 0 : activeLevelIndex / maxLevelIndex;
  const thumbLeftOffset = trackWidth * activeTrackProgressRatio - THUMB_SIZE / 2;
  const updateLevelFromTouchX = useCallback(
    (touchX: number) => {
      if (trackWidth <= 0) {
        return;
      }

      const nextMarkdownTextSizeLevel = getLevelFromTrackX(touchX, trackWidth);
      onSelectMarkdownTextSizeLevel(nextMarkdownTextSizeLevel);
    },
    [onSelectMarkdownTextSizeLevel, trackWidth],
  );
  const onTrackLayout = useCallback((event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  }, []);
  const handleTrackTouch = useCallback(
    (event: GestureResponderEvent) => {
      updateLevelFromTouchX(event.nativeEvent.locationX);
    },
    [updateLevelFromTouchX],
  );
  const panHandlers = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: handleTrackTouch,
        onPanResponderMove: handleTrackTouch,
      }).panHandlers,
    [handleTrackTouch],
  );

  return {
    activeTrackProgressRatio,
    onTrackLayout,
    panHandlers,
    thumbLeftOffset,
    thumbSize: THUMB_SIZE,
    trackWidth,
  };
}
