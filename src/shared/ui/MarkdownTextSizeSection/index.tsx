import { memo } from "react";
import { Text, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";

import {
  MARKDOWN_TEXT_SIZE_LEVELS,
  type MarkdownTextSizeLevel,
} from "@/shared/themes/markdownTextSize";
import type { Theme } from "@/shared/themes/themes";
import { useMarkdownTextSizeSlider } from "@/shared/ui/MarkdownTextSizeSection/useMarkdownTextSizeSlider";

type MarkdownTextSizeSectionProps = {
  theme: Theme;
  activeMarkdownTextSizeLevel: MarkdownTextSizeLevel;
  onSelectMarkdownTextSizeLevel: (nextMarkdownTextSizeLevel: MarkdownTextSizeLevel) => void;
};

export const MarkdownTextSizeSection = memo(
  ({
    theme,
    activeMarkdownTextSizeLevel,
    onSelectMarkdownTextSizeLevel,
  }: MarkdownTextSizeSectionProps) => {
    const {
      activeTrackAnimatedStyle,
      gesture,
      onTrackLayout,
      thumbAnimatedStyle,
      thumbSize,
      trackWidth,
    } = useMarkdownTextSizeSlider({
      activeMarkdownTextSizeLevel,
      onSelectMarkdownTextSizeLevel,
    });

    return (
      <View className="mt-1">
        <Text
          className="text-xs font-bold uppercase tracking-[0.9px]"
          style={{ color: theme.colors.textMuted }}
        >
          Text Size
        </Text>
        <View className="mt-3 flex-row items-center">
          <Text
            className="text-sm font-semibold leading-5"
            style={{ color: theme.colors.textMuted }}
          >
            A
          </Text>
          <View className="mx-3 grow justify-center">
            <GestureDetector gesture={gesture}>
              <View
                accessibilityRole="adjustable"
                accessibilityLabel="Markdown text size"
                accessibilityValue={{
                  min: MARKDOWN_TEXT_SIZE_LEVELS[0],
                  now: activeMarkdownTextSizeLevel,
                  max: MARKDOWN_TEXT_SIZE_LEVELS[MARKDOWN_TEXT_SIZE_LEVELS.length - 1],
                }}
                className="h-8 justify-center"
                onLayout={onTrackLayout}
              >
                <View
                  pointerEvents="none"
                  className="h-1 rounded-full"
                  style={{ backgroundColor: theme.colors.divider }}
                >
                  <Animated.View
                    className="h-full rounded-full"
                    style={[
                      activeTrackAnimatedStyle,
                      {
                        backgroundColor: theme.colors.accent,
                      },
                    ]}
                  />
                </View>
                {trackWidth > 0 ? (
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      thumbAnimatedStyle,
                      {
                        width: thumbSize,
                        height: thumbSize,
                        borderRadius: thumbSize / 2,
                        borderWidth: 2,
                        borderColor: theme.colors.pageBackground,
                        backgroundColor: theme.colors.accent,
                        position: "absolute",
                        top: "50%",
                        marginTop: -thumbSize / 2,
                      },
                    ]}
                  />
                ) : null}
              </View>
            </GestureDetector>
          </View>
          <Text
            className="text-lg font-black leading-5"
            style={{ color: theme.colors.headingPrimary }}
          >
            A
          </Text>
        </View>
      </View>
    );
  },
);

MarkdownTextSizeSection.displayName = "MarkdownTextSizeSection";
