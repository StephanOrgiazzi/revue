import type { MarkdownTextSizeLevel, Theme, ThemeId, ThemeOption } from "@/shared/themes/types";
import type { TableOfContentsHeading } from "@/shared/ui/types";

import { useDisclosure } from "@/shared/logic/useDisclosure";
import { ControlsSheet } from "@/shared/ui/ControlsSheet";
import { FloatingMenuButton } from "@/shared/ui/FloatingMenuButton";

type ReaderControlsOverlayProps = {
  isFloatingMenuVisible: boolean;
  floatingMenuBottomOffset: number;
  theme: Theme;
  themeOptions: readonly ThemeOption[];
  activeThemeId: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
  activeMarkdownTextSizeLevel: MarkdownTextSizeLevel;
  onSelectMarkdownTextSizeLevel: (nextMarkdownTextSizeLevel: MarkdownTextSizeLevel) => void;
  headings: TableOfContentsHeading[];
  activeHeadingSlug: string | null;
  onSelectHeading: (heading: TableOfContentsHeading) => void;
  onExitReader: () => void;
};

export function ReaderControlsOverlay({
  isFloatingMenuVisible,
  floatingMenuBottomOffset,
  theme,
  themeOptions,
  activeThemeId,
  onSelectTheme,
  activeMarkdownTextSizeLevel,
  onSelectMarkdownTextSizeLevel,
  headings,
  activeHeadingSlug,
  onSelectHeading,
  onExitReader,
}: ReaderControlsOverlayProps) {
  const {
    isOpen: isControlsSheetVisible,
    open: handleOpenControls,
    close: handleCloseControls,
  } = useDisclosure();

  return (
    <>
      <FloatingMenuButton
        bottomOffset={floatingMenuBottomOffset}
        theme={theme}
        onPress={handleOpenControls}
        visible={isFloatingMenuVisible}
      />

      <ControlsSheet
        visible={isControlsSheetVisible}
        theme={theme}
        themeOptions={themeOptions}
        activeThemeId={activeThemeId}
        onSelectTheme={onSelectTheme}
        showMarkdownTextSizeSelection
        activeMarkdownTextSizeLevel={activeMarkdownTextSizeLevel}
        onSelectMarkdownTextSizeLevel={onSelectMarkdownTextSizeLevel}
        headings={headings}
        activeHeadingSlug={activeHeadingSlug}
        onSelectHeading={onSelectHeading}
        onExitReader={onExitReader}
        onClose={handleCloseControls}
      />
    </>
  );
}
