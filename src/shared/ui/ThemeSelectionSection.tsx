import { memo, useMemo } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";

import type { Theme, ThemeId, ThemeOption } from "@/shared/themes/themes";

type ThemeSelectionSectionProps = {
  theme: Theme;
  themeOptions: readonly ThemeOption[];
  activeThemeId: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
};

export const ThemeSelectionSection = memo(
  ({ theme, themeOptions, activeThemeId, onSelectTheme }: ThemeSelectionSectionProps) => {
    const { width: windowWidth } = useWindowDimensions();

    const themeDimensions = useMemo(() => {
      const availableWidth = windowWidth - 48;
      const count = themeOptions.length;
      const maxPossibleSize = (availableWidth - (count - 1) * 8) / count;
      const swatchSize = Math.max(34, Math.min(48, maxPossibleSize));

      return {
        swatchSize,
        fontSize: swatchSize < 42 ? 9 : 10,
        checkSize: swatchSize < 42 ? 16 : 20,
      };
    }, [windowWidth, themeOptions.length]);

    return (
      <View className="mt-1">
        <Text
          className="text-[10px] font-bold uppercase tracking-[0.9px]"
          style={{ color: theme.colors.textMuted }}
        >
          Theme Selection
        </Text>
        <View className="mt-3 flex-row items-start justify-between">
          {themeOptions.map((option) => {
            const isSelected = option.id === activeThemeId;

            return (
              <Pressable
                key={option.id}
                className="flex-1 items-center"
                onPress={() => {
                  onSelectTheme(option.id);
                }}
              >
                <View
                  className="items-center justify-center rounded-full border-2"
                  style={{
                    width: themeDimensions.swatchSize,
                    height: themeDimensions.swatchSize,
                    backgroundColor: option.swatchColor,
                    borderColor: isSelected
                      ? theme.colors.themeOptionSelectedBorder
                      : theme.colors.themeOptionBorder,
                  }}
                >
                  {isSelected ? (
                    <Text
                      className="font-bold"
                      style={{
                        color: theme.colors.textPrimary,
                        fontSize: themeDimensions.checkSize,
                      }}
                    >
                      ✓
                    </Text>
                  ) : null}
                </View>
                <Text
                  className="mt-2 text-center font-bold uppercase tracking-[0.5px]"
                  style={{
                    color: isSelected ? theme.colors.textPrimary : theme.colors.textMuted,
                    fontSize: themeDimensions.fontSize,
                    lineHeight: themeDimensions.fontSize * 1.2,
                  }}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  },
);

ThemeSelectionSection.displayName = "ThemeSelectionSection";
