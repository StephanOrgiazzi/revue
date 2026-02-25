import { useCallback, useEffect, useRef } from "react";
import { Animated, Easing, Pressable, Text } from "react-native";

import type { Theme } from "@/shared/themes/themes";

const FAB_ENTRANCE_OFFSET_PX = 18;
const FAB_HIDDEN_TRANSLATE_Y_PX = 96;
const FAB_VISIBILITY_ANIMATION_DURATION_MS = 180;

type FloatingMenuButtonProps = {
  bottomOffset: number;
  theme: Theme;
  onPress: () => void;
  visible?: boolean;
  accessibilityLabel?: string;
};

export function FloatingMenuButton({
  bottomOffset,
  theme,
  onPress,
  visible = true,
  accessibilityLabel = "Open reading controls",
}: FloatingMenuButtonProps) {
  const entranceTranslateY = useRef(new Animated.Value(FAB_ENTRANCE_OFFSET_PX)).current;
  const visibilityTranslateY = useRef(
    new Animated.Value(visible ? 0 : FAB_HIDDEN_TRANSLATE_Y_PX),
  ).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(entranceTranslateY, {
      toValue: 0,
      damping: 18,
      stiffness: 220,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }, [entranceTranslateY]);

  useEffect(() => {
    Animated.timing(visibilityTranslateY, {
      toValue: visible ? 0 : FAB_HIDDEN_TRANSLATE_Y_PX,
      duration: FAB_VISIBILITY_ANIMATION_DURATION_MS,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visibilityTranslateY, visible]);

  const handlePressIn = useCallback(() => {
    Animated.spring(pressScale, {
      toValue: 0.94,
      damping: 16,
      stiffness: 280,
      mass: 0.7,
      useNativeDriver: true,
    }).start();
  }, [pressScale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(pressScale, {
      toValue: 1,
      damping: 14,
      stiffness: 250,
      mass: 0.7,
      useNativeDriver: true,
    }).start();
  }, [pressScale]);

  return (
    <Animated.View
      pointerEvents={visible ? "box-none" : "none"}
      style={{
        position: "absolute",
        right: 20,
        bottom: bottomOffset,
        transform: [
          {
            translateY: Animated.add(entranceTranslateY, visibilityTranslateY),
          },
          { scale: pressScale },
        ],
      }}
    >
      <Pressable
        className="h-14 w-14 items-center justify-center rounded-full"
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        disabled={!visible}
        style={{
          backgroundColor: theme.colors.fabBackground,
          boxShadow: `0px 4px 8px ${theme.colors.fabShadow}`,
        }}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Text
          className="-mt-0.5 text-[28px] font-bold leading-8"
          style={{ color: theme.colors.fabIcon }}
        >
          ≡
        </Text>
      </Pressable>
    </Animated.View>
  );
}
