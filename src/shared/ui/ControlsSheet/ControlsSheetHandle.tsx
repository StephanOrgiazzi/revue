import { Pressable, Text, View } from "react-native";

import type { Theme } from "@/shared/themes/themes";

type ControlsSheetHandleProps = {
  theme: Theme;
  sheetTitle: string;
  canExitReader: boolean;
  onExitReaderPress: () => void;
};

export function ControlsSheetHandle({
  theme,
  sheetTitle,
  canExitReader,
  onExitReaderPress,
}: ControlsSheetHandleProps) {
  return (
    <View className="px-6 pb-[10px] pt-2">
      <View
        className="mb-4 h-[5px] w-[60px] self-center rounded-[99px]"
        style={{ backgroundColor: theme.colors.sheetHandle }}
      />
      <Text
        className="mb-[14px] text-[22px] font-semibold leading-7 tracking-[-0.3px]"
        style={{ color: theme.colors.textMuted }}
      >
        {sheetTitle}
      </Text>

      {canExitReader ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Exit reader and return to library"
          className="mb-[18px] flex-row items-center justify-between rounded-[18px] border px-[14px] py-3"
          style={{
            backgroundColor: theme.colors.tocItemActiveBackground,
            borderColor: theme.colors.surfaceBorder,
          }}
          onPress={onExitReaderPress}
        >
          <View>
            <Text
              className="text-xs font-bold uppercase leading-[14px] tracking-[0.7px]"
              style={{ color: theme.colors.textMuted }}
            >
              Exit Reader
            </Text>
            <Text
              className="mt-0.5 text-base font-semibold leading-[22px]"
              style={{ color: theme.colors.headingPrimary }}
            >
              Back to Library
            </Text>
          </View>
          <Text
            className="text-[26px] font-light leading-[26px]"
            style={{ color: theme.colors.textMuted }}
          >
            ›
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
