import { View } from "react-native";

import type { MarkdownTextSizeLevel } from "@/shared/themes/markdownTextSize";
import type { Theme, ThemeId, ThemeOption } from "@/shared/themes/themes";
import { MarkdownTextSizeSection } from "@/shared/ui/MarkdownTextSizeSection";
import { ThemeSelectionSection } from "@/shared/ui/ThemeSelectionSection";

type ControlsSheetSettingsContentProps = {
  theme: Theme;
  canShowThemeSelection: boolean;
  themeOptions?: readonly ThemeOption[];
  activeThemeId?: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
  canShowMarkdownTextSizeSelection: boolean;
  activeMarkdownTextSizeLevel?: MarkdownTextSizeLevel;
  onSelectMarkdownTextSizeLevel: (markdownTextSizeLevel: MarkdownTextSizeLevel) => void;
};

export function ControlsSheetSettingsContent({
  theme,
  canShowThemeSelection,
  themeOptions,
  activeThemeId,
  onSelectTheme,
  canShowMarkdownTextSizeSelection,
  activeMarkdownTextSizeLevel,
  onSelectMarkdownTextSizeLevel,
}: ControlsSheetSettingsContentProps) {
  const shouldRenderMarkdownTextSize =
    canShowMarkdownTextSizeSelection && activeMarkdownTextSizeLevel !== undefined;
  const shouldRenderThemeSelection =
    canShowThemeSelection && themeOptions !== undefined && activeThemeId !== undefined;

  return (
    <>
      {shouldRenderMarkdownTextSize ? (
        <MarkdownTextSizeSection
          theme={theme}
          activeMarkdownTextSizeLevel={activeMarkdownTextSizeLevel}
          onSelectMarkdownTextSizeLevel={onSelectMarkdownTextSizeLevel}
        />
      ) : null}

      {shouldRenderThemeSelection && shouldRenderMarkdownTextSize ? (
        <View className="mb-[18px] mt-3 h-px" style={{ backgroundColor: theme.colors.divider }} />
      ) : null}

      {shouldRenderThemeSelection ? (
        <ThemeSelectionSection
          theme={theme}
          themeOptions={themeOptions}
          activeThemeId={activeThemeId}
          onSelectTheme={onSelectTheme}
        />
      ) : null}
    </>
  );
}
