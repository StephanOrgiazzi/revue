import { useEffect, useMemo } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import type { Theme } from "@/shared/themes/themes";

type ReaderSkeletonProps = {
  theme: Theme;
  contentWidth: number;
  horizontalPadding: number;
  verticalPadding: number;
  showHeader?: boolean;
};

type SkeletonBarProps = {
  width: number | `${number}%`;
  height: number;
  radius?: number;
  animationStyle: ReturnType<typeof useAnimatedStyle>;
};

function SkeletonBar({ width, height, radius = 10, animationStyle }: SkeletonBarProps) {
  return (
    <Animated.View
      style={[animationStyle, { width, height, borderRadius: radius, maxWidth: "100%" }]}
    />
  );
}

export function ReaderSkeleton({
  theme,
  contentWidth,
  horizontalPadding,
  verticalPadding,
  showHeader = true,
}: ReaderSkeletonProps) {
  const reducedMotionEnabled = useReducedMotion();
  const pulse = useSharedValue(reducedMotionEnabled ? 0.5 : 0);
  const paragraphRows = useMemo(
    () =>
      [
        ["95%", "90%", "82%", "68%"],
        ["93%", "89%", "79%"],
        ["91%", "86%", "77%", "66%"],
        ["94%", "88%", "80%", "69%"],
      ] as const,
    [],
  );

  useEffect(() => {
    cancelAnimation(pulse);

    if (reducedMotionEnabled) {
      pulse.value = 0.5;
      return;
    }

    pulse.value = withRepeat(
      withTiming(1, {
        duration: 1050,
        easing: Easing.inOut(Easing.quad),
        reduceMotion: ReduceMotion.System,
      }),
      -1,
      true,
      undefined,
      ReduceMotion.System,
    );

    return () => {
      cancelAnimation(pulse);
    };
  }, [pulse, reducedMotionEnabled]);

  const pulseAnimatedStyle = useAnimatedStyle(() => {
    const minimumOpacity = theme.isDark ? 0.04 : 0.05;
    const maximumOpacity = theme.isDark ? 0.08 : 0.09;

    return {
      backgroundColor: theme.isDark ? "#FFFFFF" : "#000000",
      opacity: interpolate(pulse.value, [0, 1], [minimumOpacity, maximumOpacity]),
    };
  }, [theme.isDark]);

  return (
    <View className="items-center">
      <View
        className="w-full"
        style={{
          width: contentWidth,
          paddingTop: verticalPadding,
          paddingBottom: verticalPadding,
          marginHorizontal: horizontalPadding,
        }}
      >
        {showHeader ? (
          <View className="mb-5 mt-3 gap-[11px]">
            <SkeletonBar width="52%" height={34} radius={12} animationStyle={pulseAnimatedStyle} />
            <SkeletonBar width="40%" height={14} radius={7} animationStyle={pulseAnimatedStyle} />
          </View>
        ) : null}

        {paragraphRows.map((paragraph, paragraphIndex) => (
          <View
            key={`paragraph-${paragraphIndex}`}
            className="gap-2.5"
            style={{ marginTop: paragraphIndex === 0 ? 0 : theme.spacing.blockGap }}
          >
            {paragraph.map((rowWidth, rowIndex) => (
              <SkeletonBar
                key={`row-${paragraphIndex}-${rowIndex}`}
                width={rowWidth}
                height={14}
                radius={6}
                animationStyle={pulseAnimatedStyle}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}
